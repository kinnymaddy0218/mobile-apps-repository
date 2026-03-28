import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSBICas() {
    const pdfPath = "C:\\Users\\maddy\\OneDrive\\Documents\\Antigravity\\mf-research\\SBI_MF_24March2026.pdf";
    const password = "AKTPM4412B";
    
    console.log(`Pinging API at http://localhost:3000/api/portfolio/import-cas with SBI file...`);

    const formData = new FormData();
    const pdfBuffer = fs.readFileSync(pdfPath);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', blob, path.basename(pdfPath));
    formData.append('password', password);

    try {
        const response = await fetch('http://localhost:3003/api/portfolio/import-cas', {
            method: 'POST',
            body: formData,
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        
        if (response.ok) {
            console.log('Success! Received JSON:');
            console.log(`Funds found: ${data.funds.length}`);
            data.funds.forEach(f => {
                console.log(`  - [${f.schemeCode}] ${f.schemeName} (₹${f.valuation}) [${f.category}]`);
            });
        } else {
            console.log('API Error Response:');
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

testSBICas();
