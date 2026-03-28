import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';

async function compareNipponFunds() {
    const pdfPath = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/nippon_check.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log("nippon_check.pdf not found");
        return;
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    const funds = [
        { name: "Nippon India Growth Mid Cap Fund", code: "118668" },
        { name: "Nippon India Small Cap Fund", code: "118778" }
    ];

    for (const fund of funds) {
        console.log(`\n--- SEARCHING FOR ${fund.name.toUpperCase()} ---`);
        const idx = text.toLowerCase().indexOf(fund.name.toLowerCase());
        if (idx !== -1) {
            console.log(`Found "${fund.name}" at index: ${idx}`);
            console.log(`Snippet: ${text.substring(idx, idx + 200).replace(/\s+/g, ' ')}`);
            
            // Look for "Top 10 Holdings" after this name
            const holdingsIdx = text.toLowerCase().indexOf("top 10 holdings", idx);
            if (holdingsIdx !== -1 && holdingsIdx - idx < 5000) {
                console.log(`Holdings found at: ${holdingsIdx} (offset: ${holdingsIdx - idx})`);
                console.log(`Holdings Snippet: ${text.substring(holdingsIdx, holdingsIdx + 300).replace(/\s+/g, ' ')}`);
            } else {
                console.log("Holdings NOT found within 5000 chars of fund name");
            }
        } else {
            console.log(`"${fund.name}" NOT found`);
        }
    }
}

compareNipponFunds();
