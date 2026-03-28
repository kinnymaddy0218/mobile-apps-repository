const symbols = [
    '^NSEI', 
    '^CNX100', 
    '^NSEMDCP50', 
    'NIFTY_MIDCAP_150.NS',
    'NIFTYSMLCAP250.NS',
    'NIF500TRI.NS',
    '^BSESN'
];

async function checkSymbols() {
    for (const symbol of symbols) {
        try {
            // interval 1d, range 5d gives us last 5 closes
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            console.log(`--- Symbol: ${symbol} ---`);
            if (!res.ok) {
                console.log(`Error: ${res.status} ${res.statusText}`);
                continue;
            }
            const json = await res.json();
            const result = json.chart?.result?.[0];
            if (!result) {
                console.log('No result in response');
                continue;
            }
            
            const meta = result.meta;
            const timestamps = result.timestamp || [];
            const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];
            
            console.log(`Current: ${meta.regularMarketPrice}`);
            console.log(`Meta Prev Close: ${meta.previousClose}`);
            console.log(`Chart Prev Close: ${meta.chartPreviousClose}`);
            
            if (timestamps.length >= 2) {
                const lastIdx = timestamps.length - 1;
                const prevIdx = timestamps.length - 2;
                const lastPrice = adjClose[lastIdx] || meta.regularMarketPrice;
                const prevPrice = adjClose[prevIdx];
                
                console.log(`Last 2 timestamps: ${new Date(timestamps[prevIdx] * 1000).toLocaleDateString()} -> ${new Date(timestamps[lastIdx] * 1000).toLocaleDateString()}`);
                console.log(`Last 2 Prices: ${prevPrice} -> ${lastPrice}`);
                const diff = lastPrice - prevPrice;
                const pct = (diff / prevPrice) * 100;
                console.log(`Calculated Change: ${diff.toFixed(2)} (${pct.toFixed(2)}%)`);
            } else {
                console.log('Insufficient history for change calculation');
            }
        } catch (e) {
            console.error(`Failed for ${symbol}:`, e.message);
        }
    }
}

checkSymbols();
