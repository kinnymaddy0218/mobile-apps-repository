import { NextResponse } from 'next/server';
import scraper from '@/lib/scraper';

/**
 * Discovery Warmup API
 * High-Performance background synchronization for portfolio funds.
 * Returns 200 immediately if data exists, or triggers a silent sync.
 */
export async function POST(req) {
    try {
        const { name, schemeCode, force = false } = await req.json();
        if (!name && !schemeCode) {
            return NextResponse.json({ error: "Name or SchemeCode required" }, { status: 400 });
        }

        // 🛡️ Phase 1: Precision Discovery (Direct Match)
        let factsheet = await scraper.getFactsheet(name || schemeCode, force, false, false, schemeCode);
        
        // 🛡️ Phase 2: Greedy Discovery (Fuzzy Search Fallback)
        if (!factsheet && name && !schemeCode) {
            console.log(`[Discovery] Greedy Fallback for: ${name}`);
            const resolvedId = await scraper.findSchemeCode(name);
            if (resolvedId) {
                // Retry with the resolved ID to ensure we hit the right Institutional URL
                factsheet = await scraper.getFactsheet(name, force, false, false, resolvedId);
            }
        }

        if (factsheet) {
            return NextResponse.json({ 
                success: true, 
                synced: true,
                id: factsheet.instId || factsheet.rvId || schemeCode,
                lastChecked: factsheet.lastChecked 
            });
        }

        return NextResponse.json({ success: false, synced: false, error: "Discovery failed/timed out" });
    } catch (e) {
        console.error(`[Discovery] Warmup failure:`, e.message);
        return NextResponse.json({ success: false, synced: false, error: e.message }, { status: 500 });
    }
}
