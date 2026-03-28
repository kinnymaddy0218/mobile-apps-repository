import { NextResponse } from 'next/server';
import scraper from '@/lib/scraper';
import { getFactsheetFromCache, saveFactsheetToCache } from '@/lib/db/factsheets';

/**
 * GET /api/portfolio/overlap?schemes=1234,5678,...
 * Calculates holdings overlap between multiple funds.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const schemesStr = searchParams.get('schemes');

    if (!schemesStr) {
        return NextResponse.json({ error: 'schemes parameter is required' }, { status: 400 });
    }

    const schemeCodes = schemesStr.split(',').map(s => s.trim()).filter(Boolean);
    if (schemeCodes.length < 2) {
        return NextResponse.json({ error: 'At least two schemes are required for overlap analysis' }, { status: 400 });
    }

    try {
        // 1. Fetch factsheets for all schemes
        const factsheets = await Promise.all(schemeCodes.map(async (code) => {
            let data = await getFactsheetFromCache(code);
            if (!data) {
                // Fetch name from official API first if possible
                const metaRes = await fetch(`https://api.mfapi.in/mf/${code}`);
                const metaData = await metaRes.json();
                const fundName = metaData?.meta?.scheme_name;
                
                if (fundName) {
                    data = await scraper.getFactsheet(fundName);
                    if (data) await saveFactsheetToCache(code, data);
                }
            }
            return { code, data };
        }));

        // 2. Identify missing data
        const validFactsheets = factsheets.filter(f => f.data && f.data.holdings);
        if (validFactsheets.length < 2) {
            return NextResponse.json({ 
                error: 'Insufficient factsheet data available currently',
                missing: factsheets.filter(f => !f.data).map(f => f.code)
            }, { status: 404 });
        }

        // 3. Simple Overlap Logic (Intersection of stock names)
        // Normalize stock names for comparison
        const normalize = (s) => (s || '').toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/limited$/g, '')
            .replace(/ltd$/g, '')
            .replace(/india$/g, '');

        // Map of Normalized Name -> Raw Name
        const nameMap = {};
        
        // Extract holdings per fund
        const fundHoldings = validFactsheets.map(f => {
            const holdings = {};
            f.data.holdings.forEach(h => {
                const norm = normalize(h.stock);
                holdings[norm] = parseFloat(h.percentage) || 0;
                nameMap[norm] = h.stock;
            });
            return { code: f.code, name: f.data.fundName, holdings };
        });

        // Calculate overlap between all pairs or unified overlap?
        // Let's do common holdings across ALL selected funds first
        const allStocks = Object.keys(nameMap);
        const overlapResult = [];

        allStocks.forEach(stockNorm => {
            const weights = fundHoldings.map(f => f.holdings[stockNorm] || 0);
            const inAll = weights.every(w => w > 0);
            
            if (inAll) {
                overlapResult.push({
                    stock: nameMap[stockNorm],
                    weights: weights.map((w, i) => ({ 
                        schemeCode: fundHoldings[i].code,
                        fundName: fundHoldings[i].name,
                        percentage: w 
                    })),
                    minWeight: Math.min(...weights),
                    totalWeight: weights.reduce((a, b) => a + b, 0)
                });
            }
        });

        // Total overlap percentage (Min weight across all)
        const commonTotal = overlapResult.reduce((sum, item) => sum + item.minWeight, 0);

        return NextResponse.json({
            funds: fundHoldings.map(f => ({ code: f.code, name: f.name })),
            commonHoldings: overlapResult.sort((a, b) => b.minWeight - a.minWeight),
            overlapPercentage: commonTotal,
            scannedCount: allStocks.length
        });

    } catch (error) {
        console.error('[Overlap API] Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
