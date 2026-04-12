export const CATEGORIES = [
    // Equity Categories
    { key: 'large-cap', label: 'Large Cap', keywords: ['large cap', 'large-cap', 'largecap', 'bluechip'] },
    { key: 'next-50', label: 'Nifty Next 50', keywords: ['next 50', 'next-50', 'junior nifty'] },
    { key: 'mid-cap', label: 'Mid Cap', keywords: ['mid cap', 'mid-cap', 'midcap'] },
    { key: 'small-cap', label: 'Small Cap', keywords: ['small cap', 'small-cap', 'smallcap'] },
    { key: 'flexi-cap', label: 'Flexi Cap', keywords: ['flexi cap', 'flexi-cap', 'flexicap'] },
    { key: 'multi-cap', label: 'Multi Cap', keywords: ['multi cap', 'multi-cap', 'multicap'] },
    { key: 'large-mid', label: 'Large & Mid Cap', keywords: ['large & mid', 'large and mid', 'large-mid', 'emerging bluechip'] },
    { key: 'focused', label: 'Focused', keywords: ['focused'] },
    { key: 'value-contra', label: 'Value / Contra', keywords: ['value', 'contra'] },
    { key: 'dividend-yield', label: 'Dividend Yield', keywords: ['dividend yield', 'dividend-yield'] },
    { key: 'elss', label: 'ELSS / Tax Saver', keywords: ['elss', 'tax saver', 'tax-saver', 'tax saving', 'tax-saving', 'taxsaver'] },
    { key: 'sector-it', label: 'Thematic - Technology', keywords: ['technology', 'digital', 'it fund', 'it-fund'] },
    { key: 'sector-pharma', label: 'Thematic - Healthcare', keywords: ['pharma', 'healthcare'] },
    { key: 'sector-banking', label: 'Thematic - Finance', keywords: ['banking', 'financial', 'psu bank', 'fsi'] },
    { key: 'sector-infra', label: 'Thematic - Infrastructure', keywords: ['infrastructure', 'infra'] },
    { key: 'sector-consumption', label: 'Thematic - Consumption', keywords: ['consumption', 'fmcg', 'india opportunities', 'india-opportunities'] },
];

