
const fuzzyMatch = (extractedName, fundList) => {
    if (!extractedName || !fundList || !fundList.length) return null;
    
    const query = extractedName.toLowerCase();
    const isDirect = query.includes('direct');
    const isRegular = query.includes('regular');
    const isGrowth = query.includes('growth');
    const isIDCW = /idcw|dividend|payout|reinvestment/i.test(query);

    const extractedWords = query
        .replace(/\d+/g, '')
        .replace(/folio|account|growth|direct|plan|option|fund|mutual|scheme|-|regular|idcw|dividend|payout|reinvestment|fof|ETF/gi, '')
        .split(/\s+/)
        .filter(w => w.length > 2);

    if (extractedWords.length === 0) return null;

    let bestMatch = null;
    let maxScore = 0;

    for (const fund of fundList) {
        const candName = fund.schemeName.toLowerCase();
        
        // 1. Strict Plan Type Enforcement
        if (isDirect && candName.includes('regular')) continue;
        if (isRegular && candName.includes('direct')) continue;
        
        // 2. Index Fund and Cap Size Exclusions
        if (query.includes('index') !== candName.includes('index')) continue;
        
        // 3. Score calculation
        const candWords = candName.replace(/growth|direct|plan|option|fund|mutual|scheme|-|regular|idcw|dividend|payout|reinvestment|fof|ETF/gi, '').split(/\s+/).filter(w => w.length > 2);
        
        let overlap = 0;
        for (const word of extractedWords) {
            if (candWords.includes(word)) overlap++;
        }

        let score = overlap / Math.max(extractedWords.length, candWords.length);

        // 4. Growth vs IDCW Prioritization
        if (isGrowth && candName.includes('growth')) score += 0.05;
        if (isIDCW && /idcw|dividend|payout|reinvestment/i.test(candName)) score += 0.05;
        
        if (isDirect && !candName.includes('direct')) score -= 0.2;
        if (isRegular && !candName.includes('regular')) score -= 0.2;

        if (score > maxScore) {
            maxScore = score;
            bestMatch = fund;
        }
    }

    if (maxScore > 0.65) return bestMatch;
    return null;
};

// Mock Fund List (from mfapi.in structure)
const fundList = [
    { schemeCode: 120716, schemeName: "UTI Nifty 50 Index Fund - Direct Plan - Growth Option" },
    { schemeCode: 100466, schemeName: "UTI Nifty 50 Index Fund - Regular Plan - Growth Option" },
    { schemeCode: 100465, schemeName: "UTI Nifty 50 Index Fund - Regular Plan - IDCW Option" },
    { schemeCode: 121334, schemeName: "ICICI Prudential Multi-Asset Fund - Direct Plan - Growth" },
    { schemeCode: 100344, schemeName: "ICICI Prudential Multi-Asset Fund - Regular Plan - IDCW" },
    { schemeCode: 120534, schemeName: "DSP Money Market Fund - Direct Plan - Growth" },
    { schemeCode: 100234, schemeName: "DSP Money Market Fund - Regular Plan - Growth" },
    { schemeCode: 121382, schemeName: "DSP Natural Resources Fund - Direct Plan - Growth" }
];

const testCases = [
    { name: "UTI NIFTY 50 INDEX FUND - DIRECT PLAN - GROWTH OPTION", expected: 120716 },
    { name: "UTI NIFTY 50 INDEX FUND - REGULAR PLAN - IDCW", expected: 100465 },
    { name: "ICICI PRUDENTIAL MULTI-ASSET FUND - DIRECT PLAN - GROWTH", expected: 121334 },
    { name: "DSP MONEY MARKET FUND - DIRECT PLAN - GROWTH", expected: 120534 },
    { name: "DSP NATURAL RESOURCES FUND - DIRECT PLAN - GROWTH", expected: 121382 }
];

console.log("--- FUZZY MATCH VERIFICATION ---");
testCases.forEach(tc => {
    const match = fuzzyMatch(tc.name, fundList);
    const result = match && match.schemeCode === tc.expected ? "PASS" : "FAIL";
    console.log(`[${result}] Input: "${tc.name.slice(0, 30)}..." -> Match: ${match ? match.schemeName : 'NONE'}`);
    if (result === "FAIL") {
        console.log(`       Expected Code: ${tc.expected}, Got: ${match ? match.schemeCode : 'NONE'}`);
    }
});
