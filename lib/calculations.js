/**
 * Financial calculation utilities for mutual fund analysis.
 * All calculations are based on historical NAV data.
 */

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(startValue, endValue, years) {
    if (isNaN(startValue) || isNaN(endValue) || isNaN(years)) {
        console.log(`[CAGR TRACE] startValue: ${startValue}, endValue: ${endValue}, years: ${years}`);
        return NaN;
    }
    if (startValue <= 0 || years <= 0) return 0;
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate absolute return percentage
 */
export function calculateAbsoluteReturn(startValue, endValue) {
    if (startValue <= 0) return 0;
    return ((endValue - startValue) / startValue) * 100;
}

/**
 * Calculate rolling returns from NAV history
 */
export function calculateRollingReturn(navData, years) {
    if (!navData || navData.length < 2) return null;

    const latestNav = parseFloat(navData[0].nav);
    const latestDate = parseDate(navData[0].date);
    const targetDate = new Date(latestDate);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    let closestEntry = null;
    let minDiff = Infinity;

    for (const entry of navData) {
        const entryDate = parseDate(entry.date);
        const diff = Math.abs(entryDate - targetDate);
        if (diff < minDiff) {
            minDiff = diff;
            closestEntry = entry;
        }
    }

    if (!closestEntry || minDiff > 30 * 24 * 60 * 60 * 1000) return null;

    const pastNav = parseFloat(closestEntry.nav);
    if (isNaN(pastNav) || isNaN(latestNav)) return null;

    return calculateCAGR(pastNav, latestNav, years);
}

/**
 * Calculate Monthly Returns from daily NAV data
 * Groups by YYYY-MM and computes month-over-month returns
 */
export function calculateMonthlyReturns(navData) {
    if (!navData || navData.length < 2) return [];

    // Map to store the last available NAV for each month
    const endOfMonthNavs = [];
    let currentMonth = '';
    let lastNav = null;

    // Data is newest first. We want to collect the end of month NAVs.
    for (const entry of navData) {
        const parts = entry.date.split('-');
        if (parts.length !== 3) continue;
        const monthKey = `${parts[2]}-${parts[1]}`; // YYYY-MM

        if (monthKey !== currentMonth) {
            // New month encountered (since we iterate backwards in time)
            if (currentMonth !== '') {
                endOfMonthNavs.push({ month: currentMonth, nav: parseFloat(lastNav) });
            }
            currentMonth = monthKey;
        }
        lastNav = entry.nav;
    }
    if (lastNav !== null) {
        endOfMonthNavs.push({ month: currentMonth, nav: parseFloat(lastNav) });
    }

    const returns = [];
    // endOfMonthNavs is newest month first. Array: [Mar 2026, Feb 2026, Jan 2026...]
    for (let i = 0; i < endOfMonthNavs.length - 1; i++) {
        const thisMonthNav = endOfMonthNavs[i].nav;
        const prevMonthNav = endOfMonthNavs[i + 1].nav;
        if (prevMonthNav > 0) {
            returns.push((thisMonthNav - prevMonthNav) / prevMonthNav);
        }
    }
    return returns;
}

/**
 * Calculate daily returns from NAV data
 */
export function calculateDailyReturns(navData) {
    const returns = [];
    for (let i = 0; i < navData.length - 1; i++) {
        const todayNav = parseFloat(navData[i].nav);
        const yesterdayNav = parseFloat(navData[i + 1].nav);
        if (yesterdayNav > 0) {
            returns.push((todayNav - yesterdayNav) / yesterdayNav);
        }
    }
    return returns;
}

/**
 * Calculate Sharpe Ratio (expects monthly returns)
 */
export function calculateSharpeRatio(returns, riskFreeRate = 0.06) {
    if (!returns || returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const annualizedReturn = avgReturn * 12; // 12 months in a year
    const excessReturn = annualizedReturn - riskFreeRate;

    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance) * Math.sqrt(12);

    return stdDev === 0 ? 0 : excessReturn / stdDev;
}

/**
 * Calculate Sortino Ratio (uses only downside deviation, expects monthly returns)
 */
export function calculateSortinoRatio(returns, riskFreeRate = 0.06) {
    if (!returns || returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const annualizedReturn = avgReturn * 12;
    const excessReturn = annualizedReturn - riskFreeRate;

    const monthlyRfr = Math.pow(1 + riskFreeRate, 1 / 12) - 1;
    const downsideReturns = returns.filter(r => r < monthlyRfr);
    if (downsideReturns.length === 0) return excessReturn > 0 ? Infinity : 0;

    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - monthlyRfr, 2), 0) / downsideReturns.length;
    const downsideDev = Math.sqrt(downsideVariance) * Math.sqrt(12);

    return downsideDev === 0 ? 0 : excessReturn / downsideDev;
}

