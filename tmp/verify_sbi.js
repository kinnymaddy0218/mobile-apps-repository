// Simulate the API Route logic with stricter checks
const fs = require('fs');

// Mock fuzzyMatch
function fuzzyMatch(extractedName, fundList) {
    const q = extractedName.toLowerCase();
    const words = q.replace(/ld\d+\w*|dir|gr|plan|option|-/gi, '').split(/\s+/).filter(w => w.length > 2);
    
    // Simulating matching based on common SBI fund names
    if (q.includes('gold')) return { schemeCode: 119531, schemeName: 'SBI Gold Fund-Direct Plan-Growth' };
    if (q.includes('contra')) return { schemeCode: 119530, schemeName: 'SBI Contra Fund - Direct Plan - Growth' };
    if (q.includes('healthcare')) return { schemeCode: 119525, schemeName: 'SBI Healthcare Opportunities Fund - Direct Plan - Growth' };
    if (q.includes('large & midcap')) return { schemeCode: 119526, schemeName: 'SBI Large & Midcap Fund - Direct Plan - Growth' };
    if (q.includes('psu')) return { schemeCode: 119527, schemeName: 'SBI PSU Fund - Direct Plan - Growth' };
    if (q.includes('midcap 150 index')) return { schemeCode: 119528, schemeName: 'SBI Nifty Midcap 150 Index Fund - Direct Plan - Growth' };
    if (q.includes('nifty index')) return { schemeCode: 119529, schemeName: 'SBI Nifty Index Fund - Direct Plan - Growth' };
    return null;
}

const raw = fs.readFileSync('C:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/tmp/sbi_rows_debug.txt', 'utf8').split('\n');
const extractedFunds = [];
let currentFundName = "";

for (let line of raw) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    const numbers = cleanLine.match(/(?<!\()\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b(?!\))/g);
    const looksLikeFund = /fund|growth|direct|reg|elss|equity|debt|hybrid|cap|value|index|tax|liquid|money|bond|gilt|overnight|dynamic|alpha|bluechip|pharma|healthcare|energy|resources|technology|it|infra|banking|financial/i.test(cleanLine);

    if (looksLikeFund && cleanLine.split(/\s+/).length >= 2) {
        if (numbers && numbers.length > 0) {
            const valuationStr = numbers[numbers.length - 1];
            const valuation = parseFloat(valuationStr.replace(/,/g, ''));
            if (valuation > 100) {
                let name = cleanLine.split(/\d{1,3}(?:,\d{3})*(?:\.\d{2})/)[0].trim();
                const match = fuzzyMatch(name, []);
                extractedFunds.push({ name: match ? match.schemeName : name, value: valuation });
                currentFundName = "";
                continue;
            }
        }
        currentFundName = cleanLine;
    } else if (numbers && numbers.length > 0 && currentFundName) {
        const valuationStr = numbers[numbers.length - 1];
        const valuation = parseFloat(valuationStr.replace(/,/g, ''));
        if (valuation > 100) {
            const match = fuzzyMatch(currentFundName, []);
            extractedFunds.push({ name: match ? match.schemeName : currentFundName, value: valuation });
            currentFundName = "";
        }
    }
}

console.log('--- Extracted Funds (SBI Template) ---');
extractedFunds.forEach((f, i) => console.log(`${i+1}. ${f.name} (₹${f.value.toLocaleString('en-IN')})`));
