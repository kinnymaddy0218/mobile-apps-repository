import { NextResponse } from 'next/server';
import scraper from '@/lib/scraper';
import { calculateOverlaps } from '@/lib/analysis/overlap';
import { backtestMixture } from '@/lib/analysis/backtester';
import pLimit from 'p-limit';

/**
 * Portfolio X-Ray API
 * Orchestrates holdings retrieval, overlap analysis, and backtesting.
 */
export async function POST(req) {
    // 2 Concurrent requests max to prevent dev-server hang
    const limit = pLimit(2);
    const apiTimeout = 15000; // 15s top-level timeout

    try {
        const { funds, weights } = await req.json();

        if (!funds || funds.length < 2) {
            return NextResponse.json({ error: "Select at least 2 funds for analysis" }, { status: 400 });
        }

        console.log(`[X-Ray API] Analyzing ${funds.length} funds with p-limit...`);

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Analysis timed out")), apiTimeout)
        );

        // 1. Fetch data for all funds with concurrency limit
        const fetchAllData = Promise.all(
            funds.map(fund => limit(async () => {
                const name = typeof fund === 'string' ? fund : fund.name;
                const schemeCode = fund.schemeCode;

                try {
                    console.log(`[X-Ray API] Fetching details for: ${name} (${schemeCode || 'No Code'})`);
                    
                    // Fetch factsheet (Holdings/Sectors) and NAV data (Historical)
                    const [factsheet, navData] = await Promise.all([
                        scraper.getFactsheet(name),
                        schemeCode ? scraper.fetchNavData(schemeCode) : Promise.resolve([])
                    ]);

                    if (!factsheet) return null;

                    return {
                        ...factsheet,
                        schemeCode: schemeCode, // Crucial for weight lookup
                        navData: navData // Inject NAV data for backtester
                    };
                } catch (e) {
                    console.error(`[X-Ray API] Failed to fetch ${name}:`, e.message);
                    return null;
                }
            }))
        );

        // Race against timeout
        const fundDataResults = await Promise.race([fetchAllData, timeoutPromise]);
        const fundData = fundDataResults.filter(Boolean);

        if (fundData.length < 2) {
            return NextResponse.json({ error: "Failed to fetch enough fund data for analysis. The Factsheet Source may be unresponsive." }, { status: 404 });
        }

        // 2. Perform Overlap Analysis
        const overlaps = calculateOverlaps(fundData);
        
        // Enrich overlaps with qualitative verdicts
        const { getOverlapFeedback } = require('@/lib/analysis/overlap');
        overlaps.forEach(pair => {
            const feedback = getOverlapFeedback(pair.overlap);
            pair.verdict = feedback.comment;
        });

        // 3. Perform Backtesting (uses the weights provided by user)
        const performance = backtestMixture(fundData, 5, weights);

        // 4. Benchmark Logic (Fetch Nifty 50 via Proxy Scheme 100022)
        let benchmarkData = [];
        try {
            benchmarkData = await scraper.fetchNavData("100022"); // SBI Nifty Index (Proxy for Nifty 50)
        } catch (e) {
            console.warn("[X-Ray API] Global Benchmark fetch failed:", e.message);
        }

        // 5. Aggregate Mixture Stats & Risks
        let mixtureStats = { 
            large: 0, mid: 0, small: 0, 
            pe: 0, pb: 0, expense: 0,
            alpha: 0, beta: 0, efficiencyScore: 0,
            hasPe: false, hasPb: false, hasExpense: false
        };
        
        let peWeightSum = 0;
        let pbWeightSum = 0;
        let expenseWeightSum = 0;

        const combinedSectors = {};
        const combinedHoldings = {};
        const risks = [];

        fundData.forEach(fund => {
            const data = fund;
            // Legacy Fallback for rvId field
            if (!data.instId && data.rvId) {
                data.instId = data.rvId;
            }
            const wKey = data.schemeCode || data.fundName || data.instId;
            const w = (weights[wKey] || 0) / 100;
            if (w <= 0) return;

            // Market Cap
            if (fund.marketCap) {
                mixtureStats.large += (fund.marketCap.large || 0) * w;
                mixtureStats.mid += (fund.marketCap.mid || 0) * w;
                mixtureStats.small += (fund.marketCap.small || 0) * w;
                
                if (fund.marketCap.pe > 0) {
                    mixtureStats.pe += fund.marketCap.pe * w;
                    peWeightSum += w;
                    mixtureStats.hasPe = true;
                }
                if (fund.marketCap.pb > 0) {
                    mixtureStats.pb += fund.marketCap.pb * w;
                    pbWeightSum += w;
                    mixtureStats.hasPb = true;
                }
            }

            // Expense Ratio
            if (fund.expenseRatio > 0) {
                mixtureStats.expense += fund.expenseRatio * w;
                expenseWeightSum += w;
                mixtureStats.hasExpense = true;
            }

            // Aggregate Sectors & Track Concentration
            (fund.sectors || []).forEach(s => {
                combinedSectors[s.sector] = (combinedSectors[s.sector] || 0) + (s.percentage * w);
            });

            // Aggregate Holdings for "Top 12" overall
            (fund.holdings || []).forEach(h => {
                const hName = h.stock || 'Unknown';
                combinedHoldings[hName] = (combinedHoldings[hName] || 0) + (h.percentage * w);
            });
        });

        // 6. Final Calculations & Benchmarking
        if (peWeightSum > 0) mixtureStats.pe /= peWeightSum;
        if (pbWeightSum > 0) mixtureStats.pb /= pbWeightSum;
        if (expenseWeightSum > 0) mixtureStats.expense /= expenseWeightSum;

        // Check for Hidden Risks (>25% concentration)
        Object.entries(combinedSectors).forEach(([sector, perc]) => {
            if (perc > 25) {
                risks.push({ type: 'CONCENTRATION', sector, percentage: perc, severity: perc > 35 ? 'HIGH' : 'MODERATE' });
            }
        });

        // Sort and limit aggregated data
        const sortedSectors = Object.entries(combinedSectors)
            .map(([sector, percentage]) => ({ sector, percentage }))
            .sort((a, b) => b.percentage - a.percentage);

        const sortedHoldings = Object.entries(combinedHoldings)
            .map(([stock, percentage]) => ({ stock, percentage }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 12);

        // Alpha / Beta Approximation Logic (Relative to Benchmark)
        // Note: Simple historical comparison for now. A full covariance matrix can be built as data grows.
        const mixtureCAGR = performance.metrics.cagr || 0;
        const benchmarkCAGR = 14.5; // Long-term Nifty 50 average as baseline
        mixtureStats.alpha = mixtureCAGR - benchmarkCAGR;
        mixtureStats.beta = performance.metrics.risk / 15.0; // Normalized volatility vs Nifty standard (~15%)

        // Efficiency Score (0-100)
        // 50% Diversification (Overlap penalty), 50% Return Consistency
        const overlapCount = overlaps.length;
        const avgOverlap = overlapCount > 0 ? (overlaps.reduce((sum, p) => sum + p.overlap, 0) / overlapCount) : 0;
        const divScore = Math.max(0, 100 - (avgOverlap * 2)); // Penalty for overlap
        const retScore = Math.min(100, (mixtureCAGR / 15) * 50); // Performance component
        mixtureStats.efficiencyScore = Math.round((divScore * 0.5) + (retScore * 0.5));

        return NextResponse.json({
            status: 'success',
            data: {
                fundDetails: fundData.map(f => ({ 
                    name: f.fundName, 
                    instId: f.instId, 
                    schemeCode: f.schemeCode,
                    marketCap: f.marketCap,
                    expenseRatio: f.expenseRatio
                })),
                overlapMatrix: overlaps,
                performance: performance,
                mixtureStats: {
                    ...mixtureStats,
                    sectors: sortedSectors.slice(0, 10),
                    holdings: sortedHoldings,
                    risks: risks
                }
            }
        });

    } catch (error) {
        console.error('[Portfolio Architect API] Critical Error:', error);
        return NextResponse.json({ error: error.message || "Internal Analysis Error" }, { status: 500 });
    }
}
