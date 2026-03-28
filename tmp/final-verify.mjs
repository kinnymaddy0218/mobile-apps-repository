import fs from 'fs';

// This is the EXACT logic from app/api/portfolio/import-cas/route.js (Latest version)
function universalExtract(rows) {
    const rawExtracted = [];
    let currentFolio = 'Default';
    let multiLineBuffer = [];

    const findFolio = (line) => {
        const folioMatch = line.match(/^(\d{5,15})\b|Folio(?:\s*(?:No|Number|Num))?\s*[:\-]?\s*(\d{5,15})\b/i);
        if (folioMatch) return folioMatch[1] || folioMatch[2];
        return null;
    };

    const dataRowsRegex = /[\d,.]+\s+[\d,.]+\s+\d{1,2}-[a-z]{3}-\d{4}\s+[\d,.]+\s+[\d,.]+/i;

    for (const line of rows) {
        if (!line) continue;
        const detectedFolio = findFolio(line);
        if (detectedFolio) currentFolio = detectedFolio;

        const match = line.match(dataRowsRegex);
        if (match) {
            const dataPart = match[0];
            const prefix = line.substring(0, match.index)
                .replace(/^[A-Z0-9]{4,10}\s+/, '') 
                .replace(/[\d,.]+\s*$/, '') 
                .trim();

            const parsedNums = dataPart.match(/[\d,.]+/g);
            
            if (parsedNums && parsedNums.length >= 4) {
                const cleanedBuffer = multiLineBuffer.filter(l => {
                    const isNoise = /kyc|pan|mobile|email|address|folio|account|statement|please|ensure|information|computer\s*generated|page|nsdl|cdsl|kfintech|cams|registrations|transaction|details|summary|Nanvya|Beeramguda|Sai M S Homes|Scheme Name|Cost of Investment|Unit #|Folio #|NAV #|Market Value|Invested Value|Balance|visit|RIA|Distributor|Code|EUIN|ARN|Nominee|Guardian|Holder|Status|Remarks/i.test(l);
                    const hasFundKeyword = /fund|growth|direct|plan|option|equity|debt|tax|saver|advantage|oppor|index|nifty|sensex|bluechip|cap|liquid|yield|fixed|income|balanced|hybrid/i.test(l);
                    const numericDensity = (l.match(/\d/g) || []).length / l.length;
                    return !isNoise && hasFundKeyword && l.length > 10 && numericDensity < 0.3;
                });

                let rawName = (cleanedBuffer.join(' ') + ' ' + prefix).replace(/\s+/g, ' ').trim();
                
                // INDUSTRIAL VALIDATION
                const AMC_LIST = ['SBI', 'HDFC', 'ICICI', 'DSP', 'NIPPON', 'QUANT', 'PARAG', 'BANDHAN', 'UTI', 'MOTILAL', 'KOTAK', 'AXIS', 'MIRAE', 'TATA', 'INVESCO', 'EDELWEISS', 'CANARA', 'BARODA', 'IDFC', 'FRANKLIN', 'HSBC', 'WHITE OAK', 'PGIM', 'PPFAS'];
                const isLikelyFund = AMC_LIST.some(amc => rawName.toUpperCase().includes(amc)) || 
                                   /fund|growth|direct|plan|option|equity|debt|tax|saver|advantage|oppor|index|nifty|sensex|bluechip|cap|liquid|yield|fixed|income|balanced|hybrid/i.test(rawName);

                if (!isLikelyFund || /RIA|Distributor|Code|EUIN|ARN|Nominee|Guardian|Holder|Status|Remarks|Address|PAN|Mobile|Email|Page/i.test(rawName)) {
                    multiLineBuffer = [];
                    continue;
                }

                let cleanedName = rawName
                    .replace(new RegExp(currentFolio, 'g'), '')
                    .replace(/Folio No\.?|Scheme Details|NAV Date|NAV|Units|\(INR\)|Balance|Market Value|Gain\/Loss|Invested Value|SOA HOLDINGS|DEMAT HOLDINGS|ISIN|INF\d+|Summary of Holdings|Statement Date/gi, '')
                    .replace(/\(.*\)/g, '')
                    .replace(/\d{2}-[a-z]{3}-\d{4}.*/gi, '')
                    .replace(/\b[A-Z0-9]{10,}\b/g, '') 
                    .replace(/[\d,.]+\s*$/, '') 
                    .replace(/\s+/g, ' ')
                    .trim();

                let finalName = cleanedName
                    .replace(/^[A-Z0-9]{5,}\b\s*/, '') 
                    .replace(/^[^a-zA-Z]+/, '') 
                    .replace(/^\d+(\.\d+)?s?\s*(and|&)?\s*/i, '')
                    .replace(/^[\s\W\d]+/, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (finalName.length < 8 || /^(growth|direct|plan|option)$/i.test(finalName.toLowerCase())) {
                    multiLineBuffer = [];
                    continue;
                }

                const valuation = parseFloat(parsedNums[parsedNums.length - 1].replace(/,/g, ''));
                if (valuation > 1) {
                    rawExtracted.push({
                        name: finalName.replace(/\s+/g, ' ').trim(),
                        valuation: valuation,
                        folio: currentFolio
                    });
                }
                multiLineBuffer = [];
            }
        } else {
            const isNoise = /kyc|pan|mobile|email|address|folio|account|statement|please|ensure|information|computer\s*generated|page|nsdl|cdsl|kfintech|cams|registrations|transaction|details|summary|Nanvya|Beeramguda|Sai M S Homes|Scheme Name|Cost of Investment|Unit #|Folio #|NAV #|Market Value|Invested Value|Balance|visit|RIA|Distributor|Code|EUIN|ARN|Nominee|Guardian|Holder|Status|Remarks/i.test(line);
            const hasFundKeyword = /fund|growth|direct|plan|option|equity|debt|tax|saver|advantage|oppor|index|nifty|sensex|bluechip|cap|liquid|yield|fixed|income|balanced|hybrid/i.test(line);
            const numericDensity = (line.match(/\d/g) || []).length / line.length;
            
            if (!isNoise && hasFundKeyword && line.length > 10 && numericDensity < 0.3) {
                multiLineBuffer.push(line);
                if (multiLineBuffer.length > 2) multiLineBuffer.shift(); 
            }
        }
    }
    return rawExtracted;
}

// 1. Double check SBI
const sbiRows = JSON.parse(fs.readFileSync('scripts/raw-rows-sbi-final.json', 'utf8'));
const sbiFinal = universalExtract(sbiRows);

// 2. Double check MFCentral
const mfcRows = JSON.parse(fs.readFileSync('scripts/raw-rows-v2-final.json', 'utf8'));
const mfcFinal = universalExtract(mfcRows);

console.log("\n=== FINAL TRUST VERIFICATION: SBI REPORT ===");
sbiFinal.forEach(f => {
    console.log(`[OK] ${f.name.padEnd(65)} | ₹${f.valuation.toLocaleString('en-IN')}`);
});

console.log("\n=== FINAL TRUST VERIFICATION: MFCENTRAL REPORT ===");
mfcFinal.forEach(f => {
    console.log(`[OK] ${f.name.padEnd(65)} | ₹${f.valuation.toLocaleString('en-IN')}`);
});
