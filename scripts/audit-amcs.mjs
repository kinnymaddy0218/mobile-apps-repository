// scripts/audit-amcs.mjs
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { AMC_CONFIG } from '../lib/amc-config.js';
import { discoverFactsheetUrl } from '../lib/amc-discoverer.js';
import { parseFactsheetText } from '../lib/factsheet-extractor.js';
import { SCHEME_MAP } from '../lib/scheme-codes.js';

const RESULTS_FILE = 'audit_results.json';
const REPORT_FILE = 'audit_report.md';

async function runAudit() {
    console.log('--- STARTING COMPREHENSIVE AMC FACTSHEET AUDIT ---\n');
    const filterAmcs = process.argv[2] ? process.argv[2].split(',').map(s => s.trim().toLowerCase()) : null;
    const amcs = Object.keys(AMC_CONFIG).filter(name => {
        if (!filterAmcs) return true;
        return filterAmcs.some(f => name.toLowerCase().includes(f));
    });
    const results = [];

    for (const amcName of amcs) {
        console.log(`\n[AMC] Processing: ${amcName}...`);
        const config = AMC_CONFIG[amcName];
        const result = { amc: amcName, status: 'SKIPPED', details: '', funds: [] };

        try {
            // 1. Discover URL
            const url = await discoverFactsheetUrl(amcName);
            if (!url) {
                result.status = 'FAIL';
                result.details = 'Could not discover factsheet URL';
                results.push(result);
                continue;
            }
            result.url = url;

            // 2. Fetch/Read PDF
            let buffer;
            if (url.startsWith('http')) {
                console.log(`  - Fetching remote PDF: ${url}`);
                const response = await fetch(url, {
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': url.includes('licmf') ? 'https://www.licmf.com/' : (url.includes('whiteoakamc') ? 'https://www.whiteoakamc.com/' : 'https://www.google.com/'),
                        'Connection': 'keep-alive'
                    }
                });
                if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                buffer = await response.arrayBuffer();
            } else {
                console.log(`  - Reading local PDF: ${url}`);
                if (!fs.existsSync(url)) {
                    // Check if it's in the same dir as the script or root
                    const localPath = path.resolve(process.cwd(), url);
                    if (fs.existsSync(localPath)) {
                        buffer = fs.readFileSync(localPath);
                    } else {
                        throw new Error(`Local file not found: ${url}`);
                    }
                } else {
                    buffer = fs.readFileSync(url);
                }
            }

            // 3. Extract Text
            const pdfData = await pdf(Buffer.from(buffer));
            const text = pdfData.text;
            console.log(`  - Extracted text length: ${text.length}`);

            // 4. Test Sample Funds
            const sampleFunds = Object.entries(SCHEME_MAP)
                .filter(([code, name]) => name === amcName)
                .map(([code, name]) => ({ code, name: `Sample Fund ${code}` })); // Name will be refined if found

            if (sampleFunds.length === 0) {
                // Try to find by name from config or common sense if empty
                console.log('  - No sample funds found in SCHEME_MAP, using generic name search...');
                sampleFunds.push({ code: 'UNKNOWN', name: amcName.toLowerCase().includes('aditya birla') ? 'Aditya Birla Sun Life Frontline Equity Fund' : amcName.replace(' Mutual Fund', '') + ' Bluechip' });
            }

            let amcPass = false;
            for (const fund of sampleFunds) {
                console.log(`  - Testing Extraction for: ${fund.name}`);
                const data = parseFactsheetText(text, fund.name, amcName);
                
                const hasHoldings = data.top_holdings && data.top_holdings.length >= 5;
                const hasSectors = data.sector_allocation && data.sector_allocation.length >= 2;
                const hasTER = !!data.expense_ratio;

                const fundStatus = (hasHoldings && hasSectors) ? 'PASS' : 'PARTIAL';
                if (fundStatus === 'PASS') amcPass = true;

                result.funds.push({
                    name: fund.name,
                    status: fundStatus,
                    holdings: data.top_holdings.length,
                    sectors: data.sector_allocation.length,
                    ter: data.expense_ratio
                });
                
                console.log(`    - Status: ${fundStatus} (Holdings: ${data.top_holdings.length}, Sectors: ${data.sector_allocation.length}, TER: ${data.expense_ratio})`);
            }

            result.status = amcPass ? 'PASS' : (result.funds.length > 0 ? 'PARTIAL' : 'FAIL');
            if (result.status === 'PASS') {
                console.log(`  - AMC Result: PASS ✅`);
            } else if (result.status === 'PARTIAL') {
                console.log(`  - AMC Result: PARTIAL ⚠️`);
            } else {
                console.log(`  - AMC Result: FAIL ❌`);
            }

        } catch (error) {
            console.error(`  - Error: ${error.message}`);
            result.status = 'ERROR';
            result.details = error.message;
        }

        results.push(result);
    }

    // 5. Save and Report
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    
    let report = '# Factsheet Audit Report\n\n';
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;
    report += '| AMC | Status | URL | Funds Tested |\n';
    report += '| :--- | :--- | :--- | :--- |\n';
    
    results.forEach(r => {
        const statusEmoji = r.status === 'PASS' ? '✅' : (r.status === 'PARTIAL' ? '⚠️' : '❌');
        const fundSummary = r.funds.map(f => `${f.name} (${f.status})`).join(', ');
        const shortUrl = r.url ? (r.url.length > 30 ? r.url.substring(0, 30) + '...' : r.url) : 'N/A';
        report += `| ${r.amc} | ${statusEmoji} ${r.status} | [Link](${r.url}) | ${fundSummary} |\n`;
    });

    fs.writeFileSync(REPORT_FILE, report);
    console.log(`\nAudit complete! Report saved to ${REPORT_FILE}`);
}

runAudit().catch(console.error);