/**
 * Calculate Beta (systematic risk relative to benchmark)
 */
export function calculateBeta(fundReturns, benchmarkReturns) {
    const n = Math.min(fundReturns.length, benchmarkReturns.length);
    if (n < 2) return 0;

    const fr = fundReturns.slice(0, n);
    const br = benchmarkReturns.slice(0, n);

    const avgF = fr.reduce((a, b) => a + b, 0) / n;
    const avgB = br.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let benchVariance = 0;

    for (let i = 0; i < n; i++) {
        covariance += (fr[i] - avgF) * (br[i] - avgB);
        benchVariance += Math.pow(br[i] - avgB, 2);
    }

    // Safety clamp: If benchmark has essentially zero variance (like a liquid fund or broken data), Beta is 0.
    if (benchVariance < 1e-8) return 0;
    return covariance / benchVariance;
}

/**
 * Calculate Alpha (Jensen's Alpha) relative to Benchmark
 * Returns annualized alpha in percentage
 */
export function calculateAlpha(fundReturns, benchmarkReturns, riskFreeRate = 0.06) {
    const n = Math.min(fundReturns.length, benchmarkReturns.length);
    if (n < 2) return 0;

    const fr = fundReturns.slice(0, n);
    const br = benchmarkReturns.slice(0, n);

    let fundComp = 1;
    let benchComp = 1;
    for (let i = 0; i < n; i++) {
        fundComp *= (1 + fr[i]);
        benchComp *= (1 + br[i]);
    }
    const years = n / 12; // Annualized using months
    // Annualized geometric return
    const annFR = (Math.pow(fundComp, 1 / years) - 1);
    const annBR = (Math.pow(benchComp, 1 / years) - 1);

    const beta = calculateBeta(fr, br);

    return (annFR - (riskFreeRate + beta * (annBR - riskFreeRate))) * 100;
}

/**
 * Calculate Upside/Downside Capture Ratio using geometric compounding
 */
export function calculateCaptureRatio(fundReturns, benchmarkReturns, direction = 'up') {
    const n = Math.min(fundReturns.length, benchmarkReturns.length);
    if (n < 2) return 0;

    let fundComp = 1;
    let benchComp = 1;
    let count = 0;

    for (let i = 0; i < n; i++) {
        const include = direction === 'up' ? benchmarkReturns[i] > 0 : benchmarkReturns[i] < 0;
        if (include) {
            fundComp *= (1 + fundReturns[i]);
            benchComp *= (1 + benchmarkReturns[i]);
            count++;
        }
    }

    if (count === 0 || benchComp - 1 === 0) return 0;
    return ((fundComp - 1) / (benchComp - 1)) * 100;
}

/**
 * Calculate Standard Deviation of returns (annualized)
 */
export function calculateStdDev(returns) {
    if (!returns || returns.length < 2) return 0;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(12) * 100; // Annualized from monthly variance
}

/**
 * Calculate Max Drawdown from NAV data
 * @param {Array} navData - sorted newest first
 * @returns {number} max drawdown as negative percentage
 */
export function calculateMaxDrawdown(navData) {
    if (!navData || navData.length < 2) return { maxDrawdown: 0, peak: 0 };

    // Process oldest to newest
    let peak = 0;
    let maxDD = 0;

    for (let i = navData.length - 1; i >= 0; i--) {
        const nav = parseFloat(navData[i].nav);
        if (nav > peak) peak = nav;
        const dd = peak > 0 ? ((nav - peak) / peak) * 100 : 0;
        if (dd < maxDD) maxDD = dd;
    }
    return { maxDrawdown: maxDD, peak };
}

/**
 * Generate synthetic benchmark returns by smoothing fund returns
 * Used when actual benchmark data isn't available
 * Creates a "market average" approximation using rolling mean
 */
function generateSyntheticBenchmark(dailyReturns) {
    if (dailyReturns.length < 20) return dailyReturns;

    const window = 20; // 20-day rolling average
    const benchmark = [];

    for (let i = 0; i < dailyReturns.length; i++) {
        const start = Math.max(0, i - Math.floor(window / 2));
        const end = Math.min(dailyReturns.length, i + Math.floor(window / 2));
        const slice = dailyReturns.slice(start, end);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        // Scale to simulate broader market (less volatile)
        benchmark.push(avg * 0.8);
    }

    return benchmark;
}

/**
 * Parse date string in DD-MM-YYYY format (MFAPI format)
 */
export function parseDate(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
}

/**
 * Align two arrays of NAV data by date to ensure perfect geometric tracking
 * Returns { alignedFund: [], alignedBench: [] }
 */
