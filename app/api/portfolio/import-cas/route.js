export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

import { extractTextFromBuffer } from '@/lib/pdf-parser';

async function extractTextWithPassword(buffer, password) {
    try {
        return await extractTextFromBuffer(buffer, password);
    } catch (err) {
        console.error('Extraction Error Detail:', err.message);
        // Pass through our standardized error codes
        if (err.message === 'PASSWORD_REQUIRED' || err.message === 'INCORRECT_PASSWORD') {
            throw err;
        }
        throw new Error(`PDF_PARSER_ERROR: ${err.message.slice(0, 100)}`);
    }
}

let mfCache = null;
let mfCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24;

async function getMFAPIList() {
    if (mfCache && (Date.now() - mfCacheTime < CACHE_DURATION)) return mfCache;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch('https://api.mfapi.in/mf', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                mfCache = data.map(f => ({ schemeCode: f.schemeCode, schemeName: f.schemeName }));
                mfCacheTime = Date.now();
                return mfCache;
            }
        }
    } catch (e) { console.error('MF API Fetch Error:', e.message); }

    try {
        if (db) {
            const snapshot = await getDocs(collection(db, 'category_rankings'));
            const allFunds = [];
            snapshot.forEach(doc => {
                const funds = doc.data().funds || [];
                const catName = doc.id; // The document ID is the category name
                funds.forEach(f => {
                    allFunds.push({ 
                        schemeCode: f.schemeCode, 
                        schemeName: f.schemeName,
                        category: catName 
                    });
                });
            });
            if (allFunds.length > 0) {
                mfCache = allFunds;
                mfCacheTime = Date.now();
                return allFunds;
            }
        }
    } catch (e) { console.error('Firestore Fallback Error:', e.message); }
    return mfCache || [];
}

function fuzzyMatch(extractedName, fundList) {
    if (!extractedName || !fundList || !fundList.length) return null;
    
    const query = extractedName.toLowerCase();
    // Use regex to catch common abbreviations (dir, reg, gr)
    const isDirect = /direct|dir\b/i.test(query);
    const isRegular = /regular|reg\b/i.test(query);
    const isGrowth = /growth|gr\b/i.test(query);
    const isIDCW = /idcw|dividend|payout|reinvestment|div\b/i.test(query);
    const isBonus = /bonus/i.test(query);

    const extractedWords = query
        .replace(/\d+/g, '')
        // Added dir, reg, gr, plan to stopwords to prevent score distortion
        .replace(/folio|account|growth|direct|plan|option|fund|mutual|scheme|-|regular|idcw|dividend|payout|reinvestment|bonus|fof|ETF|dir|reg|gr|pln/gi, '')
        .split(/\s+/)
        .filter(w => w.length > 2);

    if (extractedWords.length === 0) return null;

    let bestMatch = null;
    let maxScore = 0;

    for (const fund of fundList) {
        const candName = fund.schemeName.toLowerCase();
        
        // 1. Strict Plan Type Enforcement (Direct vs Regular)
        // If query explicitly says 'direct/dir', it MUST match a 'direct' plan.
        const candIsDirect = candName.includes('direct');
        if (isDirect && !candIsDirect) continue;
        if (isRegular && candIsDirect) continue;
        
        // Strict Growth/IDCW Enforcement
        const candIsGrowth = candName.includes('growth');
        const candIsIDCW = /idcw|dividend|payout|reinvestment/i.test(candName);
        if (isGrowth && !candIsGrowth) continue;
        if (isIDCW && !candIsIDCW) continue;
        
        // 2. Index Fund and Cap Size Exclusions
        if (query.includes('index') !== candName.includes('index')) continue;
        if (query.includes('small cap') && !candName.includes('small cap')) continue;
        if (query.includes('mid cap') && !candName.includes('mid cap')) continue;
        if (query.includes('small cap') === false && query.includes('mid cap') === false && query.includes('large cap') && !candName.includes('large cap')) continue;
        
        if (query.includes('large and mid') !== candName.includes('large and mid')) {
            if (query.includes('large and midcap') !== candName.includes('large and midcap')) continue;
        }

        // 3. Score calculation
        const candWords = candName.replace(/growth|direct|plan|option|fund|mutual|scheme|-|regular|idcw|dividend|payout|reinvestment|fof|ETF|dir|reg|gr|pln/gi, '').split(/\s+/).filter(w => w.length > 2);
        
        let overlap = 0;
        for (const word of extractedWords) {
            if (candWords.includes(word)) overlap++;
        }

        let score = overlap / Math.max(extractedWords.length, candWords.length);

        if (score > maxScore) {
            maxScore = score;
            bestMatch = fund;
        }
    }

    // Increased threshold for strictness
    // For mobile pro app, we'd rather not match than match incorrectly
    if (maxScore > 0.70) return bestMatch;
    return null;
}

