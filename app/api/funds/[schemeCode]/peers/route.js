import { NextResponse } from 'next/server';
import { getFundsForCategory } from '@/lib/categories';
import { getBenchmarkForCategory } from '@/lib/benchmarks';

export async function GET(request, { params }) {
    const { schemeCode } = params;
    
    try {
        // 1. Fetch the main fund to get its category
        const fundRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
        const fundData = await fundRes.json();
        
        if (!fundData || !fundData.meta) {
            return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
        }

        const category = fundData.meta.scheme_category;
        const benchmark = getBenchmarkForCategory(category, fundData.meta.scheme_name);
        
        // 2. Get peers for this category
        const peers = getFundsForCategory(category)
            .filter(p => p.code !== schemeCode)
            .slice(0, 5); // Limit to top 5 peers for performance

        // 3. Fetch basic info for each peer (in parallel)
        const peerMetrics = await Promise.all(peers.map(async (peer) => {
            try {
                const res = await fetch(`https://api.mfapi.in/mf/${peer.code}`);
                const data = await res.json();
                
                // Simple ROI calculation (Latest vs 1Y ago)
                const navs = data.data || [];
                if (navs.length < 2) return null;

                const latest = parseFloat(navs[0].nav);
                const oneYearAgo = navs.find(n => {
                    const date = new Date(n.date.split('-').reverse().join('-'));
                    const oneYear = new Date();
                    oneYear.setFullYear(oneYear.getFullYear() - 1);
                    return date <= oneYear;
                });

                const roi1Y = oneYearAgo ? ((latest - parseFloat(oneYearAgo.nav)) / parseFloat(oneYearAgo.nav)) * 100 : null;

                return {
                    schemeCode: peer.code,
                    schemeName: peer.name,
                    roi1Y: roi1Y ? roi1Y.toFixed(2) : 'N/A',
                    latestNav: latest
                };
            } catch (err) {
                return null;
            }
        }));

        // 4. Fetch Benchmark ROI for context
        let benchmarkRoi = 'N/A';
        try {
            const benchRes = await fetch(`https://api.mfapi.in/mf/${benchmark.schemeCode}`);
            const benchData = await benchRes.json();
            const bNavs = benchData.data || [];
            
            if (bNavs.length > 0) {
                const latestB = parseFloat(bNavs[0].nav);
                const oneYearAgoB = bNavs.find(n => {
                    const date = new Date(n.date.split('-').reverse().join('-'));
                    const oneYear = new Date();
                    oneYear.setFullYear(oneYear.getFullYear() - 1);
                    return date <= oneYear;
                });
                
                if (oneYearAgoB) {
                    benchmarkRoi = (((latestB - parseFloat(oneYearAgoB.nav)) / parseFloat(oneYearAgoB.nav)) * 100).toFixed(2);
                }
            }
        } catch (e) {}

        return NextResponse.json({
            category,
            benchmark: {
                name: benchmark.name,
                roi1Y: benchmarkRoi
            },
            peers: peerMetrics.filter(p => p !== null)
        });

    } catch (error) {
        console.error('Peer API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
