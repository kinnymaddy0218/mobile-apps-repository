import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

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
        
        // Group items using a 5px tolerance for Y-coordinates
        const lineGroups = [];
        textContent.items.forEach(item => {
            const y = item.transform[5];
            let group = lineGroups.find(g => Math.abs(g.y - y) <= 5);
            if (!group) {
                group = { y: y, items: [] };
                lineGroups.push(group);
            }
            group.items.push(item);
        });

        // Sort lines from top to bottom
        lineGroups.sort((a, b) => b.y - a.y);
        
        lineGroups.forEach(group => {
            // Sort items in line from left to right
            const rowText = group.items.sort((a, b) => a.transform[4] - b.transform[4])
                .map(it => it.str)
                .join(' ')
                .trim();
            if (rowText) {
                allRows.push(rowText);
            }
        });
    }
    
    return allRows;
}

async function main() {
    const filePath = process.argv[2];
    const password = process.argv[3] || '';

    if (!filePath || !fs.existsSync(filePath)) {
        process.exit(1);
    }

    const buffer = fs.readFileSync(filePath);
    try {
        const rows = await extractTextWithPassword(buffer, password);
        process.stdout.write(JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        process.stderr.write(e.message);
        process.exit(1);
    }
}

main();
