// scripts/audit-risk-metrics.mjs
import fs from 'fs';
import path from 'path';
import { parseFactsheetText } from '../lib/factsheet-extractor.js';
import { AMC_CONFIG } from '../lib/amc-config.js';
import { SCHEME_MAP } from '../lib/scheme-codes.js';
import pdf from 'pdf-parse';
import fetch from 'node-fetch';

const TIER_1_AMCS = [
    'SBI Mutual Fund',
    'HDFC Mutual Fund',
    'ICICI Prudential Mutual Fund',
    'Kotak Mutual Fund',
    'Axis Mutual Fund',
    'UTI Mutual Fund',
    'Aditya Birla Sun Life Mutual Fund',
    'Nippon India Mutual Fund',
    'Tata Mutual Fund',
    'Quant Mutual Fund',
    'Bandhan Mutual Fund',
    'Invesco Mutual Fund',
    'Mirae Asset Mutual Fund',
    'DSP Mutual Fund'
];

const SAMPLE_FUNDS = {
    'SBI Mutual Fund': '103175', // SBI Bluechip
    'HDFC Mutual Fund': '100822', // HDFC Top 100
    'ICICI Prudential Mutual Fund': '100366', // ICICI Bluechip
    'Kotak Mutual Fund': '100913', // Kotak Bluechip
    'Axis Mutual Fund': '112323', // Axis Bluechip
    'UTI Mutual Fund': '100230', // UTI Mastershare
    'Aditya Birla Sun Life Mutual Fund': '100030', // ABSL Frontline Equity
    'Nippon India Mutual Fund': '100595', // Nippon India Growth Fund
    'Tata Mutual Fund': '100523', // Tata Large Cap
    'Quant Mutual Fund': '120465', // Quant Small Cap
    'Bandhan Mutual Fund': '120716', // Bandhan Small Cap
    'Invesco Mutual Fund': '109605', // Invesco India Largecap
    'Mirae Asset Mutual Fund': '113171', // Mirae Asset Large Cap
    'DSP Mutual Fund': '100147' // DSP Top 100
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function audit() {
    console.log(`\n=== Risk Metrics & Benchmark Audit ===\n`);
    
    const results = [];
    const reportPath = path.join(process.cwd(), 'risk_audit_report.md');
    
    let reportMd = `# Risk Metrics & Benchmark Audit Report\n\nGenerated on: ${new Date().toLocaleString()}\n\n`;
    reportMd += `| AMC | Fund Name | Sharpe | Beta | Alpha | Std Dev | Benchmark | Status |\n`;
    reportMd += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const amc of TIER_1_AMCS) {
        const schemeCode = SAMPLE_FUNDS[amc];
        if (!schemeCode) continue;

        console.log(`\n[${amc}] Auditing Fund: ${schemeCode}...`);
        
        try {
            // 1. Fetch Fund Meta (Optional, can use fallback)
            let fundName = "Unknown Fund";
            try {
                const fundRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
                if (fundRes.ok) {
                    const fundData = await fundRes.json();
                    fundName = fundData.meta.scheme_name;
                } else {
                    console.log(`  API failed for ${schemeCode}, using fallback.`);
                }
            } catch (e) {
                console.log(`  API error for ${schemeCode}: ${e.message}`);
            }

            // 2. Locate PDF (Check local cache first or config)
            const cachePath = path.join(process.cwd(), '.data', 'factsheet_cache', `${schemeCode}.json`);
            let rawText = "";
            let pdfUrl = "";

            if (fs.existsSync(cachePath)) {
                const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
                pdfUrl = cached.pdfUrl;
            }

            // Mapping of AMCs to their local debug text dumps
            const dumpMappings = {
                'Axis Mutual Fund': 'debug_Axis_Fund_Factsheet_February_2026.pdf.txt',
                'HDFC Mutual Fund': 'HDFC_Factsheet_Feb_2026.pdf.txt',
                'Nippon India Mutual Fund': 'Nippon-FS.pdf.txt',
                'Bandhan Mutual Fund': 'debug_bandhan-factsheet-feb-2026.pdf.txt',
                'SBI Mutual Fund': 'sbi_full_dump.txt',
                'ICICI Prudential Mutual Fund': 'icici_dump.txt',
                'Kotak Mutual Fund': 'kotak_dump.txt',
                'UTI Mutual Fund': 'uti_dump.txt',
                'Tata Mutual Fund': 'tata_dump.txt',
                'DSP Mutual Fund': 'dsp_dump.txt',
                'Aditya Birla Sun Life Mutual Fund': 'ABSL_dump.txt',
                'Invesco Mutual Fund': 'invesco_test.bin.txt',
                'Mirae Asset Mutual Fund': 'debug_mirae_raw.txt'
            };

            for (const [key, filename] of Object.entries(dumpMappings)) {
                if (amc.includes(key)) {
                    const dumpPath = path.join(process.cwd(), filename);
                    if (fs.existsSync(dumpPath)) {
                        rawText = fs.readFileSync(dumpPath, 'utf8');
                        break;
                    }
                }
            }

            if (!rawText) {
                console.log(`  No local text dump found for ${amc} (looked for mappings).`);
                reportMd += `| ${amc} | ${fundName} | - | - | - | - | - | ⚠️ Missing Text Dump |\n`;
                continue;
            }

            // 3. Extract
            const extracted = parseFactsheetText(rawText, fundName, amc);
            const { risk_ratios, benchmark_performance } = extracted;

            const status = (risk_ratios.sharpe_ratio || risk_ratios.beta) ? '✅ OK' : '❌ Failed';
            
            reportMd += `| ${amc} | ${fundName} | ${risk_ratios.sharpe_ratio || '-'} | ${risk_ratios.beta || '-'} | ${risk_ratios.alpha || '-'} | ${risk_ratios.standard_deviation || '-'} | ${benchmark_performance.name || '-'} | ${status} |\n`;
            
            console.log(`  Sharpe: ${risk_ratios.sharpe_ratio}`);
            console.log(`  Beta: ${risk_ratios.beta}`);
            console.log(`  Benchmark: ${benchmark_performance.name}`);

        } catch (error) {
            console.error(`  Error auditing ${amc}:`, error.message);
            reportMd += `| ${amc} | ERROR | - | - | - | - | - | ❌ Crash |\n`;
        }
    }

    fs.writeFileSync(reportPath, reportMd);
    console.log(`\nAudit complete. Report saved to: ${reportPath}`);
}

audit();
