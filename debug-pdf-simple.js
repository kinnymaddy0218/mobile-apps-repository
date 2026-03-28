const fs = require('fs');
const pdf = require('pdf-parse');

async function debugPdf() {
    try {
        const filePath = 'C:\\Users\\maddy\\OneDrive\\Documents\\Antigravity\\mf-research\\SBI_MF_24March2026.pdf';
        const dataBuffer = fs.readFileSync(filePath);
        
        console.log("File size:", dataBuffer.length);
        
        const data = await pdf(dataBuffer);
        console.log("Page count:", data.numpages);
        console.log("Text length:", data.text.length);
        console.log("Text preview:", data.text.substring(0, 500));
        
    } catch (e) {
        console.error("PDF Parsing Error:", e.message);
    }
}

debugPdf();
