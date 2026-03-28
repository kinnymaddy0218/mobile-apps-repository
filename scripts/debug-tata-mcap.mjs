import fs from 'fs';
import pdf from 'pdf-parse';

async function debugTataMcap() {
    const pdfPath = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/temp_factsheet.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log("temp_factsheet.pdf not found");
        return;
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const fullText = pdfData.text;

    // The fund name for 135800 is "Tata Digital India Fund"
    const fundName = "Tata Digital India Fund";
    const bestIndex = fullText.indexOf(fundName);
    
    if (bestIndex === -1) {
        console.log("Fund Name not found in PDF total text");
        return;
    }

    console.log("Found Fund Name at index:", bestIndex);
    const relevantText = fullText.substring(Math.max(0, bestIndex - 1000), Math.min(fullText.length, bestIndex + 12000));
    
    console.log("--- RELEVANT TEXT START ---");
    console.log(relevantText.substring(0, 1000));
    console.log("--- ... ---");
    console.log(relevantText.substring(relevantText.length - 1000));
    console.log("--- RELEVANT TEXT END ---");

    const mcapHeader = relevantText.match(/Market\s*Cap(?:itali[sz]ation)?/i);
    if (mcapHeader) {
        console.log("MCAP HEADER FOUND AT:", mcapHeader.index);
        console.log("MCAP SNIPPET:", relevantText.substring(mcapHeader.index, mcapHeader.index + 500).replace(/\s+/g, ' '));
    } else {
        console.log("MCAP HEADER NOT FOUND in relevantText");
    }
}

debugTataMcap();
