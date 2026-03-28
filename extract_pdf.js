const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = process.argv[2];
const txtPath = process.argv[3];

if (!pdfPath || !txtPath) {
    console.error("Usage: node extract_pdf.js <pdfPath> <txtPath>");
    process.exit(1);
}

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync(txtPath, data.text);
    console.log(`Successfully extracted text to ${txtPath}`);
}).catch(err => {
    console.error("Error parsing PDF:", err);
    process.exit(1);
});
