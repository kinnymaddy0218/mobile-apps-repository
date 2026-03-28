
const { parseFactsheetText } = require('./lib/factsheet-extractor');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function debug() {
    const schemeCode = '118955'; // HDFC Flexi Cap
    const amcName = 'HDFC Mutual Fund';
    const fundName = 'HDFC Flexi Cap Fund - Direct Plan - Growth';

    try {
        console.log(`[Debug] Fetching factsheet for ${schemeCode}...`);
        
        // Use a known PDF URL for HDFC or try to discover it
        // For debugging, I'll try to fetch it from the same source as the API
        const pdfUrl = "https://www.hdfcfund.com/docs/default-source/pdf/monthly-portfolio-disclosure/january-2026/mf-factsheet-january-2026.pdf"; 
        // Note: The date might be different, let's try to get it from the actual API if possible or just use a dummy text for structure
        
        // Actually, let's just use the current API to get rawText if I can modify it to return it
        // Or I can use curl to get the PDF and then parse it here.
        
        // Let's use a simpler approach: I'll modify the API route briefly to return rawText.
    } catch (err) {
        console.error(err);
    }
}
