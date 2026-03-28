
const queries = [
    "Motilal Oswal S&P 500 Index Fund Direct Growth",
    "ICICI Prudential NASDAQ 100 Index Fund Direct Growth",
    "Nippon India Liquid Fund Direct Growth",
    "Edelweiss Greater China Equity Off-Shore Fund Direct Growth",
    "HDFC NIFTY 10 Year G-Sec Index Fund Direct Growth",
    "UTI Nifty 50 Index Fund Direct Growth",
    "Motilal Oswal Midcap 150 Index Fund Direct Growth",
    "Motilal Oswal Smallcap 250 Index Fund Direct Growth",
    "Motilal Oswal Nifty 500 Index Fund Direct Growth"
];

async function search() {
    const results = {};
    for (const q of queries) {
        try {
            const url = `https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            const data = await res.json();
            const direct = data.find(s => s.schemeName.toLowerCase().includes('direct') && s.schemeName.toLowerCase().includes('growth'));
            results[q] = direct || data[0];
        } catch (e) {
            results[q] = { error: e.message };
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

search();
