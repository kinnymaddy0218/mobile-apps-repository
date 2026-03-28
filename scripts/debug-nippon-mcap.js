import { parseFactsheetText } from './lib/factsheet-extractor.js';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function debugNippon() {
    const schemeCode = '118668'; // Nippon Mid Cap
    const cacheDir = './.data/factsheet_cache';
    const jsonPath = path.join(cacheDir, `${schemeCode}.json`);
    
    if (!fs.existsSync(jsonPath)) {
        console.log("No JSON cache found for 118668");
        return;
    }

    const cachedData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const pdfUrl = cachedData.pdfUrl;
    console.log(`PDF URL: ${pdfUrl}`);

    // Since I can't download easily in a script without fetch (and node-fetch might not be in CWD),
    // I'll try to find if the PDF is already in the cache directory (it usually isn't, as route only saves JSON).
    // Wait, the route.js saves JSON but NOT the raw PDF. 
    // I'll use a one-off curl to download it and then parse it.
}

debugNippon();
