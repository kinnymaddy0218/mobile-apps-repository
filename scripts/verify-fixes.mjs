// scripts/verify-fixes.mjs
import { parseFactsheetText } from '../lib/factsheet-extractor.js';
import pdf from 'pdf-parse';
import fetch from 'node-fetch';
import fs from 'fs';

async function verifyNippon() {
    console.log("--- Verifying Nippon India Sector Allocation ---");
    const url = "https://mf.nipponindiaim.com/InvestorServices/FactSheets/Nippon-FS-Feb-2026.pdf";
    const fundName = "Nippon India Small Cap Fund";

    console.log(`Downloading ${url}...`);
    const res = await fetch(url);
    const buffer = await res.buffer();
    
    console.log("Parsing PDF...");
    const data = await pdf(buffer);
    const text = data.text;
    
    // Save raw text for inspection if needed
    fs.writeFileSync('verify_nippon_raw.txt', text);
    
    console.log("Extracting data...");
    const result = await parseFactsheetText(text, fundName);
    
    console.log(`Fund: ${fundName}`);
    console.log(`Total Sectors Found: ${result.sector_allocation.length}`);
    console.log("Sectors:", JSON.stringify(result.sector_allocation, null, 2));
    
    if (result.sector_allocation.length > 0) {
        console.log("✅ Nippon India Sector Allocation Fix Verified!");
    } else {
        console.log("❌ Nippon India Sector Allocation Fix FAILED!");
    }
}

verifyNippon();
