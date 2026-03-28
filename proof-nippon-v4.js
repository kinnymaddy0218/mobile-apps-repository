const fs = require('fs');
const pdf = require('pdf-parse');
const { parseFactsheetText } = require('./lib/factsheet-extractor.js');

async function proofNippon() {
    console.log('--- NIPPON ISOLATION PROOF v4 (CJS) ---');
    if (!fs.existsSync('Nippon-FS.pdf')) {
        console.error('Nippon-FS.pdf NOT FOUND!');
        return;
    }
    const buffer = fs.readFileSync('Nippon-FS.pdf');
    const pdfData = await pdf(buffer);
    const text = pdfData.text;

    console.log('\n[TESTING: NIPPON INDIA GROWTH MID CAP]');
    const midCap = await parseFactsheetText(text, 'Nippon India Growth Mid Cap Fund', 'Nippon India Mutual Fund');
    console.log(`MATCHED AT: ${midCap.foundAt}`);
    const h1 = (midCap.top_holdings || []).slice(0, 3).map(h => h.company).join(', ');
    console.log(`HOLDINGS: ${h1 || 'N/A'}`);
    console.log(`TER: ${midCap.expense_ratio}%`);

    console.log('\n[TESTING: NIPPON INDIA SMALL CAP]');
    const smallCap = await parseFactsheetText(text, 'Nippon India Small Cap Fund', 'Nippon India Mutual Fund');
    console.log(`MATCHED AT: ${smallCap.foundAt}`);
    const h2 = (smallCap.top_holdings || []).slice(0, 3).map(h => h.company).join(', ');
    console.log(`HOLDINGS: ${h2 || 'N/A'}`);
    console.log(`TER: ${smallCap.expense_ratio}%`);
}

proofNippon().catch(err => console.error('PROOF FAILED:', err));
