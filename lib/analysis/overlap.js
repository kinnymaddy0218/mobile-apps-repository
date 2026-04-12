/**
 * Core Overlap Calculation Logic for Portfolio X-Ray
 * Calculates stock-level overlap and sectoral redundancy between multiple funds.
 */

/**
 * Safe numeric percentage parsing (handles strings like "10.5%")
 */
function parsePercent(val) {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return 0;
    const clean = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

/**
 * Calculates stock-level and sector-level overlap between two funds.
 */
export function calculateOverlap(fundA, fundB) {
    if (!fundA || !fundB) return { overlap: 0, common: [], sectorOverlap: 0 };

    const holdingsA = fundA.holdings || [];
    const holdingsB = fundB.holdings || [];
    const sectorsA = fundA.sectors || [];
    const sectorsB = fundB.sectors || [];

    // 1. Stock Overlap
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
            const percB = parsePercent(mapB.get(key));
            const percA = parsePercent(h.percentage);
            if (percA > 0 && percB > 0) {
                const commonPerc = Math.min(percA, percB);
                overlapPercent += commonPerc;
                common.push({ stock: h.stock, percA: percA, percB: percB, overlap: commonPerc });
            }
        }
    });

    // 2. Sector Overlap (Structural Redundancy)
    let sectorOverlapPercent = 0;
    const sectorMapB = new Map();
    sectorsB.forEach(s => {
        const key = (s.sector || '').toLowerCase().trim();
        if (key) sectorMapB.set(key, s.percentage);
    });

    sectorsA.forEach(s => {
        const key = (s.sector || '').toLowerCase().trim();
        if (key && sectorMapB.has(key)) {
            const percB = parsePercent(sectorMapB.get(key));
            const percA = parsePercent(s.percentage);
            if (percA > 0 && percB > 0) {
                sectorOverlapPercent += Math.min(percA, percB);
            }
        }
    });

    return {
        overlap: parseFloat(overlapPercent.toFixed(2)),
        sectorOverlap: parseFloat(sectorOverlapPercent.toFixed(2)),
        common: common.sort((a, b) => b.overlap - a.overlap)
    };
}

/**
 * Calculates pairwise overlaps for a list of funds.
 */
export function calculateOverlaps(funds) {
    const results = [];
    for (let i = 0; i < funds.length; i++) {
        for (let j = i + 1; j < funds.length; j++) {
            const result = calculateOverlap(funds[i], funds[j]);
            results.push({
                fund1: funds[i].fundName || funds[i].name || "Unnamed Fund",
                fund2: funds[j].fundName || funds[j].name || "Unnamed Fund",
                ...result
            });
        }
    }
    return results;
}

/**
 * Provides high-fidelity qualitative feedback with strategic risk assessment.
 */
export function getDetailedInstitutionalVerdict(overlap, fund1, fund2) {
    const metrics = {
        score: "UNKNOWN",
        verdict: "Analyzing structural redundancy...",
        implication: "Checking for manager alpha-cannibalization.",
        riskLevel: "MODERATE",
        color: "indigo"
    };

    if (overlap < 15) {
        metrics.score = "PLATINUM DIVERSIFICATION";
        metrics.verdict = `Exceptional strategic isolation between ${fund1} and ${fund2}.`;
        metrics.implication = "These funds maintain completely unique alpha-generation corridors. Holding both maximizes your breadth across the market.";
        metrics.riskLevel = "LOW";
        metrics.color = "emerald";
    } else if (overlap < 35) {
        metrics.score = "SOLID SYNERGY";
        metrics.verdict = `Healthy diversification with minor commonality.`;
        metrics.implication = "A managed level of overlap suggest shared conviction in a few high-conviction ideas while maintaining separate risk-profiles.";
        metrics.riskLevel = "LOW";
        metrics.color = "emerald";
    } else if (overlap < 55) {
        metrics.score = "MODERATE REDUNDANCY";
        metrics.verdict = `Efficiency is beginning to decay due to overlap.`;
        metrics.implication = "You are paying two expense ratios for a shared stock universe. Consider if the unique alpha from each manager justifies the duplicated core.";
        metrics.riskLevel = "MODERATE";
        metrics.color = "amber";
    } else if (overlap < 75) {
        metrics.score = "HIGH CORRELATION";
        metrics.verdict = `Strategic cannibalization detected.`;
        metrics.implication = "Significant overlap (>55%) means these funds move in lock-step. You are essentially holding a larger, more expensive version of one fund.";
        metrics.riskLevel = "HIGH";
        metrics.color = "orange";
    } else {
        metrics.score = "CRITICAL OVERLAP";
        metrics.verdict = `Institutional-grade redundancy warning.`;
        metrics.implication = "Extreme holdings overlap makes one of these funds redundant. This setup leads to massive manager overlap without significant differentiation.";
        metrics.riskLevel = "CRITICAL";
        metrics.color = "red";
    }

    return metrics;
}

/**
 * Returns a list of top 10 categories to suggest alternatives from.
 * (Used in the API to pull from rankings)
 */
export const INSTITUTIONAL_CATEGORIES = [
    "Flexi Cap", "Large Cap", "Mid Cap", "Small Cap", 
    "Multi Cap", "ELSS", "Value", "Focused", "Large & Mid Cap"
];