export async function GET() {
    return NextResponse.json({ status: 'ready', service: 'CAS Parser' });
}

export async function POST(request) {
    try {
        console.log('--- CAS IMPORT START (JSON MODE) ---');
        const { file: base64File, fileName, password } = await request.json();

        if (!base64File) return NextResponse.json({ error: 'No file data received' }, { status: 400 });

        console.log('File received via Base64. Name:', fileName || 'unknown');
        const buffer = Buffer.from(base64File, 'base64');
        
        console.log('Starting PDF extraction...');
        const rows = await extractTextWithPassword(buffer, password);
        console.log('PDF Extraction Successful. Rows:', rows.length);

        console.log('Fetching MF API List...');
        const fundList = await getMFAPIList();
        console.log('Fund list fetched. Size:', fundList.length);

        const pickValuation = (text, nums) => {
            if (!nums || !nums.length) return 0;
            const labelMatch = text.match(/(?:Market|Current|Portfolio|Total|Holding)\s*Value\s*[:\-]*\s*(?:Rs\.?|₹)?\s*([\d,]+\.\d{2})/i);
            if (labelMatch) return parseFloat(labelMatch[1].replace(/,/g, ''));
            
            const candidateNums = nums.map(n => n.replace(/,/g, ''))
                                      .filter(n => !/^\d{7,12}$/.test(n))
                                      .map(n => parseFloat(n))
                                      .filter(n => n > 100);

            if (candidateNums.length === 0) return 0;
            return candidateNums[candidateNums.length - 1];
        };

        // === DUAL-MODE FORMAT-AWARE EXTRACTION ENGINE ===
        // Handles two Indian CAS PDF layouts:
        //   MODE 1 (MFCentral/CAMS): Folio + Fund Name + Data all on ONE line
        //     e.g. "19259376  Parag Parikh Flexi Cap Fund  1,82,500  2024.25  20-Mar-2026 87.79 1,77,710"
        //   MODE 2 (SBI/KFintech): Fund name on preceding lines, data row follows
        //     e.g. line N-1: "SBI Gold Fund Dir Plan Growth"
        //          line N:   "123.45  456.78  24-Mar-2026  50.23  66,475"

        const AMC_LIST = ['SBI', 'HDFC', 'ICICI', 'DSP', 'NIPPON', 'QUANT', 'PARAG', 'BANDHAN', 'UTI',
                          'MOTILAL', 'KOTAK', 'AXIS', 'MIRAE', 'TATA', 'INVESCO', 'EDELWEISS', 'CANARA',
                          'BARODA', 'IDFC', 'FRANKLIN', 'HSBC', 'WHITE OAK', 'PGIM', 'PPFAS',
                          'SUNDARAM', 'NAVI', 'MAHINDRA', 'LIC', 'ADITYA', 'BIRLA', 'JM', 'QUANTUM'];

        const noisePattern = /kyc|pan\s*:|mobile\s*:|email\s*:|address|folio\s*no|account\s*statement|please\s*(note|ensure)|computer\s*generated|nsdl|cdsl|kfintech|mfcentral|cams\s*and|registrations|transaction\s*period|portfolio\s*summary|Navya|Beeramguda|Sai\s*M\s*S\s*Homes|Scheme\s*Name|Cost\s*of\s*Investment|NAV\s*Date|Market\s*Value|Invested\s*Value|SoA\s*Holdings|Demat\s*Holdings|Gain\/Loss|Allocation\s*by|Page\s*\d+\s*of|visit\s*us|EUIN|ARN:|Nominee|Guardian|Holder\s*Name|Remarks/i;

        const fundKeyPattern = /\b(fund|flexi|bluechip|midcap|mid.?cap|smallcap|small.?cap|largecap|large.?cap|multi.?cap|elss|tax.?saver|nifty|sensex|index|arbitrage|hybrid|balanced|liquid|overnight|gilt|bond|income|equity|oppor|advantage|contra|pharma|healthcare|infra|banking|psu|gold|silver|etf)\b/i;

        const rawExtracted = [];
        let currentFolio = 'Default';
        let multiLineBuffer = [];

        const findFolio = (line) => {
            const m = line.match(/^(\d{5,15})\b|Folio(?:\s*(?:No|Number|Num))?\s*[:\-]?\s*(\d{5,15})\b/i);
            return m ? (m[1] || m[2]) : null;
        };

        // Data row signature: contains a date pattern dd-Mon-yyyy surrounded by numbers
        const dataRowsRegex = /[\d,.]+\s+[\d,.]+\s+\d{1,2}-[a-z]{3}-\d{4}\s+[\d,.]+\s+[\d,.]+/i;

        const cleanFundName = (raw, folio) => {
            return raw
                .replace(new RegExp(`\\b${folio}\\b`, 'g'), '')
                .replace(/Folio No\.?|Scheme Details|NAV Date|NAV\b|Units|\(INR\)|Balance|Market Value|Gain\/Loss|Invested Value|SOA HOLDINGS|DEMAT HOLDINGS|ISIN|INF\d+|Statement Date|Erstwhile/gi, '')
                .replace(/\([\d\s,.\-+%]+\)/g, '')       // (-3.80%), (+0.61%)
                .replace(/\([^)]{0,80}\)/g, '')           // (Erstwhile old name)
                .replace(/\d{2}-[a-z]{3}-\d{4}.*/gi, '') // cut at date
                .replace(/\b[A-Z0-9]{10,}\b/g, '')       // ISIN codes
                .replace(/[\d,.]+\s*$/, '')               // trailing numbers
                .replace(/[\s\-–—|()\[\]]+$/, '')         // trailing punctuation/parens (fixes Kotak trailing '(')
                .replace(/^[^a-zA-Z]+/, '')               // leading non-alpha
                .replace(/\s+/g, ' ')
                .trim();
        };

        for (let i = 0; i < rows.length; i++) {
            const line = rows[i].trim();
            if (!line) continue;

            const detectedFolio = findFolio(line);
            if (detectedFolio) currentFolio = detectedFolio;

            const match = line.match(dataRowsRegex);
            if (match) {
                const dataPart = match[0];
                const parsedNums = dataPart.match(/[\d,.]+/g);
                if (!parsedNums || parsedNums.length < 4) { multiLineBuffer = []; continue; }

                // Everything before the numeric block
                const rawPrefix = line.substring(0, match.index).trim();
                // Strip leading AMC transaction codes (e.g. "LD246G")
                const prefix = rawPrefix.replace(/^[A-Z0-9]{4,10}\s+/, '').replace(/[\d,.]+\s*$/, '').trim();
                // Strip the leading folio number from prefix to get just the fund name portion
                const prefixNoFolio = prefix.replace(/^\d{5,15}\s+/, '').trim();

                // --- FORMAT DETECTION ---
                // Mode 1 (MFCentral inline): prefix already contains the fund name
                const prefixIsFundName = prefixNoFolio.length > 8 && (
                    AMC_LIST.some(amc => prefixNoFolio.toUpperCase().includes(amc)) ||
                    fundKeyPattern.test(prefixNoFolio)
                );

                let rawName;
                if (prefixIsFundName) {
                    // === MODE 1: MFCentral/CAMS inline format ===
                    rawName = prefixNoFolio;
                    // Check if the prev buffer line is the FIRST HALF of a split fund name.
                    // Only prepend if the buffer line shares the SAME AMC as the inline name —
                    // this prevents cross-fund contamination (e.g. Nippon's "GROWTH PLAN" leaking into DSP).
                    const validBuf = multiLineBuffer.filter(l =>
                        !noisePattern.test(l) && fundKeyPattern.test(l) &&
                        l.length > 8 && (l.match(/\d/g) || []).length / l.length < 0.3
                    );
                    if (validBuf.length > 0) {
                        const prevLine = validBuf[validBuf.length - 1];
                        const getAMC = str => AMC_LIST.find(a => str.toUpperCase().includes(a)) || '';
                        const prevAMC = getAMC(prevLine);
                        const nameAMC = getAMC(rawName);
                        // Only prepend if same AMC and not already captured in rawName
                        if (prevAMC && nameAMC && prevAMC === nameAMC &&
                            !prevLine.toUpperCase().includes(rawName.toUpperCase().slice(0, 12))) {
                            rawName = (prevLine + ' ' + rawName).replace(/\s+/g, ' ').trim();
                        }
                    }

                } else {
                    // === MODE 2: SBI/KFintech multi-line buffer format ===
                    // Require buffer lines to contain an AMC name to prevent generic continuation
                    // lines (e.g. "GROWTH PLAN GROWTH OPTION") from leaking across fund boundaries.
                    const cleanedBuffer = multiLineBuffer.filter(l =>
                        !noisePattern.test(l) && fundKeyPattern.test(l) &&
                        l.length > 10 && (l.match(/\d/g) || []).length / l.length < 0.3 &&
                        AMC_LIST.some(amc => l.toUpperCase().includes(amc))
                    );
                    rawName = (cleanedBuffer.join(' ') + ' ' + prefix).replace(/\s+/g, ' ').trim();
                }

                // INDUSTRIAL VALIDATION
                const isLikelyFund = AMC_LIST.some(amc => rawName.toUpperCase().includes(amc)) ||
                                     fundKeyPattern.test(rawName);
                const isNoise = /\bRIA\b|Distributor\s*Code|EUIN|ARN\s*:|Nominee|Guardian|Status|Remarks|\bPAN\s*:|Mobile\s*:|Email\s*:|Page\s*\d/i.test(rawName);

                if (!isLikelyFund || isNoise) { multiLineBuffer = []; continue; }

                const finalName = cleanFundName(rawName, currentFolio);

                if (finalName.length < 8 || /^(growth|direct|plan|option|fund)$/i.test(finalName)) {
                    multiLineBuffer = []; continue;
                }

                const valuation = parseFloat(parsedNums[parsedNums.length - 1].replace(/,/g, ''));
                if (valuation > 1) {
                    rawExtracted.push({ name: finalName, valuation, folio: currentFolio });
                }
                multiLineBuffer = [];

            } else {
                // Accumulate candidate fund name lines
                const numericDensity = (line.match(/\d/g) || []).length / line.length;
                if (noisePattern.test(line) || numericDensity > 0.4) {
                    multiLineBuffer = []; // Hard noise — clear buffer to prevent contamination
                } else if (fundKeyPattern.test(line) && line.length > 10 && numericDensity < 0.35) {
                    multiLineBuffer.push(line);
                    if (multiLineBuffer.length > 3) multiLineBuffer.shift();
                }
            }
        }

        const extractedFunds = [];
        for (const item of rawExtracted) {
            // FINAL CLEANUP of the extracted name
            // Remove leading non-alphabetic noise like "60.78s", "*", "1. ", etc.
            let finalName = item.name
                .replace(/^[^a-zA-Z]+/, '') 
                .replace(/^\d+(\.\d+)?s?\s*(and|&)?\s*/i, '') // "60.78s and ..."
                .replace(/^[\s\W\d]+/, '') // Any lingering leading noise
                .replace(/\s+/g, ' ')
                .trim();
            
            // One more check: if it still has "Scheme Name" etc, it's corrupted
            if (/Scheme Name|Cost of Investment|Folio No/i.test(finalName)) {
                finalName = item.name.split(/Scheme Name|Cost of Investment/i)[0].trim();
            }

            // If it's just "Growth" or "Direct", it's likely a fragment from a bad previous line
            if (finalName.length < 5 || /^(growth|direct|plan|option)$/i.test(finalName)) continue;
            const match = fuzzyMatch(finalName, fundList);
            const lowerName = finalName.toLowerCase();
            
            const nameSlug = finalName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
            const folioSuffix = item.folio && item.folio !== 'Default' ? `-${item.folio.toString().replace(/[^0-9]/g, '').slice(-6)}` : '';
            const deterministicId = `UNMATCHED_${nameSlug}${folioSuffix}`;
            
            // Refined Category Mapping
            let category = "Equity";
            const lowerFull = (finalName + " " + (match?.schemeName || "") + " " + (item.name || "")).toLowerCase();
            
            // Priority 1: Use matched fund's category if available
            if (match?.category) {
                category = match.category;
            } 
            // Priority 2: Precise Heuristic
            else if (/liquid|overnight|money market|low duration|ultra short|short duration|treasury|gilt|dynamic bond|credit risk|corporate bond/i.test(lowerFull)) {
                if (/liquid/i.test(lowerFull)) category = "Debt - Liquid";
                else if (/overnight/i.test(lowerFull)) category = "Debt - Overnight";
                else if (/money market/i.test(lowerFull)) category = "Debt - Money Market";
                else category = "Debt";
            } else if (/hybrid|balanced|arbitrage|multi asset|multi-asset|equity savings|dynamic asset|balanced advantage/i.test(lowerFull)) {
                if (/arbitrage/i.test(lowerFull)) category = "Hybrid - Arbitrage";
                else if (/balanced advantage|dynamic asset/i.test(lowerFull)) category = "Hybrid - Balanced Advantage";
                else category = "Hybrid";
            } else if (/gold|silver|commodity|metal/i.test(lowerFull)) {
                category = "Metals - Gold & Silver";
            } else if (/index|nifty|sensex|etf/i.test(lowerFull)) {
                category = "Equity - Index";
            } else if (/large & mid|large and mid/i.test(lowerFull)) {
                category = "Equity - Large & Midcap";
            } else if (/small cap|smallcap/i.test(lowerFull)) {
                category = "Equity - Small Cap";
            } else if (/mid cap|midcap/i.test(lowerFull)) {
                category = "Equity - Mid Cap";
            } else if (/large cap|largecap/i.test(lowerFull)) {
                category = "Equity - Large Cap";
                category = "Equity - Flexicap";
            } else if (/multi cap|multicap/i.test(lowerFull)) {
                category = "Equity - Multicap";
            } else if (/contra/i.test(lowerFull)) {
                category = "Equity - Contra";
            } else if (/value/i.test(lowerFull)) {
                category = "Equity - Value";
            } else if (/focus/i.test(lowerFull)) {
                category = "Equity - Focused";
            } else if (/\b(pharma|healthcare|medic|hospital|it\b|tech|software|digital|bank\b|finan|insurance|psu|energy|manufact|auto|infra|telecom|consumer|fmcg|sector|thematic)\b/i.test(lowerFull)) {
                category = "Equity - Sectoral / Thematic";
            } else if (/(dividend yield|natural resources)/i.test(lowerFull)) {
                category = "Equity";
            }
        

            extractedFunds.push({
                schemeCode: match ? match.schemeCode.toString() : deterministicId,
                schemeName: match ? match.schemeName : finalName,
                casName: finalName, // Original name from statement for transparency
                valuation: item.valuation,
                folio: item.folio,
                category: category,
                isMatched: !!match
            });
        }

        return NextResponse.json({
            success: true,
            funds: extractedFunds,
            message: `Successfully analyzed CAS! Identified ${extractedFunds.length} holdings.`
        });
    } catch (error) {
        console.error('CAS Import Error:', error);
        
        const errorMessage = error.message || 'Internal Server Error';
        let status = 500;
        
        if (errorMessage === 'PASSWORD_REQUIRED') {
            status = 401;
            return NextResponse.json({ 
                error: 'PASSWORD_REQUIRED',
                message: 'This PDF is password-protected. Please provide the password (usually your PAN).'
            }, { status });
        }
        
        if (errorMessage === 'INCORRECT_PASSWORD') {
            status = 401;
            return NextResponse.json({ 
                error: 'INCORRECT_PASSWORD',
                message: 'The password provided is incorrect. Please double-check and try again.'
            }, { status });
        }

        return NextResponse.json({ error: errorMessage }, { status });
    }
}
