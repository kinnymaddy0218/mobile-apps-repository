import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { computeFundMetrics } from '@/lib/calculations';
import { getBenchmarkForCategory } from '@/lib/benchmarks';

const MFAPI_BASE = 'https://api.mfapi.in';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function fetchNavData(schemeCode) {
    const res = await fetch(`${MFAPI_BASE}/mf/${schemeCode}`);
    if (!res.ok) throw new Error(`MFAPI failed for scheme ${schemeCode}`);
    const data = await res.json();
    if (!data || data.status === 'ERROR') return null;
    return data;
}

export async function GET(request, { params }) {
    const { schemeCode } = params;

    try {
        if (schemeCode.startsWith('UNMATCHED_')) {
            const rawName = schemeCode.replace(/^UNMATCHED_/, '').replace(/-\d{6,15}$/, '').replace(/-/g, ' ');
            const amcMatch = rawName.toUpperCase().match(/^(SBI|HDFC|ICICI|DSP|NIPPON|QUANT|PARAG|BANDHAN|UTI|MOTILAL|KOTAK|AXIS|MIRAE|TATA|INVESCO|EDELWEISS|CANARA|BARODA|IDFC|FRANKLIN|HSBC|PGIM|PPFAS|SUNDARAM|NAVI|ADITYA|BIRLA|JM|QUANTUM)/);
            
            const AMC_MAP = {
                'ICICI': 'ICICI PRUDENTIAL MUTUAL FUND',
                'NIPPON': 'NIPPON INDIA MUTUAL FUND',
                'PPFAS': 'PPFAS MUTUAL FUND',
                'PARAG': 'PPFAS MUTUAL FUND',
                'MOTILAL': 'MOTILAL OSWAL MUTUAL FUND',
                'SBI': 'SBI MUTUAL FUND',
                'HDFC': 'HDFC MUTUAL FUND',
                'DSP': 'DSP MUTUAL FUND',
                'UTI': 'UTI MUTUAL FUND',
                'KOTAK': 'KOTAK MAHINDRA MUTUAL FUND',
                'BANDHAN': 'BANDHAN MUTUAL FUND',
                'AXIS': 'AXIS MUTUAL FUND',
                'MIRAE': 'MIRAE ASSET MUTUAL FUND',
                'TATA': 'TATA MUTUAL FUND',
                'INVESCO': 'INVESCO MUTUAL FUND',
                'EDELWEISS': 'EDELWEISS MUTUAL FUND',
                'QUANT': 'QUANT MUTUAL FUND',
                'CANARA': 'CANARA ROBECO MUTUAL FUND',
                'BARODA': 'BARODA BNP PARIBAS MUTUAL FUND',
                'IDFC': 'BANDHAN MUTUAL FUND',
                'FRANKLIN': 'FRANKLIN TEMPLETON MUTUAL FUND',
                'HSBC': 'HSBC MUTUAL FUND',
                'PGIM': 'PGIM INDIA MUTUAL FUND',
                'SUNDARAM': 'SUNDARAM MUTUAL FUND',
                'NAVI': 'NAVI MUTUAL FUND',
                'ADITYA': 'ADITYA BIRLA SUN LIFE MUTUAL FUND',
                'BIRLA': 'ADITYA BIRLA SUN LIFE MUTUAL FUND',
                'JM': 'JM FINANCIAL MUTUAL FUND',
                'QUANTUM': 'QUANTUM MUTUAL FUND'
            };
            const extractedAmc = amcMatch ? amcMatch[1] : null;
            const finalAmcName = extractedAmc ? (AMC_MAP[extractedAmc] || extractedAmc + ' MUTUAL FUND') : 'UNKNOWN AMC';
            
            return NextResponse.json({
                schemeCode,
                schemeName: rawName.toUpperCase() + ' (Details unavailable)',
                fundHouse: finalAmcName,
                schemeCategory: 'Other', // The portfolio calculator resolves category via the parser output anyway
                nav: 0,
                returns: {},
                navHistory: []
            });
        }
        const cacheKey = `fund:${schemeCode}:benchmark:v1`;
        let result = getCached(cacheKey);

        if (!result) {
            const data = await fetchNavData(schemeCode);
            if (!data) return NextResponse.json({ error: 'Fund not found' }, { status: 404 });

            const navData = data.data || [];
            const meta = data.meta || {};

            // 1. Fetch Benchmark Data
            const benchmarkSource = getBenchmarkForCategory(meta.scheme_category, meta.scheme_name);
            let benchNavData = [];
            let benchmarkMeta = {};

            try {
                // Check if benchmark data is natively cached to save double-fetching standard indices
                const benchCacheKey = `bench:${benchmarkSource.schemeCode}:raw`;
                let benchRaw = getCached(benchCacheKey);
                if (!benchRaw) {
                    benchRaw = await fetchNavData(benchmarkSource.schemeCode);
                    if (benchRaw) setCache(benchCacheKey, benchRaw, CACHE_TTL * 4); // Cache benchmark for 1 hour
                }

                if (benchRaw) {
                    benchNavData = benchRaw.data || [];
                    benchmarkMeta = benchRaw.meta || {};
                }
            } catch (e) {
                console.error("Failed to fetch benchmark data for", schemeCode, e);
            }

            // 2. Compute true metrics including Beta/Alpha relative to benchmark
            const metrics = computeFundMetrics(navData, benchNavData);

            // 3. Compute benchmark's own pure metrics
            const benchmarkMetrics = benchNavData.length > 0 ? computeFundMetrics(benchNavData, benchNavData) : null;

            // Daily change
            let dailyChange = null;
            let dailyChangePercent = null;
            if (navData.length >= 2) {
                const latestNav = parseFloat(navData[0].nav);
                const prevNav = parseFloat(navData[1].nav);
                dailyChange = latestNav - prevNav;
                dailyChangePercent = prevNav > 0 ? ((dailyChange / prevNav) * 100) : 0;
            }

            // Smart downsampling for charting
            let chartHistory;
            if (navData.length <= 500) {
                chartHistory = navData;
            } else {
                const oneYearPoints = Math.min(252, navData.length);
                const fiveYearPoints = Math.min(1260, navData.length);

                const recentData = navData.slice(0, oneYearPoints);
                const midData = navData.slice(oneYearPoints, fiveYearPoints).filter((_, i) => i % 3 === 0);
                const oldData = navData.slice(fiveYearPoints).filter((_, i) => i % 7 === 0);

                if (navData.length > fiveYearPoints) {
                    const oldest = navData[navData.length - 1];
                    if (!oldData.length || oldData[oldData.length - 1] !== oldest) {
                        oldData.push(oldest);
                    }
                }
                chartHistory = [...recentData, ...midData, ...oldData];
            }

            // 4. Fetch Factsheet Data (Scraper + PDF Extraction)
            let factsheet = null;
            try {
                // Try the high-fidelity scraper first for PE, PB, and expense ratio
                const scraperUrl = `${request.nextUrl.origin}/api/factsheets/fund?schemeCode=${schemeCode}`;
                const scraperRes = await fetch(scraperUrl);
                if (scraperRes.ok) {
                    factsheet = await scraperRes.json();
                } else {
                    // Fallback to AMC PDF Extraction if scraper fails
                    const pdfFsUrl = `${request.nextUrl.origin}/api/funds/${schemeCode}/factsheet`;
                    const pdfFsRes = await fetch(pdfFsUrl);
                    if (pdfFsRes.ok) {
                        factsheet = await pdfFsRes.json();
                    }
                }
            } catch (e) {
                console.warn(`[API] Factsheet fetch failed for ${schemeCode}:`, e.message);
            }

            result = {
                schemeCode: meta.scheme_code || schemeCode,
                schemeName: meta.scheme_name || '',
                fundHouse: meta.fund_house || '',
                schemeType: meta.scheme_type || '',
                schemeCategory: meta.scheme_category || '',
                nav: navData.length > 0 ? parseFloat(navData[0].nav) : null,
                navDate: navData.length > 0 ? navData[0].date : null,
                dailyChange,
                dailyChangePercent,
                returns: metrics.returns,
                cagr: metrics.cagr,
                risk: metrics.risk,
                benchmarkInfo: {
                    name: factsheet?.benchmark_performance?.name || benchmarkSource.name,
                    schemeCode: benchmarkSource.schemeCode,
                    actualName: benchmarkMeta.scheme_name || benchmarkSource.name
                },
                benchmarkMetrics: benchmarkMetrics ? {
                    returns: benchmarkMetrics.returns,
                    cagr: benchmarkMetrics.cagr,
                    risk: benchmarkMetrics.risk,
                } : null,
                factsheet: factsheet, // Include official factsheet data
                navHistory: chartHistory,
                totalDataPoints: navData.length,
            };

            setCache(cacheKey, result, CACHE_TTL);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error(`Fund detail error for ${schemeCode}:`, error);
        return NextResponse.json({ error: 'Failed to fetch fund details' }, { status: 500 });
    }
}
