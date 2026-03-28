const fs = require('fs');
const { parseFactsheetText } = require('./lib/factsheet-extractor.js');

const rawText = fs.readFileSync('debug_hdfc_raw.txt', 'utf8');
const fundName = "HDFC Flexi Cap Fund";

console.log('--- Debugging Parser locally ---');
const result = parseFactsheetText(rawText, fundName, "HDFC Mutual Fund");

console.log('Result:', JSON.stringify(result, null, 2));
