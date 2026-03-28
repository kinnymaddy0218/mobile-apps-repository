import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';

const MFAPI_BASE = 'https://api.mfapi.in';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes - fund list rarely changes

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = searchParams.get('page') || '1';

    try {
        if (query) {
            // Search mode
            const cacheKey = `search:${query}`;
            let data = getCached(cacheKey);

            if (!data) {
                const res = await fetch(`${MFAPI_BASE}/mf/search?q=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('MFAPI search failed');
                data = await res.json();
                setCache(cacheKey, data, CACHE_TTL);
            }

            return NextResponse.json(data);
        } else {
            // List all funds (paginated)
            const cacheKey = `funds:all`;
            let data = getCached(cacheKey);

            if (!data) {
                const res = await fetch(`${MFAPI_BASE}/mf`);
                if (!res.ok) throw new Error('MFAPI list failed');
                data = await res.json();
                setCache(cacheKey, data, CACHE_TTL);
            }

            // Client-side pagination
            const pageNum = parseInt(page);
            const pageSize = 50;
            const start = (pageNum - 1) * pageSize;
            const paged = data.slice(start, start + pageSize);

            return NextResponse.json({
                funds: paged,
                total: data.length,
                page: pageNum,
                pages: Math.ceil(data.length / pageSize),
            });
        }
    } catch (error) {
        console.error('Funds API error:', error);
        return NextResponse.json({ error: 'Failed to fetch funds' }, { status: 500 });
    }
}
