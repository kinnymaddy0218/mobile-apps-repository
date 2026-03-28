import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const ROOT_DIR = 'C:\\Users\\maddy\\OneDrive\\Documents\\Antigravity\\mf-research';
const PARSER_PATH = path.join(ROOT_DIR, 'scripts', 'pdf-parser-util.mjs');

async function probe() {
    const files = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.pdf'));
    const results = [];

    for (const file of files) {
        const filePath = path.join(ROOT_DIR, file);
        // Try common passwords
        const passwords = ['', 'AKTPM4412B'];
        
        for (const pw of passwords) {
            try {
                const { stdout } = await execAsync(`node "${PARSER_PATH}" "${filePath}" "${pw}"`);
                const rows = JSON.parse(stdout);
                
                // Quick scan for "Total Value" or "Valuation"
                let totalFound = 0;
                for (const row of rows) {
                    const match = row.match(/(?:Total|Market|Current|Invested)\s*Value\s*[:\-]*\s*(?:Rs\.?|₹)?\s*([\d,]+\.\d{2})/i);
                    if (match) {
                        const val = parseFloat(match[1].replace(/,/g, ''));
                        if (val > totalFound) totalFound = val;
                    }
                }
                
                if (totalFound > 1000) {
                    results.push({ file, total: totalFound, pw: pw ? 'SET' : 'NONE' });
                    break;
                }
            } catch (e) {
                // Skip password errors
            }
        }
    }

    console.table(results.sort((a,b) => b.total - a.total));
}

probe();
