import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import fetch from 'node-fetch';
import { parseFactsheetText } from './lib/factsheet-extractor.js';

const pdfUrl = 'https://mf.nipponindiaim.com/InvestorServices/FactSheet/Nippon-FS-Feb-2026.pdf';

async function diagnose() {
    console.log('--- DIAGNOSING NIPPON MISMATCH ---');
    const pdfRes = await fetch(pdfUrl);
    const buffer = await pdfRes.arrayBuffer();
    const pdfData = await pdf(Buffer.from(buffer));
    const text = pdfData.text;

    const funds = [
        { name: 'Nippon India Growth Mid Cap Fund', code: '118668' },
        { name: 'Nippon India Small Cap Fund', code: '118778' }
    ];

    for (const fund of funds) {
        console.log(`\n\n=== FUND: ${fund.name} ===`);
        const res = parseFactsheetText(text, fund.name, 'Nippon India Mutual Fund');
        console.log(`Found context at index ${res.foundAt || 'N/A'}`);
        console.log('Top 5 Holdings:', res.top_holdings.slice(0, 5).map(h => h.company).join(', '));
    }
}

diagnose().catch(console.error);
