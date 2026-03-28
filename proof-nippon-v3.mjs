import fs from 'fs';
import pdf from 'pdf-parse';
import { parseFactsheetText } from './lib/factsheet-extractor.js';

async function proofNippon() {
    console.log('--- NIPPON ISOLATION PROOF v3 ---');
    const buffer = fs.readFileSync('Nippon-FS.pdf');
    const pdfData = await pdf(buffer);
    const text = pdfData.text;

    console.log('\n[TESTING: NIPPON INDIA GROWTH MID CAP]');
    const midCap = await parseFactsheetText(text, 'Nippon India Growth Mid Cap Fund', 'Nippon India Mutual Fund');
    console.log(`MATCHED AT: ${midCap.foundAt}`);
    console.log(`HOLDINGS: ${midCap.top_holdings.slice(0, 3).map(h => h.company).join(', ')}`);

    console.log('\n[TESTING: NIPPON INDIA SMALL CAP]');
    const smallCap = await parseFactsheetText(text, 'Nippon India Small Cap Fund', 'Nippon India Mutual Fund');
    console.log(`MATCHED AT: ${smallCap.foundAt}`);
    console.log(`HOLDINGS: ${smallCap.top_holdings.slice(0, 3).map(h => h.company).join(', ')}`);
}

proofNippon().catch(err => console.error('PROOF FAILED:', err));
