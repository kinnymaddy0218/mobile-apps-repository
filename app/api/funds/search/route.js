import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getBenchmarkForCategory } from '@/lib/benchmarks';
import { computeFundMetrics } from '@/lib/calculations';

const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour
const MFAPI_BASE = 'https://api.mfapi.in';

async function getBenchmarkROI(schemeCode) {
    if (!schemeCode) return null;
    const cacheKey = `bench_roi1y:${schemeCode}`;
    let cached = getCached(cacheKey);
    if (cached !== null) return cached;

    try {
        const res = await fetch(`${MFAPI_BASE}/mf/${schemeCode}`);
        const data = await res.json();
        if (data && data.data) {
            const metrics = computeFundMetrics(data.data, data.data);
            const roi = metrics.cagr['1yr'] || 0;
            setCache(cacheKey, roi, CACHE_TTL);
            return roi;
        }
    } catch (e) {}
    return null;
}

export async function GET(request) {
    try {
        const cacheKey = 'funds:search_data:v2';
        let allFunds = getCached(cacheKey);

        if (!allFunds) {
            if (!db) {
                return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
            }

            // Fetch all category rankings
            const snapshot = await getDocs(collection(db, 'category_rankings'));
            allFunds = [];
            
            // Map to store benchmark ROIs to avoid redundant fetches
            const benchmarkROIStore = {};

            for (const doc of snapshot.docs) {
                const categoryData = doc.data();
                const categoryName = categoryData.name || doc.id;
                const funds = categoryData.funds || [];
                
                // Get benchmark for this category
                const bench = getBenchmarkForCategory(categoryName);
                if (bench && !benchmarkROIStore[bench.schemeCode]) {
                    benchmarkROIStore[bench.schemeCode] = await getBenchmarkROI(bench.schemeCode);
                }
                const benchROI = benchmarkROIStore[bench.schemeCode];

                funds.forEach(fund => {
                    allFunds.push({
                        ...fund,
                        category: categoryName,
                        benchmarkROI1Y: benchROI,
                        alpha: fund.risk?.alpha ?? (fund.alpha !== undefined ? fund.alpha : null),
                        beta: fund.beta?.beta ?? (fund.beta !== undefined ? fund.beta : (fund.risk?.beta ?? null)),
                        schemeCode: fund.schemeCode || fund.code
                    });
                });
            }

            // Deduplicate by schemeCode
            const uniqueMap = new Map();
            allFunds.forEach(f => {
                const code = f.schemeCode || f.code;
                if (code && !uniqueMap.has(code)) {
                    uniqueMap.set(code, f);
                }
            });
            allFunds = Array.from(uniqueMap.values());

            setCache(cacheKey, allFunds, CACHE_TTL);
        }

        return NextResponse.json(allFunds);
    } catch (error) {
        console.error('Search data api error:', error);
        return NextResponse.json({ error: 'Failed to fetch enriched search data' }, { status: 500 });
    }
}
