import { NextResponse } from 'next/server';
import scraper from '@/lib/scraper';
import { calculateOverlaps, getDetailedInstitutionalVerdict } from '@/lib/analysis/overlap';
import { backtestMixture } from '@/lib/analysis/backtester';
import pLimit from 'p-limit';
import { adminDb as db } from '@/lib/firebase-admin';

/**
 * Portfolio X-Ray API
 * Orchestrates holdings retrieval, overlap analysis, and backtesting.
 */
export async function POST(req) {
    // 5 Concurrent requests for faster parallel processing
    const limit = pLimit(7);
    const apiTimeout = 45000; // Increased to handle first-run scrapes gracefully

    try {
        let { funds, weights, force = false, omitHoldings = false } = await req.json();
        
        // Strict check: Only Boolean 'true' triggers a force refresh. 
        // Prevents React Event objects from being passed as 'truthy' force flags.
        if (force !== true) force = false;

        if (!funds || funds.length < 2) {
            return NextResponse.json({ error: "Select at least 2 funds for analysis" }, { status: 400 });
        }

        console.log(`[X-Ray API] Analyzing ${funds.length} funds (omitHoldings: ${omitHoldings}, force: ${force})...`);

        // 1. Fetch data for all funds
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Analysis timed out")), apiTimeout)
        );

        const fetchAllData = Promise.all(
            funds.map(fund => limit(async () => {
                const name = typeof fund === 'string' ? fund : fund.name;
                const schemeCode = fund.schemeCode;

                try {
                    // Stage A: High-Priority Factsheet (Holdings/Sectors)
                    // CIRCUIT BREAKER: Max 2.5s for live fetch before we fallback to cache.
                    const circuitBreaker = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error("Circuit Breaker Triggered")), 2500)
                    );

                    let factsheet;
                    try {
                        // Attempt the primary fetch (Precision Sync)
                        factsheet = await Promise.race([
                            scraper.getFactsheet(name, force, omitHoldings, !force, schemeCode),
                            circuitBreaker
                        ]);
                    } catch (err) {
                        console.warn(`[X-Ray API] Circuit Breaker triggered for ${name}. Falling back to Persistent Sync.`);
                        // FORCED DOWNSIDE PROTECTION: If live fetch hangs, use ONLY the database.
                        factsheet = await scraper.getFactsheet(name, false, omitHoldings, true, schemeCode);
                    }
                    
                    if (!factsheet) {
                        // ZERO-ERROR RESILIENCE: If factsheet missing even in cache, return skeleton.
                        return { 
                            name, 
                            schemeCode, 
                            unsecured: true, 
                            holdings: [], 
                            sectors: [], 
                            marketCap: { pe: 0, pb: 0, large: 0, mid: 0, small: 0 } 
                        };
                    }

                    // Stage B: Secondary Performance (NAV) - Non-blocking fetch
                    let navData = [];
                    try {
                        const navCircuit = new Promise((_, reject) => setTimeout(() => reject(new Error("NAV Timeout")), 1500));
                        navData = schemeCode ? await Promise.race([scraper.fetchNavData(schemeCode), navCircuit]) : [];
                    } catch (navErr) {
                        console.warn(`[X-Ray API] Performance fallback for ${name}: ${navErr.message}`);
                    }

                    return {
                        ...factsheet,
                        schemeCode: schemeCode,
                        navData: navData 
                    };
                } catch (e) {
                    console.error(`[X-Ray API] Critical failure for ${typeof fund === 'string' ? fund : fund.name}:`, e.message);
                    return { 
                        name: typeof fund === 'string' ? fund : fund.name,
                        schemeCode: fund.schemeCode,
                        unsecured: true, 
                        holdings: [], 
                        sectors: [] 
                    };
                }
            }))
        );

        // Race against timeout
        const fundDataResults = await Promise.race([fetchAllData, timeoutPromise]);
        
        // Filter out absolute dead nulls, but keep 'unsecured' skeletons.
        const fundData = fundDataResults.filter(Boolean);

        // Perform multi-dimensional analysis on available data segment
        const overlaps = calculateOverlaps(fundData);
        
        // Enrich overlaps with high-fidelity Institutional Verdicts & Substitution Suggestions
        for (const pair of overlaps) {
            const feedback = getDetailedInstitutionalVerdict(pair.overlap, pair.fund1, pair.fund2);
            pair.verdict = feedback.verdict;
            pair.institutionalMetrics = feedback;
            
            // LOGIC: If overlap is SIGNIFICANT (>35%), suggest an alternative
            if (pair.overlap > 35) {
                try {
                    // 1. Identify Category (Finding the data in fundData)
                    const f2Data = fundData.find(f => f.fundName === pair.fund2);
                    const category = f2Data?.category || f2Data?.type;

                    if (category && db) {
                        // 2. Fetch "Gold Standard" Alternatives in the same category
                        const snap = await db.collection('rankings')
                            .where('category', '==', category)
                            .orderBy('rank', 'asc')
                            .limit(5)
                            .get();

                        const topFunds = snap.docs
                            .map(d => ({ name: d.data().name, schemeCode: d.id, rank: d.data().rank }))
                            .filter(f => f.name !== pair.fund1 && f.name !== pair.fund2);

                        if (topFunds.length > 0) {
                            pair.substitutionRecommendation = {
                                original: pair.fund2,
                                category: category,
                                suggestion: topFunds[0].name,
                                reason: `Trading the duplicate core for highly-ranked ${topFunds[0].name} will significantly reduce correlation while maintaining ${category} exposure.`,
                                alternatives: topFunds.slice(1, 4)
                            };
                        }
                    }
                } catch (subErr) {
                    console.warn(`[X-Ray API] Substitution Engine failed for ${pair.fund2}:`, subErr.message);
                }
            }
        }

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

        // Pre-normalize weights for robust matching
        const normalizedWeights = {};
        Object.entries(weights).forEach(([key, val]) => {
            normalizedWeights[scraper.normalizeFundName(key)] = val;
        });

        fundData.forEach(fund => {
            const data = fund;
            
            // Try multiple identifiers to find the allocated weight
            const possibleKeys = [
                data.schemeCode?.toString(),
                data.fundName,
                data.instId?.toString(),
                data.schemeName
            ].filter(Boolean);
            
            let weight = 0;
            for (const key of possibleKeys) {
                if (weights[key] !== undefined) {
                    weight = weights[key];
                    break;
                }
            }

            // Fallback: Normalized Name Match
            if (weight === 0) {
                const normName = scraper.normalizeFundName(data.fundName || data.schemeName);
                if (normalizedWeights[normName] !== undefined) {
                    weight = normalizedWeights[normName];
                    console.log(`[X-Ray API] Recovered weight for ${data.fundName} via Normalized Name Match.`);
                }
            }

            const w = weight / 100;
            if (w <= 0) {
                console.warn(`[X-Ray API] Skipping ${data.fundName || data.schemeName} (ID: ${data.schemeCode}) due to 0% weight. Registered weights:`, Object.keys(weights));
                return;
            }

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
                    expenseRatio: f.expenseRatio,
                    unsecured: f.unsecured || false
                })),
                overlapMatrix: overlaps,
                performance: performance,
                mixtureStats: {
                    ...mixtureStats,
                    sectors: sortedSectors.slice(0, 10),
                    holdings: sortedHoldings,
                    risks: risks,
                    hasUnsecured: fundData.some(f => f.unsecured)
                }
            }
        });

    } catch (error) {
        console.error('[Portfolio Architect API] Critical Error:', error);
        return NextResponse.json({ error: error.message || "Internal Analysis Error" }, { status: 500 });
    }
}
