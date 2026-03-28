
const fs = require('fs');
const queries = [
    "Nifty Midcap 150 Index Fund",
    "Nifty Smallcap 250 Index Fund",
    "Nifty 500 Index Fund",
    "Nifty Total Market Index Fund",
    "Nifty 200 Momentum 30",
    "Nifty Low Volatility 30",
    "Nifty 100 Low Volatility 30",
    "Nifty 200 Quality 30",
    "Nifty Alpha Low Volatility 30",
    "Nifty 50 Equal Weight",
    "Nifty Dividend Opportunities 50",
    "Nifty Financial Services Index",
    "Nifty FMCG Index",
    "Nifty Healthcare TRI",
    "Nifty IT Index",
    "Nifty Infrastructure Index",
    "Nifty Energy Index",
    "Nifty India Manufacturing Index",
    "Nifty PSU Index",
    "Nifty Auto Index",
    "10 Year G-Sec Index Fund"
];

async function search() {
    const output = [];
    for (const q of queries) {
        try {
            const url = `https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            const data = await res.json();
            // Get top 3 matches for each
            const top3 = data.slice(0, 5).map(s => `${s.schemeName}|${s.schemeCode}`).join(';;');
            output.push(`${q}|${top3}`);
        } catch (e) {
            output.push(`${q}|ERR|${e.message}`);
        }
    }
    fs.writeFileSync('tmp/benchmark_broad_matches.txt', output.join('\n'));
}

search();
