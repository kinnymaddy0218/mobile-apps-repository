
const fs = require('fs');
const queries = [
    "ICICI Prudential Nifty FMCG Index Fund Direct Growth",
    "ICICI Prudential Nifty Healthcare Index Fund Direct Growth",
    "ICICI Prudential Nifty Infrastructure Index Fund Direct Growth",
    "Nippon India Nifty Energy Index Fund Direct Growth",
    "UTI Nifty 10 yr G-Sec Index Fund Direct Growth"
];

async function search() {
    const output = [];
    for (const q of queries) {
        try {
            const url = `https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            const data = await res.json();
            const top = data[0] ? `${data[0].schemeName}|${data[0].schemeCode}` : "MISS";
            output.push(`${q}|${top}`);
        } catch (e) {
            output.push(`${q}|ERR|${e.message}`);
        }
    }
    fs.writeFileSync('tmp/benchmark_last_mile.txt', output.join('\n'));
}

search();