export const SAMPLE_FUNDS = {
    'Equity - Large Cap': [
        { code: '118825', name: 'Mirae Asset Large Cap Fund - Direct Plan - Growth' },
        { code: '119598', name: 'SBI Bluechip Fund - Direct Plan - Growth' },
        { code: '120593', name: 'ICICI Prudential Bluechip Fund - Direct Plan - Growth' },
        { code: '120186', name: 'ICICI Prudential US Bluechip Equity Fund - Direct Plan - Growth' },
        { code: '120757', name: 'UTI Bluechip Fund - Direct Plan - Growth' },
    ],
    'Equity - Mid Cap': [
        { code: '120505', name: 'Axis Midcap Fund - Direct Plan - Growth' },
        { code: '119062', name: 'HDFC Mid-Cap Opportunities Fund - Direct Plan - Growth' },
        { code: '148457', name: 'Nippon India Growth Fund - Direct Plan - Growth' },
        { code: '119071', name: 'DSP Midcap Fund - Direct Plan - Growth' },
        { code: '119779', name: 'Kotak Global Emerging Market Fund - Direct Plan - Growth' },
    ],
    'Equity - Small Cap': [
        { code: '125497', name: 'SBI Small Cap Fund - Direct Plan - Growth' },
        { code: '118778', name: 'Nippon India Small Cap Fund - Direct Plan - Growth' },
        { code: '130503', name: 'HDFC Small Cap Fund - Direct Plan - Growth' },
        { code: '120828', name: 'Quant Small Cap Fund - Direct Plan - Growth' },
        { code: '120164', name: 'Kotak Small Cap Fund - Direct Plan - Growth' },
        { code: '125354', name: 'Axis Small Cap Fund - Direct Plan - Growth' },
    ],
    'Equity - Flexi Cap': [
        { code: '122639', name: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth' },
        { code: '118955', name: 'HDFC Flexi Cap Fund - Direct Plan - Growth' },
        { code: '120166', name: 'Kotak Flexicap Fund - Direct Plan - Growth' },
        { code: '120843', name: 'Quant Flexi Cap Fund - Direct Plan - Growth' },
    ],
    'Equity - Multi Cap': [
        { code: '148961', name: 'HDFC Multi Cap Fund - Direct Plan - Growth' },
        { code: '118651', name: 'Nippon India Multi Cap Fund - Direct Plan - Growth' },
        { code: '148921', name: 'Aditya Birla Sun Life Multi Cap Fund - Direct Plan - Growth' },
    ],
    'Equity - ELSS (Tax Saver)': [
        { code: '120503', name: 'Axis ELSS Tax Saver Fund - Direct Plan - Growth' },
        { code: '135781', name: 'Mirae Asset ELSS Tax Saver Fund - Direct Plan - Growth' },
        { code: '119773', name: 'Kotak ELSS Tax Saver Fund - Direct Plan - Growth' },
    ],
    'Equity - Large & Mid Cap': [
        { code: '119721', name: 'SBI Large & Midcap Fund - Direct Plan - Growth' },
        { code: '130498', name: 'HDFC Large and Mid Cap Fund - Direct Plan - Growth' },
        { code: '120714', name: 'Mirae Asset Emerging Bluechip Fund - Direct Plan - Growth' },
    ],
    'Equity - Contra': [
        { code: '119835', name: 'SBI Contra Fund - Direct Plan - Growth' },
        { code: '120348', name: 'Invesco India Contra Fund - Direct Plan - Growth' },
        { code: '119769', name: 'Kotak Contra Fund - Direct Plan - Growth' },
    ],
    'Equity - Value': [
        { code: '120323', name: 'ICICI Prudential Value Fund - Direct Plan - Growth' },
        { code: '118935', name: 'HDFC Value Fund - Direct Plan - Growth' },
        { code: '118784', name: 'Nippon India Value Fund - Direct Plan - Growth' },
    ],
    'Equity - Focused': [
        { code: '119727', name: 'SBI Focused Fund - Direct Plan - Growth' },
        { code: '133529', name: 'HDFC Focused Equity Fund - Direct Plan - Growth' },
        { code: '118421', name: 'Bandhan Focused Fund - Direct Plan - Growth' },
    ],
};

export function getFundsForCategory(apiCategory) {
    if (!apiCategory) return [];
    const lower = apiCategory.toLowerCase();
    if (lower.includes('large & mid') || lower.includes('large and mid')) return SAMPLE_FUNDS['Equity - Large & Mid Cap'] || [];
    if (lower.includes('small cap')) return SAMPLE_FUNDS['Equity - Small Cap'] || [];
    if (lower.includes('mid cap')) return SAMPLE_FUNDS['Equity - Mid Cap'] || [];
    if (lower.includes('large cap')) return SAMPLE_FUNDS['Equity - Large Cap'] || [];
    if (lower.includes('flexi cap')) return SAMPLE_FUNDS['Equity - Flexi Cap'] || [];
    if (lower.includes('multi cap')) return SAMPLE_FUNDS['Equity - Multi Cap'] || [];
    if (lower.includes('elss')) return SAMPLE_FUNDS['Equity - ELSS (Tax Saver)'] || [];
    if (lower.includes('contra')) return SAMPLE_FUNDS['Equity - Contra'] || [];
    if (lower.includes('value')) return SAMPLE_FUNDS['Equity - Value'] || [];
    if (lower.includes('focused')) return SAMPLE_FUNDS['Equity - Focused'] || [];
    return [];
}

/**
 * Unified category normalization across the portfolio system.
 * Groups diverse AMC descriptions into standard Equity, Debt, Gold, and Hybrid buckets.
 */
export const normalizeCategory = (cat, schemeName = '') => {
    let cleanCat = cat || 'Other';
    // Remove redundant "Scheme" or "Fund" suffixes
    cleanCat = cleanCat.replace(/scheme|fund|plan|option/gi, '').trim();
    const lowerFull = (cleanCat + ' ' + schemeName).toLowerCase();

    if (/debt|liquid|bond|money market|monetary|cash/i.test(lowerFull)) {
        if (/liquid/i.test(lowerFull)) return 'Debt - Liquid';
        if (/overnight/i.test(lowerFull)) return 'Debt - Overnight';
        if (/money market/i.test(lowerFull)) return 'Debt - Money Market';
        return 'Debt';
    }
    if (/gold|silver|commodity|metal/i.test(lowerFull)) {
        return 'Metals - Gold & Silver';
    }
    if (/index|nifty|sensex|etf/i.test(lowerFull)) {
        return 'Equity - Index';
    }
    
    // Sectoral / Thematic Detection
    if (/\b(health|pharma|medical|technology|tech|IT|digital|bank|finance|fsi|psu|energy|manufact|auto|infra|telecom|consumer|fmcg|sector|thematic)\b/i.test(lowerFull)) {
        return 'Equity - Sectoral / Thematic';
    }

    // Specific Equity Categories
    if (/large & mid|large and mid/i.test(lowerFull)) return 'Equity - Large & Mid Cap';
    if (/small cap|smallcap/i.test(lowerFull)) return 'Equity - Small Cap';
    if (/mid cap|midcap/i.test(lowerFull)) return 'Equity - Mid Cap';
    if (/large cap|largecap/i.test(lowerFull)) return 'Equity - Large Cap';
    if (/flexi/i.test(lowerFull)) return 'Equity - Flexi Cap';
    if (/multi cap|multicap/i.test(lowerFull)) return 'Equity - Multi Cap';
    if (/contra/i.test(lowerFull)) return 'Equity - Contra';
    if (/value/i.test(lowerFull)) return 'Equity - Value';
    if (/focused|focus/i.test(lowerFull)) return 'Equity - Focused';
    if (/dividend yield/i.test(lowerFull)) return 'Equity - Dividend Yield';
    if (/elss|tax saving/i.test(lowerFull)) return 'Equity - ELSS (Tax Saver)';

    // Hybrid / Arbitrage - Merged into Equity for Asset Allocation Alignment
    if (/hybrid|balanced|arbitrage/i.test(lowerFull)) {
        if (/arbitrage/i.test(lowerFull)) return 'Equity - Hybrid Arbitrage';
        if (/balanced advantage|dynamic asset/i.test(lowerFull)) return 'Equity - Balanced Advantage';
        return 'Equity - Hybrid';
    }
    
    // Final fallback for identified Equity
    if (cleanCat.startsWith('Equity')) return cleanCat;
    return `Equity - ${cleanCat}`; 
};

/**
 * Strips technical noise from fund names for a cleaner UI.
 */
export const cleanSchemeName = (name) => {
    if (!name) return '';
    return name
        .replace(/\b(idcw|dividend|payout|reinvestment|plan|option)\b/gi, '')
        .replace(/- -/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
};
