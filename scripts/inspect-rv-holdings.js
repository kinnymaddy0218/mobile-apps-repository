async function inspectRVHoldings() {
    const schemeCode = '1492';
    const url = `https://www.rupeevest.com/functionalities/portfolio_holdings?schemecode=${schemeCode}`;
    const headers = { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://www.rupeevest.com/Mutual-Funds-India/${schemeCode}`
    };

    console.log("Fetching detailed holdings JSON...");
    try {
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (data && data.length > 0) {
            console.log("First item sample:", JSON.stringify(data[0], null, 2));
            // Check keys
            console.log("Keys available:", Object.keys(data[0]));
        } else {
            console.log("Empty holdings or not JSON.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
inspectRVHoldings();
