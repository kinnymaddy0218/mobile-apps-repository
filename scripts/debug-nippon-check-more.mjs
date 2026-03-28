import fs from 'fs';
import pdf from 'pdf-parse';

async function debugNipponCheckMore() {
    const pdfPath = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/nippon_check.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log("nippon_check.pdf not found");
        return;
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    console.log("--- NIPPON CHECK PDF FULL TEXT SNIPPET ---");
    // Search for "Market Capitalisation" specifically
    const mcapIndex = text.search(/Market\s*Capitali[sz]ation/i);
    if (mcapIndex !== -1) {
        console.log("FOUND AT:", mcapIndex);
        console.log("RAW SNIPPET (1000 chars):");
        console.log(text.substring(mcapIndex, mcapIndex + 1000).replace(/\n/g, '[NL]'));
    } else {
        console.log("NOT FOUND with /Market\\s*Capitali[sz]ation/i");
        // Try just "Market" and "Cap"
        const index2 = text.search(/Large\s*Cap/i);
        if (index2 !== -1) {
            console.log("FOUND 'Large Cap' AT:", index2);
            console.log("RAW SNIPPET (500 chars):", text.substring(index2 - 100, index2 + 400).replace(/\n/g, '[NL]'));
        }
    }
}

debugNipponCheckMore();
