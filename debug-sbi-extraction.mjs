
import fs from 'fs';
import { parseFactsheetText } from './lib/factsheet-extractor.js';

const text = fs.readFileSync('sbi_full_dump.txt', 'utf8');
const fundName = "SBI Large Cap Fund";
const amc = "SBI Mutual Fund";

console.log(`\n--- Debugging SBI Extraction ---`);
const result = parseFactsheetText(text, fundName, amc);

console.log("\n[Result] Risk Ratios:");
console.log(JSON.stringify(result.risk_ratios, null, 2));

// Search for the merged pattern manually to see why it fails
const mergedPattern = /(\d{1,2}\.\d{2})\s*(\d{1,2}\.\d{2})/;
const matches = text.match(new RegExp(mergedPattern, 'g'));
console.log("\n[Debug] Global Merged Matches found in full text (first 10):", matches?.slice(0, 10));

// Find where SBI Large Cap starts
const normalizedName = fundName.toLowerCase().replace(/fund/g, '').trim();
const idx = text.toLowerCase().indexOf(normalizedName);
if (idx !== -1) {
    const context = text.substring(idx - 3000, idx + 5000);
    console.log(`\n[Debug] Context around ${fundName} (index ${idx}):`);
    
    // Find the lines with decimals
    const lines = context.split('\n').filter(l => l.includes('.'));
    console.log("[Debug] Decimal lines found in context (first 10):", lines.slice(0, 10));
    
    for (const line of lines) {
        if (line.match(/\d\.\d{2}\d\.\d{2}/)) {
            console.log(`\n[Found Merged!] Line: "${line}"`);
            const m = line.match(/(\d\.\d{2})(\d\.\d{2})/);
            console.log("Matched:", m?.[1], m?.[2]);
        }
    }
}
