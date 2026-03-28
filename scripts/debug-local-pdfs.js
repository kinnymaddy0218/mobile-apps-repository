import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';

const files = [
    'Axis Fund Factsheet February 2026.pdf',
    'bandhan-factsheet-feb-2026.pdf',
    'bandhan-passive-factsheet-feb-2026.pdf'
];

async function debugPdf(filename) {
    console.log(`\n--- Testing: ${filename} ---`);
    try {
        const filePath = path.join(process.cwd(), filename);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return;
        }
        const buffer = fs.readFileSync(filePath);
        console.log(`Buffer size: ${buffer.length} bytes`);
        
        const data = await pdf(buffer);
        console.log(`Success! Pages: ${data.numpages}`);
        console.log(`Text preview (first 200 chars):`);
        console.log(data.text.substring(0, 200));
        
        // Save text to file for inspection
        const textPath = `debug_${filename.replace(/\s+/g, '_')}.txt`;
        fs.writeFileSync(textPath, data.text);
        console.log(`Full text saved to: ${textPath}`);
    } catch (error) {
        console.error(`FAILED: ${error.message}`);
        if (error.stack) console.error(error.stack);
    }
}

async function run() {
    for (const file of files) {
        await debugPdf(file);
    }
}

run();
