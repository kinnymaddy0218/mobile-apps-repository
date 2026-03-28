import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getCached, setCache } from '@/lib/cache';
import { getFundsForCategory } from '@/lib/categories';
import { computeFundMetrics } from '@/lib/calculations';
import pLimit from 'p-limit';

const MFAPI_BASE = 'https://api.mfapi.in';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours - these are very heavy calculations, cache heavily

async function fetchFundNavs(schemeCode) {
    try {
        const res = await fetch(`${MFAPI_BASE}/mf/${schemeCode}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.status === 'ERROR') return null;
        return data.data || [];
    } catch {
        return null;
    }
}

function averageMetrics(metricsList) {
    if (!metricsList || metricsList.length === 0) return null;

    const avg = {
        returns: {},
        cagr: {},
        risk: {}
    };

    const count = metricsList.length;

    // Average Returns & CAGR
    ['1yr', '3yr', '5yr', '7yr', '10yr'].forEach(period => {
        const validReturns = metricsList.map(m => m.returns[period]).filter(val => val !== null && !isNaN(val));
        if (validReturns.length > 0) {
            avg.returns[period] = validReturns.reduce((a, b) => a + b, 0) / validReturns.length;
            avg.cagr[period] = avg.returns[period];
        } else {
            avg.returns[period] = null;
            avg.cagr[period] = null;
        }
    });

    // Average Risk Metrics
    const riskKeys = ['stdDev', 'sharpe', 'sortino', 'maxDrawdown', 'beta', 'alpha', 'upsideCapture', 'downsideCapture'];
    riskKeys.forEach(key => {
        const validVals = metricsList.map(m => m.risk[key]).filter(val => val !== null && !isNaN(val) && val !== Infinity);
        if (validVals.length > 0) {
            avg.risk[key] = validVals.reduce((a, b) => a + b, 0) / validVals.length;
        } else {
            avg.risk[key] = null;
        }
    });

    return avg;
}

import { getBenchmarkForCategory } from '@/lib/benchmarks';

export async function GET(request, { params }) {
    const categoryName = decodeURIComponent(params.category);

    if (!categoryName) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    try {
        const cacheKey = `category:averages:v2:${categoryName}`;
        let result = getCached(cacheKey);

        if (!result) {
            const fundsToTrack = getFundsForCategory(categoryName);

            if (fundsToTrack.length === 0) {
                return NextResponse.json({ error: 'No tracked funds found for category', category: categoryName }, { status: 404 });
            }

            // Fetch the benchmark for this category
            const benchmarkSource = getBenchmarkForCategory(categoryName);
            let benchNavData = [];
            try {
                const benchRaw = await fetchFundNavs(benchmarkSource.schemeCode);
                if (benchRaw) {
                    benchNavData = benchRaw;
                }
            } catch (e) {
                console.error("Failed to fetch benchmark data for category", categoryName, e);
            }

            // Limit concurrency to avoid slamming mfapi.in
            const limit = pLimit(5);

            const fetchPromises = fundsToTrack.map(fund =>
                limit(async () => {
                    const navs = await fetchFundNavs(fund.code);
                    if (!navs || navs.length < 2) return null;

                    return computeFundMetrics(navs, benchNavData);
                })
            );

            const computedMetricsList = await Promise.all(fetchPromises);
            const validMetrics = computedMetricsList.filter(Boolean);

            if (validMetrics.length === 0) {
                return NextResponse.json({ error: 'Failed to compute metrics from API for category' }, { status: 500 });
            }

            const categoryAverageMetrics = averageMetrics(validMetrics);

            result = {
                category: categoryName,
                trackedFundsCount: fundsToTrack.length,
                successfulComputations: validMetrics.length,
                averages: categoryAverageMetrics,
                lastUpdated: new Date().toISOString()
            };

            setCache(cacheKey, result, CACHE_TTL);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error(`Category Averages API error [${categoryName}]:`, error);
        return NextResponse.json({ error: 'Failed to compute category averages' }, { status: 500 });
    }
}
