import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getBenchmarkForCategory } from '@/lib/benchmarks';
import { computeFundMetrics } from '@/lib/calculations';

const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour
const MFAPI_BASE = 'https://api.mfapi.in';

export async function GET(request) {
    try {
        const cacheKey = 'funds:search_data:v3';
        let allFunds = getCached(cacheKey);

        if (!allFunds) {
            if (!db) {
                return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
            }

            // Fetch all category rankings
            const snapshot = await getDocs(collection(db, 'category_rankings'));

            // 1. Collect all unique benchmarks first
            const benchmarkCodes = new Set();
            for (const doc of snapshot.docs) {
                const categoryData = doc.data();
                const categoryName = categoryData.name || doc.id;
                const bench = getBenchmarkForCategory(categoryName);
                if (bench?.schemeCode) {
                    benchmarkCodes.add(bench.schemeCode);
                }
            }

            // 2. Fetch all missing benchmarks in parallel
            const benchmarkROIStore = {};
            await Promise.all(Array.from(benchmarkCodes).map(async (code) => {
                const bCacheKey = `bench_roi1y:${code}`;
                let cached = getCached(bCacheKey);
                if (cached !== null) {
                    benchmarkROIStore[code] = cached;
                    return;
                }

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                
                try {
                    const res = await fetch(`${MFAPI_BASE}/mf/${code}`, { signal: controller.signal });
                    const data = await res.json();
                    if (data?.data) {
                        const metrics = computeFundMetrics(data.data, data.data);
                        const roi = metrics.cagr['1yr'] || 0;
                        setCache(bCacheKey, roi, CACHE_TTL);
                        benchmarkROIStore[code] = roi;
                    }
                } catch (e) {
                    console.warn(`[Search API] Benchmark fetch failed for ${code}:`, e.message);
                } finally {
                    clearTimeout(timeout);
                }
            }));

            // 3. Construct allFunds list
            allFunds = [];
            for (const doc of snapshot.docs) {
                const categoryData = doc.data();
                const categoryName = categoryData.name || doc.id;
                const funds = categoryData.funds || [];
                const bench = getBenchmarkForCategory(categoryName);
                const benchROI = bench ? benchmarkROIStore[bench.schemeCode] : null;

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
                const code = f.schemeCode;
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
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
