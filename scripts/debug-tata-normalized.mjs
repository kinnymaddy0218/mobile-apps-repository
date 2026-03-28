import fs from 'fs';
import pdf from 'pdf-parse';

async function debugTataNormalized() {
    const pdfPath = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/temp_factsheet.pdf';
    if (!fs.existsSync(pdfPath)) return;

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    const fundName = "Tata Digital India Fund";
    const normalizedTarget = fundName.replace(/\s+/g, '').toLowerCase();
    
    let bestIndex = -1;
    // Search with a sliding window, ignoring spaces
    for (let i = 0; i < text.length - 500; i++) {
        // Only look at snippets that might contain the name
        if (text[i].toLowerCase() === normalizedTarget[0]) {
            const snippet = text.substring(i, i + 500).replace(/\s+/g, '').toLowerCase();
            if (snippet.includes(normalizedTarget)) {
                bestIndex = i;
                break;
            }
        }
    }

    if (bestIndex === -1) {
        console.log("Fund not found even with normalization");
        return;
    }

    console.log("Fund found at index:", bestIndex);
    const snippet = text.substring(bestIndex, bestIndex + 10000);
    console.log("--- SNIPPET (first 2000 chars) ---");
    console.log(snippet.substring(0, 2000).replace(/\n/g, '[NL]'));
    
    console.log("\n--- SEARCHING MCAP IN SNIPPET ---");
    const mcapHeader = snippet.match(/Market\s*Cap(?:itali[sz]ation)?/i);
    if (mcapHeader) {
        console.log("MCAP HEADER AT:", mcapHeader.index);
        console.log("DATA:", snippet.substring(mcapHeader.index, mcapHeader.index + 800).replace(/\s+/g, ' '));
    }
}

debugTataNormalized();
