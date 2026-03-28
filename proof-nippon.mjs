import fs from 'fs';
import pdf from 'pdf-parse';
import { parseFactsheetText } from './lib/factsheet-extractor.js';

async function proofNippon() {
    console.log('--- NIPPON DATA ISOLATION PROOF v2 ---');
    const buffer = fs.readFileSync('Nippon-FS.pdf');
    const pdfData = await pdf(buffer);
    const text = pdfData.text;

    const midCap = await parseFactsheetText(text, 'Nippon India Growth Mid Cap Fund', 'Nippon India Mutual Fund');
    const smallCap = await parseFactsheetText(text, 'Nippon India Small Cap Fund', 'Nippon India Mutual Fund');

    console.log('\n=================================================');
    console.log(' निधि | NIPPON MID CAP        | NIPPON SMALL CAP');
    console.log('=================================================');
    console.log(`Index | ${(midCap.foundAt || 'N/A').toString().padEnd(20)} | ${(smallCap.foundAt || 'N/A').toString().padEnd(20)}`);
    console.log(`TER   | ${(midCap.expense_ratio || 'N/A').toString().padEnd(20)}% | ${(smallCap.expense_ratio || 'N/A').toString().padEnd(20)}%`);
    console.log('-------------------------------------------------');
    console.log('TOP 10 HOLDINGS:');
    for (let i = 0; i < 10; i++) {
        const h1 = midCap.top_holdings && midCap.top_holdings[i] ? midCap.top_holdings[i].company : 'N/A';
        const h2 = smallCap.top_holdings && smallCap.top_holdings[i] ? smallCap.top_holdings[i].company : 'N/A';
        console.log(`${(i+1).toString().padStart(2)}    | ${h1.substring(0, 20).padEnd(20)} | ${h2.substring(0, 20).padEnd(20)}`);
    }
}

proofNippon().catch(console.error);
