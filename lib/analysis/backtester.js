import { parseDate, calculateCAGR, calculateStdDev } from '../calculations.js';

/**
 * Backtesting Engine for Portfolio X-Ray
 * Calculates composite performance metrics over a historical timeline.
 */
export function backtestMixture(fundDataSets, years = 5, userWeights = null) {
    if (!fundDataSets || fundDataSets.length === 0) return null;

    // 1. Resolve Weights Robustly
    // Use schemeCode as primary key, fallback to fundName
    let resolvedWeights = fundDataSets.map(ds => {
        if (userWeights) {
            // Priority: schemeCode -> fundName -> rvId
            const weight = userWeights[ds.schemeCode] || userWeights[ds.fundName] || userWeights[ds.rvId];
            if (weight !== undefined) return parseFloat(weight) / 100;
        }
        return 1 / fundDataSets.length;
    });

    // Final Normalization: Ensure sum is exactly 1.0 (prevents rounding drift)
    const sum = resolvedWeights.reduce((a, b) => a + b, 0);
    if (sum > 0 && Math.abs(sum - 1) > 0.0001) {
        resolvedWeights = resolvedWeights.map(w => w / sum);
    }

    // 2. Build a Shared Timeline
    const allDates = new Set();
    fundDataSets.forEach(ds => {
        (ds.navData || []).forEach(d => allDates.add(d.date));
    });

    const commonDates = Array.from(allDates).sort((a, b) => {
        const dateA = parseDate(a);
        const dateB = parseDate(b);
        return dateA - dateB;
    });

    // 3. Map NAV data to a fast-lookup object per fund
    const fundNavMap = fundDataSets.map(ds => {
        const map = {};
        (ds.navData || []).forEach(d => {
            map[d.date] = parseFloat(d.nav);
        });
        return map;
    });

    // 4. Find the first date where ALL SECURED funds have a valid NAV
    // Skipping 'unsecured' skeletons to allow partial performance analysis.
    const securedFundNavMap = fundNavMap.filter((_, idx) => !fundDataSets[idx].unsecured);
    const securedWeights = resolvedWeights.filter((_, idx) => !fundDataSets[idx].unsecured);
    
    // Re-normalize subset weights if we are skipping some
    const securedWeightSum = securedWeights.reduce((a, b) => a + b, 0);
    const normalizedSubWeights = securedWeights.map(w => securedWeightSum > 0 ? w / securedWeightSum : 0);

    let firstCommonIndex = -1;
    for (let i = 0; i < commonDates.length; i++) {
        const date = commonDates[i];
        if (securedFundNavMap.length > 0 && securedFundNavMap.every(map => map[date] !== undefined)) {
            firstCommonIndex = i;
            break;
        }
    }

    if (firstCommonIndex === -1 || securedFundNavMap.length === 0) {
        return { series: [], metrics: { cagr: 0, risk: 0 }, partial: true };
    }

    // 5. Generate Composite Series
    const compositeSeries = [];
    const baseNavs = fundDataSets
        .map((ds, idx) => ds.unsecured ? null : fundNavMap[idx][commonDates[firstCommonIndex]])
        .filter(n => n !== null);

    for (let i = firstCommonIndex; i < commonDates.length; i++) {
        const date = commonDates[i];
        let mixtureValue = 0;
        let isValid = true;

        for (let j = 0; j < securedFundNavMap.length; j++) {
            const currentNav = securedFundNavMap[j][date];
            if (currentNav === undefined) {
                isValid = false;
                break;
            }
            const growth = currentNav / baseNavs[j];
            mixtureValue += growth * normalizedSubWeights[j] * 100; // Starting at index 100
        }

        if (isValid) {
            compositeSeries.push({ date, value: mixtureValue });
        }
    }

    if (compositeSeries.length < 2) return { series: [], metrics: { cagr: 0, risk: 0 } };

    // 6. Calculate Metrics
    const startValue = compositeSeries[0].value;
    const endValue = compositeSeries[compositeSeries.length - 1].value;
    
    // Calculate elapsed years accurately
    const sDate = parseDate(compositeSeries[0].date);
    const eDate = parseDate(compositeSeries[compositeSeries.length - 1].date);
    const yearsElapsed = Math.max(0.1, (eDate - sDate) / (1000 * 60 * 60 * 24 * 365.25));

    // Calculate daily returns for risk (Standard Deviation)
    const returns = [];
    for (let i = 1; i < compositeSeries.length; i++) {
        returns.push((compositeSeries[i].value - compositeSeries[i - 1].value) / compositeSeries[i - 1].value);
    }

    return {
        series: compositeSeries,
        metrics: {
            cagr: calculateCAGR(startValue, endValue, yearsElapsed),
            risk: calculateStdDev(returns)
        }
    };
}
