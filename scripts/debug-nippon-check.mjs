import fs from 'fs';
import pdf from 'pdf-parse';

async function debugNipponCheck() {
    const pdfPath = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/nippon_check.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log("nippon_check.pdf not found");
        return;
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;

    console.log("--- NIPPON CHECK PDF TEST ---");
    
    // Look for Mid Cap and Small Cap
    const patterns = [
        /Large\s*Cap[:\s]*(\d{1,3}(?:\.\d{1,2})?)%?/gi,
        /Mid\s*Cap[:\s]*(\d{1,3}(?:\.\d{1,2})?)%?/gi,
        /Small\s*Cap[:\s]*(\d{1,3}(?:\.\d{1,2})?)%?/gi
    ];

    patterns.forEach((pat, i) => {
        const labels = ['Large', 'Mid', 'Small'];
        let match;
        console.log(`\nMatches for ${labels[i]} Cap:`);
        while ((match = pat.exec(text)) !== null) {
            console.log(`- Match: "${match[0]}" Value: ${match[1]} Context: "...${text.substring(match.index - 50, match.index + 50).replace(/\s+/g, ' ')}..."`);
        }
    });

    // Also look for Index mentions
    console.log("\n--- INDEX MENTIONS ---");
    const indexMatches = text.match(/(?:Nifty|Sensex|Index|TRI|Benchmark).{0,50}/gi);
    if (indexMatches) {
        indexMatches.slice(0, 10).forEach(m => console.log(`- ${m.trim()}`));
    }
}

debugNipponCheck();
