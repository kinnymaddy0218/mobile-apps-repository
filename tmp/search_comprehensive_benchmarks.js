
const fs = require('fs');
const queries = [
    // Core Indices
    "UTI Nifty 50 Index Fund Direct Growth",
    "HDFC Nifty 100 Index Fund Direct Growth",
    "Motilal Oswal Nifty Midcap 150 Index Fund Direct Growth",
    "Motilal Oswal Nifty Smallcap 250 Index Fund Direct Growth",
    "Motilal Oswal Nifty 500 Index Fund Direct Growth",
    "Motilal Oswal Nifty Total Market Index Fund Direct Growth",
    
    // Factor / Strategy
    "Motilal Oswal Nifty 200 Momentum 30 Index Fund Direct Growth",
    "ICICI Prudential Nifty Low Volatility 30 Index Fund Direct Growth",
    "UTI Nifty200 Quality 30 Index Fund Direct Growth",
    "Kotak Nifty Alpha 50 ETF",
    "HDFC Nifty 50 Equal Weight Index Fund Direct Growth",
    "ICICI Prudential Nifty Dividend Opportunities 50 Index Fund Direct Growth",
    
    // Sectoral
    "ICICI Prudential Nifty Bank Index Fund Direct Growth",
    "ICICI Prudential Nifty Financial Services Index Fund Direct Growth",
    "ICICI Prudential Nifty FMCG Index Fund Direct Growth",
    "ICICI Prudential Nifty IT Index Fund Direct Growth",
    "ICICI Prudential Nifty Pharma Index Fund Direct Growth",
    "HDFC Nifty PSU Bank ETF",
    "Nippon India Nifty Auto ETF",
    "ICICI Prudential Nifty Infrastructure Index Fund Direct Growth",
    "Nippon India Nifty Energy Index Fund Direct Growth",
    "ICICI Prudential Nifty India Manufacturing Index Fund Direct Growth",
    
    // International
    "Motilal Oswal S&P 500 Index Fund Direct Growth",
    "ICICI Prudential NASDAQ 100 Index Fund Direct Growth",
    "Edelweiss Greater China Equity Off-Shore Fund Direct Growth",
    
    // Hybrid / Debt / Liquid
    "ICICI Prudential Balanced Advantage Fund Direct Growth",
    "ICICI Prudential Equity & Debt Fund Direct Growth",
    "Nippon India Liquid Fund Direct Growth",
    "HDFC Nifty G-Sec Dec 2026 Index Fund Direct Growth" // Proxy for G-Sec
];

async function search() {
    const output = [];
    for (const q of queries) {
        try {
            const url = `https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            const data = await res.json();
            let best = data.find(s => 
                s.schemeName.toLowerCase().includes('direct') && 
                s.schemeName.toLowerCase().includes('growth')
            );
            if (!best) {
                best = data.find(s => s.schemeName.toLowerCase().includes('etf')) || 
                       data.find(s => s.schemeName.toLowerCase().includes('growth')) ||
                       data[0];
            }
            if (best) {
                output.push(`${q}|${best.schemeName}|${best.schemeCode}`);
            } else {
                output.push(`${q}|MISS|MISS`);
            }
        } catch (e) {
            output.push(`${q}|ERR|${e.message}`);
        }
    }
    fs.writeFileSync('tmp/benchmark_matches.txt', output.join('\n'));
}

search();
