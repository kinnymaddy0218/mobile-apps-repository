import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const ROOT_DIR = 'C:\\Users\\maddy\\OneDrive\\Documents\\Antigravity\\mf-research';
const API_URL = 'http://localhost:3003/api/portfolio/import-cas';

const FILE_1 = path.join(ROOT_DIR, 'cas_summary_report_2026_03_24_071249.pdf');
const FILE_2 = path.join(ROOT_DIR, 'SBI_MF_24March2026.pdf');
const PW_2 = 'AKTPM4412B';

async function uploadFile(filePath, password = '') {
    const cmd = `curl -X POST -F "file=@${filePath}" -F "password=${password}" ${API_URL}`;
    const { stdout } = await execAsync(cmd);
    return JSON.parse(stdout);
}

function calculatePortfolio(funds) {
    const total = funds.reduce((sum, f) => sum + f.valuation, 0);
    const weights = funds.map(f => ({
        name: f.schemeName,
        value: f.valuation,
        weight: ((f.valuation / total) * 100).toFixed(2) + '%'
    }));
    const categories = {};
    funds.forEach(f => {
        categories[f.category] = (categories[f.category] || 0) + f.valuation;
    });
    const catMix = Object.entries(categories).map(([name, val]) => ({
        name,
        percent: ((val / total) * 100).toFixed(2) + '%'
    }));
    return { total, weights, catMix };
}

async function runSequentialTest() {
    console.log("--- PHASE 1: SINGLE FILE UPLOAD ---");
    const res1 = await uploadFile(FILE_1);
    const port1 = calculatePortfolio(res1.funds);
    console.log(`Total Funds: ${res1.funds.length}`);
    console.log(`Total Value: ₹${port1.total.toLocaleString()}`);
    console.log("Top 5 Weights:");
    console.table(port1.weights.slice(0, 5));
    console.log("Category Mix:");
    console.table(port1.catMix);

    console.log("\n--- PHASE 2: SEQUENTIAL UPLOAD (ADDING FILE 2) ---");
    const res2 = await uploadFile(FILE_2, PW_2);
    
    // Simulate frontend merging logic (dedupe and combine)
    const mergedMap = new Map();
    res1.funds.forEach(f => mergedMap.set(`${f.schemeCode}_${Math.round(f.valuation)}`, f));
    res2.funds.forEach(f => mergedMap.set(`${f.schemeCode}_${Math.round(f.valuation)}`, f));
    
    const mergedFunds = Array.from(mergedMap.values());
    const port2 = calculatePortfolio(mergedFunds);
    
    console.log(`Total Funds: ${mergedFunds.length}`);
    console.log(`Total Value: ₹${port2.total.toLocaleString()}`);
    console.log("Weights After Adjustment:");
    console.table(port2.weights.slice(0, 5));
    console.log("Category Mix After Adjustment:");
    console.table(port2.catMix);

    // Verify Weight Correction
    console.log("\n--- VERIFICATION CHECK ---");
    const pp_orig = port1.weights.find(w => w.name.includes('Parag Parikh'));
    const pp_new = port2.weights.find(w => w.name.includes('Parag Parikh'));
    console.log(`Parag Parikh Weight (1 File): ${pp_orig.weight}`);
    console.log(`Parag Parikh Weight (2 Files): ${pp_new.weight}`);
    if (parseFloat(pp_new.weight) < parseFloat(pp_orig.weight)) {
        console.log("✅ Weight successfully auto-corrected (diluted by new funds).");
    } else {
        console.log("❌ Weight failed to adjust.");
    }
}

runSequentialTest().catch(console.error);
