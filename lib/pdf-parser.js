import pdf from 'pdf-parse/lib/pdf-parse.js';

/**
 * Custom page renderer to maintain high-fidelity text grouping by Y-coordinate.
 * This ensures that multi-column CAS statements are parsed correctly.
 */
async function render_page(pageData) {
    const textContent = await pageData.getTextContent();
    const lineGroups = [];
    
    textContent.items.forEach(item => {
        const y = item.transform[5];
        // 5px tolerance for grouping items on the same baseline
        let group = lineGroups.find(g => Math.abs(g.y - y) <= 5);
        if (!group) {
            group = { y: y, items: [] };
            lineGroups.push(group);
        }
        group.items.push(item);
    });

    // Sort baselines from top to bottom
    lineGroups.sort((a, b) => b.y - a.y);
    
    let pageText = '';
    lineGroups.forEach(group => {
        // Sort items in line from left to right
        const rowText = group.items.sort((a, b) => a.transform[4] - b.transform[4])
            .map(it => it.str)
            .join(' ')
            .trim();
        if (rowText) {
            pageText += rowText + '\n';
        }
    });
    
    return pageText;
}

/**
 * Extracts text from a CAS PDF statement buffer using pdf-parse with high-fidelity hooks.
 * This is a Node-native solution that avoids pdf.js worker issues in Vercel.
 * @param {Buffer} buffer - The PDF file buffer.
 * @param {string} password - The PDF password (optional).
 * @returns {Promise<string[]>} - An array of text lines.
 */
export async function extractTextFromBuffer(buffer, password = '') {
    try {
        const options = {
            pagerender: render_page
        };
        
        if (password) {
            options.password = password;
        }

        // pdf-parse handles all the internal GlobalWorkerOptions and node-native loading
        const data = await pdf(buffer, options);

        if (!data || !data.text) {
            throw new Error('PDF_PARSER_ERROR: No text extracted from PDF.');
        }

        // Standardize output to match our existing CAS parser logic
        return data.text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
    } catch (error) {
        console.error('PDF Parse error:', error);
        
        const message = error.message || '';
        
        // Specific mapping for common PDF issues
        if (message.includes('No password given') || message.includes('password-protected')) {
            throw new Error('PASSWORD_REQUIRED');
        }
        if (message.includes('Invalid password') || message.includes('Incorrect password')) {
            throw new Error('INCORRECT_PASSWORD');
        }
        
        throw new Error(`PDF_PARSER_ERROR: ${message}`);
    }
}
