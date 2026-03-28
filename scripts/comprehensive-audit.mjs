import fs from 'fs';
import path from 'path';

async function performAudit() {
    const pdfPath = path.join(process.cwd(), "cas_summary_report_2026_03_24_071249.pdf");
    const fileBuffer = fs.readFileSync(pdfPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', blob, 'cas_report.pdf');

    console.log("--- STARTING COMPREHENSIVE PORTFOLIO AUDIT ---");
    try {
        const response = await fetch('http://localhost:3003/api/portfolio/import-cas', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (!data.success) {
            console.error("API Error:", data.error);
            return;
        }

        const funds = data.funds;
        console.log(`FOUND: ${funds.length} Funds`);

        let totalValue = 0;
        funds.forEach(f => totalValue += f.valuation);
        console.log(`TOTAL PORTFOLIO VALUE: ₹${totalValue.toLocaleString('en-IN')}`);

        console.log("\n--- FUND-BY-FUND CHECK ---");
        console.log("NAME | MARKET VALUE | WEIGHT (%)");
        console.log("-".repeat(60));

        funds.forEach(f => {
            const weight = ((f.valuation / totalValue) * 100).toFixed(2);
            // Print name cleanly (limited for log readability)
            const cleanName = f.schemeName.replace(/\s+/g, ' ').trim();
            console.log(`${cleanName.padEnd(50)} | ₹${f.valuation.toLocaleString('en-IN').padStart(12)} | ${weight.padStart(6)}%`);
        });

        console.log("-".repeat(60));
        const totalWeight = funds.reduce((acc, f) => acc + (f.valuation / totalValue * 100), 0).toFixed(2);
        console.log(`TOTAL WEIGHT: ${totalWeight}%`);

        // Final verification of specific "Troublesome" funds from previous logs
        const checks = [
            { name: "Parag Parikh", expected: 177710.61 },
            { name: "Nippon India Growth", expected: 143332.42 },
            { name: "Bandhan Small Cap", expected: 125164.73 },
            { name: "Quant Infrastructure", expected: 330773.07 }
        ];

        console.log("\n--- CRITICAL ACCURACY CHECK ---");
        checks.forEach(c => {
            const found = funds.find(f => f.schemeName.toLowerCase().includes(c.name.toLowerCase()));
            if (found) {
                const diff = Math.abs(found.valuation - c.expected);
                if (diff < 1) {
                    console.log(`[PASS] ${c.name}: ₹${found.valuation} (Correct)`);
                } else {
                    console.error(`[FAIL] ${c.name}: Got ₹${found.valuation}, Expected ₹${c.expected}`);
                }
            } else {
                console.warn(`[MISS] ${c.name} not found in parsed results!`);
            }
        });

    } catch (err) {
        console.error("Audit failed:", err.message);
    }
}

performAudit();
