import fs from 'fs';
import path from 'path';

async function generateReport() {
    const pdfPath = path.join(process.cwd(), "cas_summary_report_2026_03_24_071249.pdf");
    const fileBuffer = fs.readFileSync(pdfPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', blob, 'cas_report.pdf');

    try {
        const response = await fetch('http://localhost:3003/api/portfolio/import-cas', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        const funds = data.funds;
        let totalValue = funds.reduce((acc, f) => acc + f.valuation, 0);

        let report = `# CAS Portfolio Audit Report\n\n`;
        report += `Total Value: ₹${totalValue.toLocaleString('en-IN')}\n\n`;
        report += `| Fund Name | Market Value | Weight |\n`;
        report += `|-----------|--------------|--------|\n`;

        funds.forEach(f => {
            const weight = ((f.valuation / totalValue) * 100).toFixed(2);
            report += `| ${f.schemeName} | ₹${f.valuation.toLocaleString('en-IN')} | ${weight}% |\n`;
        });

        fs.writeFileSync('scripts/audit-report.md', report);
        console.log("Report generated at scripts/audit-report.md");

    } catch (err) {
        console.error("Report failed:", err.message);
    }
}

generateReport();
