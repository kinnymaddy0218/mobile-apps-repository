const fetch = require('node-fetch');

const TEST_FUNDS = [
    { code: '103038', name: 'SBI Bluechip' },
    { code: '118955', name: 'HDFC Flexi Cap' },
    { code: '100378', name: 'ICICI Bluechip' },
    { code: '118778', name: 'Nippon Small Cap' },
    { code: '119280', name: 'Kotak Flexi Cap' },
    { code: '120503', name: 'Axis Bluechip' },
    { code: '118834', name: 'Mirae Large Cap' },
    { code: '120847', name: 'Quant Small Cap' },
    { code: '122639', name: 'Parag Parikh Flexi Cap' },
    { code: '119107', name: 'Tata Large Cap' },
    { code: '118223', name: 'Motilal Oswal Flexi Cap' },
    { code: '107386', name: 'Invesco Contra' },
    { code: '118671', name: 'LIC Large Cap' },
    { code: '124115', name: 'Bandhan Large Cap' },
    { code: '149261', name: 'White Oak Flexi Cap' },
    { code: '150917', name: 'Zerodha Nifty 50' },
    { code: '103022', name: 'HSBC Value' },
    { code: '107129', name: 'Edelweiss Mid Cap' },
    { code: '118544', name: 'DSP Top 100' }
];

async function runVerification() {
    const results = [];
    const PORT = 3001;
    
    console.log(`Starting Comprehensive Verification across ${TEST_FUNDS.length} AMCs...\n`);

    for (const fund of TEST_FUNDS) {
        process.stdout.write(`[TESTING] ${fund.name.padEnd(25)} (${fund.code})... `);
        const start = Date.now();
        try {
            const res = await fetch(`http://localhost:${PORT}/api/funds/${fund.code}/factsheet`);
            const data = await res.json();
            const duration = (Date.now() - start) / 1000;
            
            if (res.ok) {
                console.log(`OK (${duration.toFixed(1)}s) [Source: ${data.source}]`);
                results.push({ name: fund.name, amc: data.detected_amc, status: 'PASS', duration, source: data.source });
            } else {
                console.log(`FAIL: ${data.error}`);
                results.push({ name: fund.name, status: 'FAIL', error: data.error });
            }
        } catch (err) {
            console.log(`ERROR: ${err.message}`);
            results.push({ name: fund.name, status: 'ERROR', message: err.message });
        }
    }

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.table(results);
}

runVerification();
