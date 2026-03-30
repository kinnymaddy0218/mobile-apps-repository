/**
 * Core Overlap Calculation Logic for Portfolio X-Ray
 * Calculates stock-level overlap and pairwise redundancy between multiple funds.
 */

/**
 * Calculates stock-level overlap between two funds.
 * Identifies common holdings and computes the minimum weight shared per stock.
 */
export function calculateOverlap(fundA, fundB) {
    if (!fundA?.holdings || !fundB?.holdings) return { overlap: 0, common: [] };

    const holdingsA = fundA.holdings;
    const holdingsB = fundB.holdings;

    const common = [];
    let overlapPercent = 0;

    const mapB = new Map();
    holdingsB.forEach(h => {
        const key = (h.stock || '').toLowerCase().trim();
        if (key) mapB.set(key, h.percentage);
    });

    holdingsA.forEach(h => {
        const key = (h.stock || '').toLowerCase().trim();
        if (key && mapB.has(key)) {
            const percB = mapB.get(key);
            // Institutional Fix: Only overlap on positive holdings to avoid negative results from short positions/TREPS
            if (h.percentage > 0 && percB > 0) {
                const commonPerc = Math.min(h.percentage, percB);
                overlapPercent += commonPerc;
                common.push({
                    stock: h.stock,
                    percA: h.percentage,
                    percB: percB,
                    overlap: commonPerc
                });
            }
        }
    });

    return {
        overlap: parseFloat(overlapPercent.toFixed(2)),
        common: common.sort((a, b) => b.overlap - a.overlap)
    };
}

/**
 * Calculates pairwise overlaps for a list of funds.
 * Returns an array of objects comparing each fund in the set.
 */
export function calculateOverlaps(funds) {
    const results = [];
    for (let i = 0; i < funds.length; i++) {
        for (let j = i + 1; j < funds.length; j++) {
            const result = calculateOverlap(funds[i], funds[j]);
            results.push({
                fund1: funds[i].fundName,
                fund2: funds[j].fundName,
                ...result
            });
        }
    }
    return results;
}

/**
 * Provides qualitative feedback based on overlap percentage.
 */
export function getOverlapFeedback(overlap) {
    if (overlap < 10) return { category: "Very Low", comment: "Excellent diversification! Unique holdings.", score: "Good Score" };
    if (overlap < 30) return { category: "Low", comment: "Good diversification benefits.", score: "Good Score" };
    if (overlap < 60) return { category: "Moderate", comment: "Moderate redundancy detected.", score: "Average" };
    if (overlap < 80) return { category: "High", comment: "Significant overlap redundancy.", score: "Higher Redundancy" };
    return { category: "Very High", comment: "Extremely high overlap. Diversification warning.", score: "Warning" };
}
