import fs from 'fs';
import path from 'path';

async function testApi() {
    const pdfPath = 'C:\\Users\\maddy\\OneDrive\\Documents\\Antigravity\\mf-research\\cas_summary_report_2026_03_24_071249.pdf';
    const url = 'http://localhost:3000/api/portfolio/import-cas';

    console.log(`Pinging API at ${url} with file ${pdfPath}...`);

    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(pdfPath)], { type: 'application/pdf' });
    formData.append('file', blob, 'cas.pdf');
    formData.append('password', '');

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const contentType = response.headers.get('content-type');
        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${contentType}`);

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (response.ok) {
                console.log('Success! Received JSON:');
                console.log(`Funds found: ${data.funds?.length || 0}`);
                data.funds.forEach(f => {
                    console.log(`  - [${f.schemeCode}] ${f.schemeName} (${f.valuation}) [${f.category}]`);
                });
                console.log(`Message: ${data.message}`);
            } else {
                console.error('API Error Response:');
                console.error(JSON.stringify(data, null, 2));
            }
        } else {
            const text = await response.text();
            console.error('FAILED! Received non-JSON response (first 200 chars):');
            console.error(text.substring(0, 200));
        }
    } catch (e) {
        console.error('Request failed:', e.message);
    }
}

testApi();
