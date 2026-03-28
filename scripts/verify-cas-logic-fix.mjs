import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

// Polyfill DOMMatrix for Node.js
if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrix {
        constructor(arg) {
            this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
            this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
            this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
            this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
            if (typeof arg === 'string') { /* basic parse if needed */ }
            else if (Array.isArray(arg) && arg.length === 6) {
                this.m11 = arg[0]; this.m12 = arg[1];
                this.m21 = arg[2]; this.m22 = arg[3];
                this.m41 = arg[4]; this.m42 = arg[5];
            }
        }
    };
}

async function extractTextWithPassword(buffer, password) {
    try {
        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjs.getDocument({
            data: uint8Array,
            password: password,
            useSystemFonts: true,
            disableFontFace: true
        });

        const doc = await loadingTask.promise;
        let allRows = [];
        
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            
            const rows = {};
            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                if (!rows[y]) rows[y] = [];
                rows[y].push(item);
            });

            const sortedY = Object.keys(rows).sort((a, b) => b - a);
            
            sortedY.forEach(y => {
                const rowItems = rows[y].sort((a, b) => a.transform[4] - b.transform[4]);
                const rowText = rowItems.map(it => it.str).join(' ').trim();
                if (rowText) {
                    allRows.push(rowText);
                }
            });
        }
        
        return allRows;
    } catch (err) {
        console.error('PDF Extraction Error:', err);
        throw err;
    }
}

async function test() {
    const pdfPath = 'C:\\Users\\maddy\\OneDrive\\Documents\\Antigravity\\mf-research\\cas_summary_report_2026_03_24_071249.pdf';
    console.log(`Testing with file: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
        console.error('File NOT found!');
        return;
    }

    const buffer = fs.readFileSync(pdfPath);
    try {
        const rows = await extractTextWithPassword(buffer, '');
        console.log(`Extracted ${rows.length} rows.`);
        console.log('Sample data:', rows.slice(0, 10));
    } catch (e) {
        console.error('Failed test:', e.message);
    }
}

test();
