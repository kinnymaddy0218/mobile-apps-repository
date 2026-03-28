import { extractText } from './pdf-parser-util.mjs';

async function main() {
    try {
        const text = await extractText('SBI_MF_24March2026.pdf', 'AKTPM4412B');
        console.log("--- SBI TEXT ---");
        console.log(text.substring(0, 1000));
        
        // Find Valuation rows
        const lines = text.split('\n');
        let total = 0;
        lines.forEach(line => {
            const matches = line.match(/(\d+\.\d{3,4})\s+(\d+\.\d{2,3})/);
            if (matches && line.includes('SBI')) {
                console.log(`Found Line: ${line}`);
                total += parseFloat(matches[2]);
            }
        });
        console.log(`\nExtracted SBI Total: ₹${total.toLocaleString()}`);
    } catch (e) {
        console.error(e);
    }
}

main();
