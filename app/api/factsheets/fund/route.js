import { NextResponse } from 'next/server';
import scraper from '@/lib/scraper';
import { getFactsheetFromCache, saveFactsheetToCache } from '@/lib/db/factsheets';

/**
 * GET /api/factsheets/fund?schemeCode=...&fundName=...
 * Retrieves factsheet data from cache if available, else scrapes and caches it.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const schemeCode = searchParams.get('schemeCode');
    let fundName = searchParams.get('fundName');

    if (!schemeCode) {
        return NextResponse.json({ error: 'schemeCode is required' }, { status: 400 });
    }

    try {
        // 1. Try Cache (unless force refresh or missing mandatory metrics)
        const force = searchParams.get('force') === 'true';
        const cachedData = await getFactsheetFromCache(schemeCode);

        if (cachedData && !force) {
            const hasValuation = cachedData.marketCap?.pe != null && cachedData.marketCap?.pb != null;
            if (hasValuation) {
                return NextResponse.json(cachedData);
            }
            console.log(`[API] Cache found for ${schemeCode} but missing PE/PB. Re-scraping...`);
        }

        // 2. Fetch Fund Name if not provided (from official API)
        if (!fundName) {
            console.log(`[API] Fetching fund name for ${schemeCode} from mfapi.in...`);
            const metaRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
            const metaData = await metaRes.json();
            if (metaData && metaData.meta) {
                fundName = metaData.meta.scheme_name;
            }
        }

        if (!fundName) {
            return NextResponse.json({ error: 'Could not determine fund name' }, { status: 404 });
        }

        // 3. Scrape
        console.log(`[API] Cache MISS for ${schemeCode} (${fundName}). Scraping...`);
        const scrapedData = await scraper.getFactsheet(fundName);

        if (!scrapedData) {
            return NextResponse.json({ error: 'Scraping failed or fund not found on data source' }, { status: 404 });
        }

        // 4. Cache and Return
        await saveFactsheetToCache(schemeCode, scrapedData);

        return NextResponse.json(scrapedData);

    } catch (error) {
        console.error('[API] Factsheet fetching error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
