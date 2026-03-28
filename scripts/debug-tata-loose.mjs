import fs from 'fs';
import pdf from 'pdf-parse';

async function debugTataLoose() {
    const pdfPath = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/temp_factsheet.pdf';
    if (!fs.existsSync(pdfPath)) return;

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    // Search for "Digital" and "India" within 100 chars
    for (let i = 0; i < text.length - 200; i++) {
        const snippet = text.substring(i, i + 200).toLowerCase();
        if (snippet.includes("digital") && snippet.includes("india")) {
            console.log("POSSIBLE MATCH AT:", i);
            console.log("Snippet:", text.substring(i - 100, i + 500).replace(/\s+/g, ' '));
            // Break after some matches
            if (i > 100000) break; 
        }
    }
}

debugTataLoose();
