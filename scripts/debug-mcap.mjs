import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function debugMcap(code) {
    const cacheDir = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/.data/factsheet_cache';
    const files = fs.readdirSync(cacheDir);
    const amcMatch = files.find(f => f.includes('Nippon_India_Mutual_Fund'));
    
    if (!amcMatch) {
        console.log("No Nippon cache found");
        return;
    }

    const pdfPath = path.join(cacheDir, amcMatch);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    const mcapPatterns = [
        /Large\s*Cap[:\s]*(\d{1,3}(?:\.\d{1,2})?)%?/gi,
        /Mid\s*Cap[:\s]*(\d{1,3}(?:\.\d{1,2})?)%?/gi,
        /Small\s*Cap[:\s]*(\d{1,3}(?:\.\d{1,2})?)%?/gi
    ];

    console.log("--- LARGE CAP MATCHES ---");
    let match;
    while ((match = mcapPatterns[0].exec(text)) !== null) {
        console.log(`Match: "${match[0]}" at index ${match.index}. Context: "...${text.substring(match.index - 20, match.index + 50).replace(/\n/g, ' ')}..."`);
    }

    console.log("\n--- MID CAP MATCHES ---");
    while ((match = mcapPatterns[1].exec(text)) !== null) {
        console.log(`Match: "${match[0]}" at index ${match.index}. Context: "...${text.substring(match.index - 20, match.index + 50).replace(/\n/g, ' ')}..."`);
    }

    console.log("\n--- SMALL CAP MATCHES ---");
    while ((match = mcapPatterns[2].exec(text)) !== null) {
        console.log(`Match: "${match[0]}" at index ${match.index}. Context: "...${text.substring(match.index - 20, match.index + 50).replace(/\n/g, ' ')}..."`);
    }
}

debugMcap('118668');
