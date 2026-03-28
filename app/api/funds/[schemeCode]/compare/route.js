import { NextResponse } from 'next/server';
import { getFundsForCategory } from '@/lib/categories';
import { getBenchmarkForCategory } from '@/lib/benchmarks';

export async function GET(request, { params }) {
    const { schemeCode } = params;
    
    try {
        // 1. Fetch the main fund metadata
        const fundRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
        const fundData = await fundRes.json();
        
        if (!fundData || !fundData.meta) {
            return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
        }

        const category = fundData.meta.scheme_category;
        const benchmark = getBenchmarkForCategory(category, fundData.meta.scheme_name);
        console.log(`[Compare API] Fund: ${fundData.meta.scheme_name}, Category: ${category}, Benchmark: ${benchmark.name} (${benchmark.schemeCode})`);
        
        // 2. Fetch Benchmark Data
        const benchRes = await fetch(`https://api.mfapi.in/mf/${benchmark.schemeCode}`);
        const benchData = await benchRes.json();
        
        if (!benchData || !benchData.data) {
            console.error(`[Compare API] Benchmark data missing for ${benchmark.schemeCode}`);
            return NextResponse.json({ error: 'Benchmark data unavailable' }, { status: 404 });
        }

        // 3. Helper to calculate Trailing 12 Month (T1M) ROI
        const calculateT1M = (dataSeries) => {
            if (!dataSeries || dataSeries.length < 2) return null;
            const latest = parseFloat(dataSeries[0].nav);
            // Search for ~1 year ago
            const prevIndex = Math.min(250, dataSeries.length - 1);
            const prev = parseFloat(dataSeries[prevIndex].nav);
            return ((latest - prev) / prev) * 100;
        };

        const benchmarkTTM = calculateT1M(benchData.data);
        console.log(`[Compare API] benchmarkTTM: ${benchmarkTTM}`);

        // 4. Helper to calculate periodic returns
        const calculateReturns = (dataSeries, period = 'year') => {
            if (!dataSeries || dataSeries.length < 2) return [];
            
            const points = [];
            const sortedData = [...dataSeries].reverse(); // Oldest first
            
            let currentPeriod = null;
            let periodStartNav = null;

            sortedData.forEach(item => {
                const parts = item.date.split('-');
                if (parts.length !== 3) return;
                const [d, m, y] = parts;
                const date = new Date(`${y}-${m}-${d}`);
                let periodKey;
                
                if (period === 'year') periodKey = y;
                else if (period === 'quarter') periodKey = `${y}-Q${Math.floor((date.getMonth() + 3) / 3)}`;
                else if (period === 'month') periodKey = `${y}-${m}`;
                
                if (periodKey !== currentPeriod) {
                    if (currentPeriod && periodStartNav) {
                        const periodEndNav = parseFloat(item.nav);
                        const ret = ((periodEndNav - periodStartNav) / periodStartNav) * 100;
                        points.push({ period: currentPeriod, return: parseFloat(ret.toFixed(2)) });
                    }
                    currentPeriod = periodKey;
                    periodStartNav = parseFloat(item.nav);
                }
            });
            return points;
        };

        const fundAnnual = calculateReturns(fundData.data, 'year').slice(-10);
        const fundQuarterly = calculateReturns(fundData.data, 'quarter').slice(-12);
        
        const benchAnnual = calculateReturns(benchData.data, 'year').slice(-10);
        const benchQuarterly = calculateReturns(benchData.data, 'quarter').slice(-12);

        // 5. Align series
        const alignSeries = (fSeries, bSeries) => {
            return fSeries.map(f => {
                const b = bSeries.find(br => br.period === f.period);
                return {
                    period: f.period,
                    fund: f.return,
                    benchmark: b ? b.return : null
                };
            });
        };

        const historical = {
            annual: alignSeries(fundAnnual, benchAnnual),
            quarterly: alignSeries(fundQuarterly, benchQuarterly)
        };

        // 6. Get peers with ROI
        const peerCodes = getFundsForCategory(category)
            .filter(p => p.code !== schemeCode)
            .slice(0, 5);
        
        console.log(`[Compare API] Found ${peerCodes.length} peers`);

        const peersWithMetrics = await Promise.all(peerCodes.map(async (p) => {
            try {
                const r = await fetch(`https://api.mfapi.in/mf/${p.code}`);
                const d = await r.json();
                const navs = d.data || [];
                const roi = calculateT1M(navs);
                return { ...p, roi1Y: roi !== null ? roi.toFixed(2) : 'N/A' };
            } catch (e) {
                console.error(`[Compare API] Peer fetch error for ${p.code}:`, e.message);
                return { ...p, roi1Y: 'N/A' };
            }
        }));

        return NextResponse.json({
            category,
            benchmarkName: benchmark.name,
            benchmarkTTM: benchmarkTTM ? benchmarkTTM.toFixed(2) : null,
            historical,
            peers: peersWithMetrics.map(p => ({
                schemeCode: p.code,
                schemeName: p.name,
                roi1Y: p.roi1Y
            }))
        });

    } catch (error) {
        console.error('[Compare API Master Error]:', error);
        return NextResponse.json({ 
            error: 'Comparison calculation failed', 
            details: error.message 
        }, { status: 500 });
    }
}
