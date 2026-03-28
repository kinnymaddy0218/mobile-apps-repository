
const pdf = require('pdf-parse');
const fs = require('fs');

const pdfPath = 'C:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/temp_factsheet.pdf';

async function debug() {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const lines = data.text.split('\n');
    const idx = lines.findIndex(l => l.includes('State Bank'));
    console.log("LINES AROUND STATE BANK:");
    console.log(lines.slice(idx - 5, idx + 10).join('\n'));
    
    const capIdx = lines.findIndex(l => l.includes('Segment-Wise Break-up'));
    console.log("\nLINES AROUND SEGMENT-WISE BREAK-UP:");
    console.log(lines.slice(capIdx, capIdx + 20).join('\n'));
}

debug();
