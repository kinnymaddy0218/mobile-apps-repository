import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import fetch from 'node-fetch';
import { parseFactsheetText } from './lib/factsheet-extractor.js';

const pdfUrl = 'https://mf.nipponindiaim.com/InvestorServices/FactSheet/Nippon-FS-Feb-2026.pdf';

async function deepCompare() {
    console.log('--- DEEP COMPARING NIPPON MID VS SMALL CAP ---');
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
        console.log('Top 10 Holdings:');
        res.top_holdings.slice(0, 10).forEach((h, i) => console.log(`${i+1}. ${h.company} (${h.percentage})`));
        console.log('\nSectors:');
        res.sector_allocation.forEach(s => console.log(`- ${s.sector}: ${s.percentage}`));
    }
}

deepCompare().catch(console.error);
