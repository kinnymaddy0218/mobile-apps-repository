import fs from 'fs';
import path from 'path';

// Extract logic adapted for a CLI check
function universalExtract(textChunks) {
    let currentFolio = 'Default';
    let multiLineBuffer = [];
    const funds = [];
    
    const findFolio = (line) => {
        const folioMatch = line.match(/^(\d{5,15})\b|Folio(?:\s*(?:No|Number|Num))?\s*[:\-]?\s*(\d{5,15})\b/i);
        if (folioMatch) return folioMatch[1] || folioMatch[2];
        return null;
    };

    const dataRowsRegex = /[\d,.]+\s+[\d,.]+\s+\d{1,2}-[a-z]{3}-\d{4}\s+[\d,.]+\s+[\d,.]+/i;

    for (const chunk of textChunks) {
        const line = chunk.trim();
        if (!line) continue;
        
        const detectedFolio = findFolio(line);
        if (detectedFolio) currentFolio = detectedFolio;

        const match = line.match(dataRowsRegex);
        if (match) {
            const dataPart = match[0];
            const prefix = line.substring(0, match.index).trim();
            const parsedNums = dataPart.match(/[\d,.]+/g);
            if (parsedNums && parsedNums.length >= 4) {
                let rawName = (multiLineBuffer.join(' ') + ' ' + prefix).replace(/\s+/g, ' ').trim();
                let cleanedName = rawName
                    .replace(new RegExp(currentFolio, 'g'), '')
                    .replace(/Folio No\.?|Scheme Details|NAV Date|NAV|Units|\(INR\)|Balance|Market Value|Gain\/Loss|Invested Value|SOA HOLDINGS|DEMAT HOLDINGS|ISIN|INF\d+|Summary of Holdings|Statement Date/gi, '')
                    .replace(/\(.*\)/g, '')
                    .replace(/\d{2}-[a-z]{3}-\d{4}.*/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (cleanedName.length < 3) cleanedName = prefix.trim();
                if (!cleanedName) cleanedName = multiLineBuffer[multiLineBuffer.length - 1] || 'Unmapped Fund';
                const valuation = parseFloat(parsedNums[parsedNums.length - 1].replace(/,/g, ''));
                if (valuation > 1) {
                    funds.push({ folio: currentFolio, scheme: cleanedName || 'Unknown', valuation });
                }
                multiLineBuffer = [];
            }
        } else {
            if (!line.toLowerCase().includes('consolidated') && !line.match(/^\s*Folio/i)) {
                multiLineBuffer.push(line);
                if (multiLineBuffer.length > 5) multiLineBuffer.shift();
            }
        }
    }
    return funds;
}

// 1. Process SBI
const sbiText = JSON.parse(fs.readFileSync('scripts/raw-rows-sbi-final.json', 'utf8'));
const sbiFunds = universalExtract(sbiText);

// 2. Process MFCentral
const mfcText = JSON.parse(fs.readFileSync('scripts/raw-rows-v2-final.json', 'utf8'));
const mfcFunds = universalExtract(mfcText);

console.log("\n--- SBI REPORT (Total: 22.41L) ---");
sbiFunds.forEach(f => console.log(`${f.folio.padEnd(12)} | ${f.scheme.padEnd(60)} | ₹${f.valuation.toLocaleString('en-IN')}`));

console.log("\n--- MFCENTRAL REPORT (Total: 9.87L) ---");
mfcFunds.forEach(f => console.log(`${f.folio.padEnd(12)} | ${f.scheme.padEnd(60)} | ₹${f.valuation.toLocaleString('en-IN')}`));
