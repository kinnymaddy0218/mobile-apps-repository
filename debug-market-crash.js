const symbol = '^NSEI';
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;

async function debug() {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const json = await res.json();
        const result = json.chart?.result?.[0];
        if (!result) {
            console.log('No result');
            return;
        }

        const meta = result.meta;
        console.log('--- META ---');
        console.log('Symbol:', meta.symbol);
        console.log('Regular Market Price:', meta.regularMarketPrice);
        console.log('Chart Previous Close:', meta.chartPreviousClose);
        console.log('Previous Close:', meta.previousClose);
        console.log('Exchange Time:', new Date(meta.regularMarketTime * 1000).toLocaleString());
        
        const currentLevel = meta.regularMarketPrice;
        const prevClose = meta.previousClose;
        const change = currentLevel - prevClose;
        const percent = (change / prevClose) * 100;

        console.log('--- CALC ---');
        console.log('Points Change:', change);
        console.log('Percent Change:', percent.toFixed(2) + '%');

        if (percent > 0) {
            console.log('RESULT: GREEN (ERROR IF MARKET CRASHED)');
        } else {
            console.log('RESULT: RED (EXPECTED)');
        }
    } catch (e) {
        console.error(e);
    }
}

debug();
