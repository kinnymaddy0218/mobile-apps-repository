// app/api/funds/[schemeCode]/factsheet/route.js
import { NextResponse } from 'next/server';
import { getAMCFromFundName, AMC_CONFIG } from '@/lib/amc-config';
import { SCHEME_MAP } from '@/lib/scheme-codes';
import { discoverFactsheetUrl } from '@/lib/amc-discoverer';
import { parseFactsheetText } from '@/lib/factsheet-extractor';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';

import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { schemeCode } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    console.log(`[Factsheet API] Triggered for schemeCode: ${schemeCode}, force: ${force}`);

    try {
        const cacheDir = path.join(process.cwd(), '.data', 'factsheet_cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        const localCachePath = path.join(cacheDir, `${schemeCode}.json`);

        // 0. Check Cache First
        const now = new Date();
        const currentMonthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
        
        if (!force) {
            // A. Try Firestore
            try {
                const cacheRef = adminDb.collection('factsheets').doc(schemeCode);
                const cacheSnap = await cacheRef.get();
                if (cacheSnap.exists) {
                    const cacheData = cacheSnap.data();
                    if (cacheData.extractedMonthYear === currentMonthYear) {
                        console.log(`[Factsheet API] Firestore Cache HIT for ${schemeCode}`);
                        return NextResponse.json({ ...cacheData, source: 'Firestore Cache' });
                    }
                }
            } catch (firestoreError) {
                console.warn(`[Factsheet API] Firestore unavailable, trying local cache:`, firestoreError.message);
                
                // B. Fallback to Local File Cache
                if (fs.existsSync(localCachePath)) {
                    const localData = JSON.parse(fs.readFileSync(localCachePath, 'utf8'));
                    if (localData.extractedMonthYear === currentMonthYear) {
                        console.log(`[Factsheet API] Local File Cache HIT for ${schemeCode}`);
                        return NextResponse.json({ ...localData, source: 'Local File Cache' });
                    }
                }
            }
        }

        // 1. Fetch Fund Meta (with robust fallback)
        let fundName = "";
        let amcName = "";
        
        try {
            const fundRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { signal: AbortSignal.timeout(5000) });
            const fundData = await fundRes.json();
            if (fundData && fundData.meta && fundData.meta.scheme_name) {
                fundName = fundData.meta.scheme_name;
                amcName = getAMCFromFundName(fundName);
            }
        } catch (e) {
            console.warn(`[Factsheet API] External metadata fetch failed for ${schemeCode}:`, e.message);
        }

        // Fallback to SCHEME_MAP if metadata is missing or AMC not detected
        if (!amcName && SCHEME_MAP[schemeCode]) {
            amcName = SCHEME_MAP[schemeCode];
            fundName = fundName || `Fund ${schemeCode}`;
            console.log(`[Factsheet API] Scheme Map HIT: Using ${amcName} for ${schemeCode}`);
        }

        if (!amcName) {
            console.error(`[Factsheet API] AMC detection failed for schemeCode: ${schemeCode}`);
            return NextResponse.json({ error: 'AMC not identified for this fund', schemeCode }, { status: 404 });
        }

        console.log(`[Factsheet API] Fund: "${fundName}", Detected AMC: "${amcName}"`);

        if (!amcName || !AMC_CONFIG[amcName]) {
            console.warn(`[Factsheet API] Unsupported or Unconfigured AMC: "${amcName}" for "${fundName}"`);
            console.log(`Available Keys: ${Object.keys(AMC_CONFIG).join(', ')}`);
            return NextResponse.json({ 
                error: 'Unsupported AMC', 
                detected: amcName,
                configured: !!AMC_CONFIG[amcName]
            }, { status: 400 });
        }

        // 2. Discover Factsheet URL
        const pdfUrl = await discoverFactsheetUrl(amcName);
        console.log(`[Factsheet API] Discovered PDF URL: ${pdfUrl}`);

        if (!pdfUrl) {
            return NextResponse.json({ error: 'Could not locate latest factsheet PDF' }, { status: 404 });
        }

        let buffer;
        if (pdfUrl.startsWith('http')) {
            console.log(`[Factsheet API] Downloading PDF from ${pdfUrl}...`);
            const pdfUrlObj = new URL(pdfUrl);
            const pdfRes = await fetch(pdfUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/pdf,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': `${pdfUrlObj.origin}/`
                }
            });
            if (!pdfRes.ok) {
                const statusCode = pdfRes.status;
                console.error(`[Factsheet API] Failed to download PDF from ${pdfUrl}. Status: ${statusCode} ${pdfRes.statusText}`);
                // Return clean 404 so UI shows "not available" rather than crashing
                return NextResponse.json({ 
                    error: `Factsheet PDF not available (HTTP ${statusCode})`, 
                    url: pdfUrl,
                    amcName,
                    fundName
                }, { status: 404 });
            }
            const arrayBuffer = await pdfRes.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            console.log(`[Factsheet API] Reading local PDF: ${pdfUrl}...`);
            const filePath = path.join(process.cwd(), pdfUrl);
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: 'Local file missing' }, { status: 404 });
            }
            buffer = fs.readFileSync(filePath);
        }

        // 4. Parse PDF
        const data = await pdf(buffer);
        const rawText = data.text;

        // 5. Extract Structured Data
        console.log(`[Factsheet API] Extracting fields for "${fundName}"...`);
        const extracted = parseFactsheetText(rawText, fundName, amcName);
        console.log(`[Factsheet API] Extracted keys: ${Object.keys(extracted).join(', ')}`);
        if (extracted.fundName) console.log(`[Factsheet API] WARNING: extracted has fundName: "${extracted.fundName}"`);

        const result = {
            fundName,
            amcName,
            pdfUrl,
            ...extracted,
            extractedMonthYear: currentMonthYear,
            extractionTimestamp: now.toISOString(),
            rawLength: rawText.length
        };

        // 6. Save to Cache
        try {
            // A. Update Firestore (if available)
            await adminDb.collection('factsheets').doc(schemeCode).set(result);
            console.log(`[Factsheet API] Firestore Cache UPDATED for ${schemeCode}`);
        } catch (saveError) {
            console.warn(`[Factsheet API] Firestore save failed, using local fallback:`, saveError.message);
        }

        // B. Update Local File Cache (always, for dev robustness)
        try {
            const cacheDir = path.join(process.cwd(), '.data', 'factsheet_cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            fs.writeFileSync(path.join(cacheDir, `${schemeCode}.json`), JSON.stringify(result, null, 2));
            console.log(`[Factsheet API] Local File Cache UPDATED for ${schemeCode}`);
        } catch (localSaveError) {
            console.error(`[Factsheet API] Critical local save error:`, localSaveError.message);
        }

        return NextResponse.json({
            ...result,
            source: 'Live PDF Extraction'
        });

    } catch (error) {
        console.error('[Factsheet API] Fatal Error:', error);
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack,
            step: 'fatal'
        }, { status: 500 });
    }
}

function getMockedData(fundName, amcName) {
    const rawText = `
        Asset Allocation
        Equity Shares: 83.50%
        Cash & Others: 16.50%

        Sectoral Allocation
        Financial Services: 21.40%
        Information Technology: 15.20%
        Consumer Goods: 12.10%
        Automobile: 9.50%
        Healthcare: 7.30%

        Top 10 Holdings
        1. HDFC Bank Ltd: 8.50%
        2. ICICI Bank Ltd: 7.20%
        3. Reliance Industries Ltd: 6.80%
        4. Infosys Ltd: 5.40%
        5. Axis Bank Ltd: 4.10%

        Expense Ratio
        Direct Plan: 0.75%
        Regular Plan: 1.62%

        AUM as on February 28, 2026: ₹ 42,150.00 Crores
    `;
    const extracted = parseFactsheetText(rawText);
    return NextResponse.json({
        fundName,
        amcName,
        ...extracted,
        source: 'Simulated Extraction (Fallback)',
        rawLength: rawText.length
    });
}
