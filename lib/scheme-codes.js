// lib/scheme-codes.js

/**
 * A fallback dictionary for common scheme codes to AMC names.
 * This helps when mfapi.in returns empty metadata.
 */
export const SCHEME_MAP = {
    // SBI
    '120465': 'SBI Mutual Fund', // SBI Large Cap (Direct)
    '119598': 'SBI Mutual Fund', // SBI Large Cap
    '125497': 'SBI Mutual Fund', // SBI Small Cap
    '119749': 'SBI Mutual Fund', // SBI Bluechip (Another common code)
    
    // HDFC
    '118955': 'HDFC Mutual Fund', // HDFC Flexi Cap Direct
    '100119': 'HDFC Mutual Fund', // HDFC Flexi Cap Growth
    '118989': 'HDFC Index Solutions', // HDFC Nifty 50 Index
    
    // ICICI
    '100378': 'ICICI Prudential Mutual Fund', // ICICI Bluechip
    '120586': 'ICICI Prudential Mutual Fund', // ICICI Prudential Value Discovery
    
    // Nippon
    '118668': 'Nippon India Mutual Fund', // Nippon India Growth (Midcap)
    '118778': 'Nippon India Mutual Fund', // Nippon India Small Cap
    '102238': 'Nippon India Mutual Fund', // Nippon India Growth (Regular)
    
    // Kotak
    '119280': 'Kotak Mutual Fund', // Kotak Flexi Cap
    
    // Axis
    '120503': 'Axis Mutual Fund', // Axis Bluechip
    
    // Mirae
    '118834': 'Mirae Asset Mutual Fund', // Mirae Asset Large Cap
    
    // Quant
    '120847': 'Quant Mutual Fund', // Quant Small Cap
    
    // Parag Parikh
    '122639': 'PPFAS Mutual Fund',
    
    // DSP
    '118544': 'DSP Mutual Fund',
    '119107': 'DSP Mutual Fund', // DSP Savings Fund
    
    // Tata
    '135800': 'Tata Mutual Fund', // Tata Digital India
    '119106': 'Tata Mutual Fund', // Tata Balanced Advantage
    
    // Motilal
    '118223': 'Motilal Oswal Mutual Fund',
    '120224': 'Motilal Oswal Mutual Fund',
    
    // LIC
    '118671': 'LIC Mutual Fund', // LIC Large Cap
    '150495': 'LIC Mutual Fund', // LIC Multi Cap (Correct code)
    
    // Invesco
    '107386': 'Invesco Mutual Fund',
    
    // Edelweiss
    '107129': 'Edelweiss Mutual Fund',
    
    // Bandhan
    '124115': 'Bandhan Mutual Fund'
};
