import fs from 'fs';
import pdf from 'pdf-parse';

async function debugTataHoldings() {
    const pdfPath = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/temp_factsheet.pdf';
    if (!fs.existsSync(pdfPath)) return;

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    // Search for "Tata Digital India Fund" and then "Top 10 Holdings"
    const fundIndex = text.indexOf("Tata Digital India Fund");
    if (fundIndex === -1) {
        console.log("Fund not found");
        return;
    }

    const snippet = text.substring(fundIndex, fundIndex + 10000);
    console.log("--- TATA DIGITAL HOLDINGS SNIPPET ---");
    console.log(snippet.substring(0, 3000).replace(/\n/g, '[NL]'));
}

debugTataHoldings();
