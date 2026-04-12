import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import 'pdfjs-dist/legacy/build/pdf.worker.js';

// Vercel / Serverless Optimization: Use local worker bundled via imports
// No need to set workerSrc to a URL as we've imported the worker module directly

/**
 * Custom page renderer to maintain high-fidelity text grouping by Y-coordinate.
 */
async function getPageText(page) {
    const textContent = await page.getTextContent();
    const lineGroups = [];

    textContent.items.forEach((item) => {
        const y = item.transform[5];
        let group = lineGroups.find((g) => Math.abs(g.y - y) <= 5);
        if (!group) {
            group = { y: y, items: [] };
            lineGroups.push(group);
        }
        group.items.push(item);
    });

    lineGroups.sort((a, b) => b.y - a.y);

    let pageText = '';
    lineGroups.forEach((group) => {
        const rowText = group.items
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map((it) => it.str)
            .join(' ')
            .trim();
        if (rowText) {
            pageText += rowText + '\n';
        }
    });

    return pageText;
}

/**
 * Extracts text from a CAS PDF statement buffer using PDF.js.
 * Implements a robust multi-pass retry for password-protected statements.
 */
export async function extractTextFromBuffer(buffer, password = '') {
    const uint8Array = new Uint8Array(buffer);
    
    // Define password variants to try in order
    const passwordVariants = [
        password.trim(), 
        password.trim().toUpperCase(), 
        password.trim().toLowerCase()
    ].filter((v, i, self) => self.indexOf(v) === i); // Unique values only

    let lastError = null;

    for (const pwd of passwordVariants) {
        try {
            console.log(`[PDF_PARSER] Attempting extraction with password variant length: ${pwd.length}`);
            const loadingTask = pdfjsLib.getDocument({
                data: uint8Array,
                password: pwd,
                verbosity: 0,
                // Serverless friendly: disable worker fetch if already configured via CDN
                useWorkerFetch: false,
                isEvalSupported: false,
                nativeImageDecoderSupport: 'none',
                disableFontFace: true,
            });

            const pdfDocument = await loadingTask.promise;
            let fullText = '';

            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const pageText = await getPageText(page);
                fullText += pageText + '\n';
            }

            console.log(`[PDF_PARSER] Success using password pass.`);
            return fullText
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0);

        } catch (error) {
            lastError = error;
            const message = error.message || '';
            console.log(`[PDF_PARSER] Pass failed: ${message.substring(0, 50)}`);
            
            // If error is not related to password, stop retrying variants
            if (!message.includes('Password') && !message.includes('password') && error.name !== 'PasswordException') {
                break;
            }
        }
    }

    // If we reach here, all variants failed
    if (lastError && (lastError.name === 'PasswordException' || lastError.message?.toLowerCase().includes('password'))) {
        throw new Error(password.trim() ? 'INCORRECT_PASSWORD' : 'PASSWORD_REQUIRED');
    }

    throw new Error(`PDF_PARSER_ERROR: ${lastError?.message || 'Unknown failure'}`);
}
