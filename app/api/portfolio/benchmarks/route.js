import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { calculateRollingReturn } from '@/lib/calculations';

const MFAPI_BASE = 'https://api.mfapi.in';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for benchmarks

const BENCHMARKS = {
    equity: { name: 'Nifty 50', code: '120586' },   // UTI Nifty 50 Index Fund
    debt: { name: 'Liquid Fund', code: '119551' }, // SBI Liquid Fund
    gold: { name: 'Gold ETF', code: '107380' }      // SBI Gold ETF
};

async function fetchCagr(schemeCode) {
    const res = await fetch(`${MFAPI_BASE}/mf/${schemeCode}`);
    if (!res.ok) return 0;
    const data = await res.json();
    if (!data || !data.data) return 0;

    const navData = data.data;
    // Calculate returns for common horizons
    return {
        '1yr': calculateRollingReturn(navData, 1) || 0,
        '3yr': calculateRollingReturn(navData, 3) || 0,
        '5yr': calculateRollingReturn(navData, 5) || 0,
        '10yr': calculateRollingReturn(navData, 10) || 0
    };
}

export async function GET() {
    try {
        const cacheKey = 'portfolio:benchmark_cagr:v1';
        let cached = getCached(cacheKey);
        if (cached) return NextResponse.json(cached);

        const results = {};
        for (const [key, info] of Object.entries(BENCHMARKS)) {
            results[key] = await fetchCagr(info.code);
        }

        setCache(cacheKey, results, CACHE_TTL);
        return NextResponse.json(results);
    } catch (error) {
        console.error('Benchmark API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch benchmarks' }, { status: 500 });
    }
}