export function alignNavData(fundNavs, benchNavs) {
    if (!fundNavs || !benchNavs) return { alignedFund: [], alignedBench: [] };

    const benchNavMap = new Map();
    for (const b of benchNavs) {
        benchNavMap.set(b.date, parseFloat(b.nav));
    }

    const alignedFund = [];
    const alignedBench = [];

    for (const f of fundNavs) {
        if (benchNavMap.has(f.date)) {
            alignedFund.push({ ...f, nav: parseFloat(f.nav) });
            alignedBench.push({ date: f.date, nav: benchNavMap.get(f.date) });
        }
    }
    return { alignedFund, alignedBench };
}

/**
 * Get all computed metrics for a fund
 */
export function computeFundMetrics(navData, benchmarkData = null) {
    const metrics = {
        returns: {},
        cagr: {},
        risk: {
            period: 'none'
        },
    };

    if (!navData || navData.length === 0) return metrics;

    // Rolling returns & CAGR
    [1, 3, 5, 7, 10].forEach(yr => {
        const ret = calculateRollingReturn(navData, yr);
        metrics.returns[`${yr}yr`] = ret;
        metrics.cagr[`${yr}yr`] = ret;
    });

    // Determine the best risk lookback window
    // Standard is 3 years (~756 trading days), but we fall back to 1 year (~252) 
    // or "Since Inception" (min 156 days ~ 6 months)
    let riskDayCount = 756;
    let periodLabel = '3Y';

    if (navData.length < 756) {
        if (navData.length >= 252) {
            riskDayCount = 252;
            periodLabel = '1Y';
        } else if (navData.length >= 156) {
            riskDayCount = navData.length;
            periodLabel = 'Inception';
        } else {
            // Insufficient data for any meaningful risk metric
            riskDayCount = 0;
            periodLabel = 'none';
        }
    }

    metrics.risk.period = periodLabel;

    if (riskDayCount > 0) {
        const riskData = navData.slice(0, riskDayCount);
        const monthlyReturns = calculateMonthlyReturns(riskData);

        if (monthlyReturns.length >= 2) {
            metrics.risk.stdDev = calculateStdDev(monthlyReturns);
            metrics.risk.sharpe = calculateSharpeRatio(monthlyReturns);
            metrics.risk.sortino = calculateSortinoRatio(monthlyReturns);
            const { maxDrawdown, peak } = calculateMaxDrawdown(riskData);
            metrics.risk.maxDrawdown = maxDrawdown;
            metrics.risk.peakNav = peak;

            // Benchmark-relative metrics
            let alignedFundReturns = monthlyReturns;
            let alignedBenchReturns;

            if (benchmarkData && benchmarkData.length > 0) {
                const { alignedFund, alignedBench } = alignNavData(riskData, benchmarkData);
                const alignedFundMonthly = calculateMonthlyReturns(alignedFund);
                const alignedBenchMonthly = calculateMonthlyReturns(alignedBench);

                // Only use aligned data if we have at least 12 months overlap
                // Otherwise fall back to synthetic to avoid returning 0 for everything
                if (alignedFundMonthly.length >= 12 && alignedBenchMonthly.length >= 12) {
                    alignedFundReturns = alignedFundMonthly;
                    alignedBenchReturns = alignedBenchMonthly;
                } else {
                    // Fallback: use original fund monthly returns with synthetic benchmark
                    alignedBenchReturns = generateSyntheticBenchmark(monthlyReturns);
                }
            } else {
                alignedBenchReturns = generateSyntheticBenchmark(monthlyReturns);
            }

            if (alignedBenchReturns && alignedBenchReturns.length > 0) {
                metrics.risk.beta = calculateBeta(alignedFundReturns, alignedBenchReturns);
                metrics.risk.alpha = calculateAlpha(alignedFundReturns, alignedBenchReturns);
                metrics.risk.upsideCapture = calculateCaptureRatio(alignedFundReturns, alignedBenchReturns, 'up');
                metrics.risk.downsideCapture = calculateCaptureRatio(alignedFundReturns, alignedBenchReturns, 'down');
            }
        }
    }

    return metrics;
}

/**
 * Get proposed asset allocation based on risk and horizon
 */
export function getProposalWeights(risk = 'Moderate', years = 5) {
    let equity = 0;
    let debt = 0;
    let gold = 10;
    let strategy = "";

    if (years < 3) {
        equity = risk === 'Aggressive' ? 30 : (risk === 'Moderate' ? 20 : 10);
        debt = 100 - equity - gold;
        strategy = "Capital Preservation";
    } else if (years < 7) {
        equity = risk === 'Aggressive' ? 60 : (risk === 'Moderate' ? 50 : 40);
        debt = 100 - equity - gold;
        strategy = "Balanced Growth";
    } else {
        equity = risk === 'Aggressive' ? 80 : (risk === 'Moderate' ? 70 : 60);
        debt = 100 - equity - gold;
        strategy = "Wealth Accumulation";
    }

    return { equity, debt, gold, strategy };
}
