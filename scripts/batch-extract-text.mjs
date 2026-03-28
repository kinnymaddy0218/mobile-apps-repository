import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const FILES = [
  { pdf: 'icici_factsheet.pdf', txt: 'icici_dump.txt' },
  { pdf: 'kotak_factsheet.pdf', txt: 'kotak_dump.txt' },
  { pdf: 'uti_factsheet.pdf', txt: 'uti_dump.txt' },
  { pdf: 'tata_factsheet.pdf', txt: 'tata_dump.txt' },
  { pdf: 'dsp_factsheet.pdf', txt: 'dsp_dump.txt' },
  { pdf: 'sbi_check.pdf', txt: 'sbi_full_dump.txt' }
];

const BASE_DIR = 'c:/Users/maddy/OneDrive/Documents/Antigravity/mf-research/';

async function extractText(pdfFile, txtFile) {
  const pdfPath = path.join(BASE_DIR, pdfFile);
  const txtPath = path.join(BASE_DIR, txtFile);

  if (!fs.existsSync(pdfPath)) {
    console.log(`File not found: ${pdfPath}`);
    return;
  }

  console.log(`Extracting ${pdfFile}...`);
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    fs.writeFileSync(txtPath, data.text);
    console.log(`Saved to ${txtFile} (${data.text.length} chars)`);
  } catch (err) {
    console.error(`Error extracting ${pdfFile}:`, err.message);
  }
}

async function main() {
  for (const file of FILES) {
    await extractText(file.pdf, file.txt);
  }
}

main();
