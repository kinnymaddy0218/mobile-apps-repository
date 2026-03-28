import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function runTest() {
    const pdfPath = path.join(process.cwd(), "cas_summary_report_2026_03_24_071249.pdf");
    const scriptPath = path.join(process.cwd(), 'scripts', 'pdf-parser-util.mjs');
    
    try {
        const { stdout, stderr } = await execAsync(`node "${scriptPath}" "${pdfPath}" ""`);
        const rows = JSON.parse(stdout);
        
        console.log(`--- RAW ROWS (${rows.length}) ---`);

        const pickValuation = (text, nums) => {
            if (!nums || !nums.length) return 0;
            const labelMatch = text.match(/(?:Market|Current|Portfolio|Total|Holding|Invested)\s*Value\s*[:\-]*\s*(?:Rs\.?|₹)?\s*([\d,]+\.\d{2})/i) ||
                              text.match(/(?:Amt|Amount|Balance|Cost)\s*[:\-]*\s*(?:Rs\.?|₹)?\s*([\d,]+\.\d{2})/i);
            if (labelMatch) return parseFloat(labelMatch[1].replace(/,/g, ''));
            const cleanNums = nums.map(n => parseFloat(n.replace(/,/g, '')));
            return Math.max(...cleanNums);
        };

        const fundRegex = /fund|growth|direct|reg|elss|equity|debt|hybrid|cap|value|index|tax|liquid|money|bond|gilt|overnight|dynamic|alpha|bluechip|pharma|healthcare|energy|resources|technology|it|infra|banking|financial|kotak|hdfc|sbi|icici|nippon|axis|uti|mirae|tata|dsp|franklin/i;

        const disclaimerPatterns = [
            /consolidated account summary/i,
            /as on date/i,
            /brought to you as an/i,
            /friendly initiative/i,
            /invested value.*market value/i,
            /folio no.*scheme details/i,
            /holding investments/i,
            /consolidation has been/i,
            /folios missing in this/i,
            /contact your Depository Participant/i,
            /Page \d+ of \d+/i,
            /MFCentralCASSummary/i,
            /^PAN\s*:/i,
            /investor friendly initiative/i,
            /KFintech|CAMS/i,
            /NSDL|CDSL/i,
            /No MF holdings in Demat/i,
            /brought to you as/i,
            / friendly initiative/i,
            /valuation of Mutual Funds/i,
            /Navya Homes|Narregudam|Beeramguda|Ameenapur/i,
            /Sai M S Homes/i,
            /Plot No/i
        ];

        console.log("\n--- FINAL SIMULATION TRACE ---");
        let currentFundName = "";
        let extracted = [];
        let currentFolio = "";

        for (let i = 0; i < rows.length; i++) {
            const line = rows[i].trim();
            if (!line) continue;
            
            if (disclaimerPatterns.some(p => p.test(line)) || line.startsWith('#')) {
                continue;
            }

            const allNumbers = line.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{2,})\b/g) || [];
            const folioMatch = line.match(/\b\d{7,12}\b/);
            if (folioMatch) currentFolio = folioMatch[0];

            const latestVal = pickValuation(line, allNumbers);
            const looksLikeFund = fundRegex.test(line);
            
            if (looksLikeFund || folioMatch) {
                let cleanedName = line.replace(/\b\d{7,12}\b/g, '')
                                      .replace(/(?:Market|Current|Portfolio|Total|Holding)\s*Value\s*[:\-]*\s*/i, '')
                                      .replace(/(?:Amt|Amount|Balance|Cost|Invested)\s*[:\-]*\s*/i, '')
                                      .replace(/\(\s*-?[\d,.]+%?\s*\)/g, '')
                                      .split(/\(ERSTWHILE|\(EARLIER/i)[0]
                                      .split(/\d{1,3}(?:,\d{3})*(?:\.\d{2,})/)[0]
                                      .trim();
                
                if (latestVal > 100 && (looksLikeFund || currentFundName)) {
                    const finalName = (currentFundName && !looksLikeFund) ? currentFundName : 
                                     (currentFundName && cleanedName.length < 10) ? `${currentFundName} ${cleanedName}` : cleanedName;
                    
                    console.log(`[HIT] "${finalName}" | Val: ${latestVal}`);
                    extracted.push({ name: finalName, val: latestVal });
                    currentFundName = "";
                } else if (cleanedName.length > 10) {
                    currentFundName = currentFundName ? `${currentFundName} ${cleanedName}` : cleanedName;
                }
            } else if (allNumbers.length > 0 && currentFundName) {
                const bufferedVal = pickValuation(line, allNumbers);
                if (bufferedVal > 100) {
                    console.log(`[FLUSH] "${currentFundName}" | Val: ${bufferedVal}`);
                    extracted.push({ name: currentFundName, val: bufferedVal });
                    currentFundName = "";
                }
            }
        }
        
        console.log(`\nTOTAL IDENTIFIED: ${extracted.length}`);
    } catch (err) {
        console.error("Test failed:", err);
    }
}

runTest();
