import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Google News RSS for Indian Market and Macro events
const NEWS_RSS_URL = 'https://news.google.com/rss/search?q=Indian+stock+market+Nifty+Sensex+macro+news&hl=en-IN&gl=IN&ceid=IN:en';

function parseRSSItems(xmlText) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];

        const title = extractTag(itemXml, 'title');
        const link = extractTag(itemXml, 'link');
        const pubDate = extractTag(itemXml, 'pubDate');
        const source = extractTag(itemXml, 'source');

        if (title) {
            items.push({
                title: decodeEntities(title),
                url: link || '',
                publishedAt: pubDate || '',
                source: { name: source ? decodeEntities(source) : 'Google News' },
            });
        }
    }

    return items.slice(0, 20); // Top 20 headlines
}

function extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const match = xml.match(regex);
    return match ? (match[1] || match[2] || '').trim() : null;
}

function decodeEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, '');
}

export async function GET() {
    try {
        const cacheKey = 'news:mf';
        let data = getCached(cacheKey);

        if (!data) {
            const res = await fetch(NEWS_RSS_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; MFResearch/1.0)',
                },
            });

            if (!res.ok) {
                // Fallback to empty news if RSS fails
                return NextResponse.json({ articles: [], source: 'RSS unavailable' });
            }

            const xmlText = await res.text();
            data = parseRSSItems(xmlText);
            setCache(cacheKey, data, CACHE_TTL);
        }

        return NextResponse.json({ articles: data });
    } catch (error) {
        console.error('News API error:', error);
        return NextResponse.json({ articles: [], error: 'Failed to fetch news' });
    }
}
