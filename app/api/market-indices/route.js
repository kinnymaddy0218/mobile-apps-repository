import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { BENCHMARK_MAP } from '@/lib/benchmarks';
import { computeFundMetrics } from '@/lib/calculations';

const MFAPI_BASE = 'https://api.mfapi.in';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchIndexData(schemeCode) {
    try {
        const res = await fetch(`${MFAPI_BASE}/mf/${schemeCode}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.status === 'ERROR' || !data.data) return null;
        return data;
    } catch (e) {
        return null;
    }
}

async function fetchYahooIndexData(symbol) {
    if (!symbol) return null;
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!res.ok) return null;
        const json = await res.json();
        const result = json.chart?.result?.[0];
        if (!result) return null;

        const meta = result.meta;
        const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];
        const timestamps = result.timestamp || [];
        
        const currentLevel = meta.regularMarketPrice;
        
        // Calculate daily change from history for better accuracy
        let dailyChangePoints = 0;
        let dailyChangePercent = 0;
        
        if (adjClose.length >= 2) {
            const lastClose = adjClose[adjClose.length - 1] || currentLevel;
            const prevClose = adjClose[adjClose.length - 2];
            
            if (prevClose > 0) {
                dailyChangePoints = lastClose - prevClose;
                dailyChangePercent = (dailyChangePoints / prevClose) * 100;
            }
        } else {
            // Fallback to meta if history is too short
            const fallbackPrevClose = meta.previousClose || meta.chartPreviousClose;
            dailyChangePoints = currentLevel - fallbackPrevClose;
            dailyChangePercent = fallbackPrevClose > 0 ? (dailyChangePoints / fallbackPrevClose) * 100 : 0;
        }

        return {
            currentLevel,
            dailyChangePoints,
            dailyChangePercent,
            asOfDate: new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0]
        };
    } catch (e) {
        console.error(`Yahoo fetch failed for ${symbol}:`, e);
        return null;
    }
}

export async function GET() {
    try {
        const cacheKey = 'market:indices:all:v3';
        let result = getCached(cacheKey);

        if (!result) {
            const indices = Object.entries(BENCHMARK_MAP).filter(([key]) => key !== 'default');
            
            const performanceData = await Promise.all(indices.map(async ([key, benchmark]) => {
                const [mfData, yahooData] = await Promise.all([
                    fetchIndexData(benchmark.schemeCode),
                    fetchYahooIndexData(benchmark.yahooSymbol)
                ]);

                if (!mfData && !yahooData) return { name: key, error: true };

                const navData = mfData?.data || [];
                const metrics = mfData ? computeFundMetrics(navData, navData) : { cagr: {} };

                // Calculate daily change from MF data (as fallback)
                let mfDailyChangePercent = 0;
                let mfDailyChangePoints = 0;
                let mfCurrentNav = 0;
                if (navData.length >= 2) {
                    mfCurrentNav = parseFloat(navData[0].nav);
                    const prev = parseFloat(navData[1].nav);
                    mfDailyChangePoints = mfCurrentNav - prev;
                    mfDailyChangePercent = prev > 0 ? ((mfDailyChangePoints / prev) * 100) : 0;
                }

                return {
                    id: key,
                    name: benchmark.name,
                    shortName: key,
                    currentLevel: yahooData?.currentLevel || mfCurrentNav,
                    dailyChangePoints: yahooData?.dailyChangePoints || mfDailyChangePoints,
                    dailyChangePercent: yahooData?.dailyChangePercent || mfDailyChangePercent,
                    roi1Y: metrics.cagr['1yr'] || 0,
                    asOfDate: yahooData?.asOfDate || navData[0]?.date
                };
            }));

            // Categorize indices for the UI
            result = {
                core: performanceData.filter(i => ['Nifty 50', 'Sensex', 'Nifty 100', 'Nifty Midcap 150', 'Nifty Smallcap 250', 'Nifty 500', 'Nifty Total Market'].includes(i.shortName)),
                sectoral: performanceData.filter(i => ['Banking', 'Financial Services', 'Pharma', 'IT', 'Auto', 'PSU', 'Manufacturing', 'Oil & Gas', 'Consumer', 'Healthcare', 'Realty', 'Metals'].includes(i.shortName)),
                strategy: performanceData.filter(i => ['Momentum', 'Low Volatility', 'Quality', 'Alpha Low Vol', 'Equal Weight', 'Dividend Yield'].includes(i.shortName)),
                international: performanceData.filter(i => ['S&P 500', 'NASDAQ 100', 'China'].includes(i.shortName)),
                all: performanceData,
                lastUpdated: new Date().toISOString()
            };

            setCache(cacheKey, result, CACHE_TTL);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Market indices error:', error);
        return NextResponse.json({ error: 'Failed to fetch indices' }, { status: 500 });
    }
}
