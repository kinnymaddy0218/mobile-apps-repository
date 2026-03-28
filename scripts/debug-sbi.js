const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function debug() {
    const pdfPath = path.join(process.cwd(), 'sbi_check.pdf');
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdf(buffer);
    const text = data.text;
    
    const targets = ["Bluechip", "Equity", "Growth", "SBI"];
    for (const t of targets) {
        const idx = text.indexOf(t);
        console.log(`"${t}" found at ${idx}`);
    }
}

debug();
