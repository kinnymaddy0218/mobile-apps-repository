const https = require('https');

const CATEGORIES = {
    'Equity - Large Cap': [
        'Axis Bluechip Direct',
        'Mirae Asset Large Cap Direct',
        'HDFC Top 100 Direct',
        'ICICI Pru Bluechip Direct',
        'SBI Bluechip Direct',
        'Kotak Bluechip Direct'
    ],
    'Equity - Mid Cap': [
        'Axis Midcap Direct',
        'HDFC Mid-Cap Opportunities Direct',
        'Kotak Emerging Equity Direct',
        'Nippon India Growth Direct',
        'Quant Mid Cap Direct'
    ],
    'Equity - Small Cap': [
        'Axis Small Cap Direct',
        'SBI Small Cap Direct',
        'Nippon India Small Cap Direct',
        'HDFC Small Cap Direct',
        'Kotak Small Cap Direct',
        'Quant Small Cap Direct'
    ],
    'Equity - Flexi Cap': [
        'Parag Parikh Flexi Cap Direct',
        'HDFC Flexi Cap Direct',
        'Kotak Flexicap Direct',
        'Quant Flexi Cap Direct'
    ],
    'Equity - Multi Cap': [
        'HDFC Multi Cap Direct',
        'Nippon India Multi Cap Direct',
        'ICICI Prudential Multi Cap Direct'
    ],
    'Equity - ELSS (Tax Saver)': [
        'Axis ELSS Direct',
        'Mirae Asset ELSS Direct',
        'Kotak ELSS Direct'
    ],
    'Equity - Large & Mid Cap': [
        'HDFC Large and Mid Cap Direct',
        'SBI Large & Midcap Direct',
        'Mirae Asset Emerging Bluechip Direct'
    ]
};

async function search(query) {
    return new Promise((resolve) => {
        https.get(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    // Filter for Direct and Growth
                    const matches = json.filter(f => 
                        f.schemeName.toLowerCase().includes('direct') && 
                        f.schemeName.toLowerCase().includes('growth')
                    );
                    resolve(matches[0] || null);
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function audit() {
    const results = {};
    for (const [cat, funds] of Object.entries(CATEGORIES)) {
        results[cat] = [];
        for (const fund of funds) {
            const match = await search(fund);
            if (match) {
                results[cat].push({ code: match.schemeCode.toString(), name: match.schemeName });
            } else {
                // Try even broader
                const broadMatch = await search(fund.replace('Direct', '').trim());
                if (broadMatch) {
                    results[cat].push({ code: broadMatch.schemeCode.toString(), name: broadMatch.schemeName });
                }
            }
            await new Promise(r => setTimeout(r, 100));
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

audit();
