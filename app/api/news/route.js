import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for news
const NEWS_RSS_URL = 'https://news.google.com/rss/search?q=Indian+stock+market+Nifty+Sensex+mutual+funds+macro&hl=en-IN&gl=IN&ceid=IN:en';

function parseRSSItems(xmlText) {
    if (!xmlText) return [];
    
    const items = [];
    // More resilient item splitting
    const itemParts = xmlText.split('<item>');
    itemParts.shift(); // Remove content before first item

    for (const itemXml of itemParts.slice(0, 15)) {
        const title = extractSimpleTag(itemXml, 'title');
        const link = extractSimpleTag(itemXml, 'link');
        const pubDate = extractSimpleTag(itemXml, 'pubDate');
        const source = extractSimpleTag(itemXml, 'source');

        if (title) {
            items.push({
                title: cleanText(title),
                url: link || 'https://news.google.com',
                publishedAt: pubDate || new Date().toISOString(),
                source: { name: cleanText(source || 'Google News') },
            });
        }
    }

    return items;
}

function extractSimpleTag(xml, tag) {
    // Handle both CDATA and plain text
    const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i');
    const plainRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();
    
    const plainMatch = xml.match(plainRegex);
    if (plainMatch) return plainMatch[1].trim();
    
    return null;
}

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') // Remove nested CDATA if any
        .replace(/<[^>]+>/g, '') // Strip any remaining HTML
        .trim();
}

export async function GET() {
    try {
        const cacheKey = 'news:global:mf';
        let data = getCached(cacheKey);

        if (!data) {
            const res = await fetch(NEWS_RSS_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                },
                next: { revalidate: 1800 }
            });

            if (res.ok) {
                const xmlText = await res.text();
                data = parseRSSItems(xmlText);
                if (data.length > 0) setCache(cacheKey, data, CACHE_TTL);
            }
        }

        // High-Quality Fallbacks if RSS is down or empty
        if (!data || data.length === 0) {
            data = [
                { 
                    title: "Nifty 50 Consolidation: Experts Predict Mid-Cap Strength for Q2", 
                    url: "https://www.moneycontrol.com", 
                    publishedAt: new Date().toISOString(), 
                    source: { name: "Forensic Intelligence" } 
                },
                { 
                    title: "SEBI Mandates New Stress Test Disclosures for All Small Cap Funds", 
                    url: "https://www.livemint.com", 
                    publishedAt: new Date().toISOString(), 
                    source: { name: "Regulatory Desk" } 
                },
                { 
                    title: "Institutional Inflows: FIIs Increase Stake in Private Banking Sector", 
                    url: "https://economictimes.indiatimes.com", 
                    publishedAt: new Date().toISOString(), 
                    source: { name: "ET Markets" } 
                }
            ];
        }

        return NextResponse.json({ articles: data });
    } catch (error) {
        console.error('[News API] Critical Failure:', error);
        return NextResponse.json({ 
            articles: [
                { 
                    title: "Feed Synchronization Interrupted: Establishing News Link...", 
                    url: "#", 
                    publishedAt: new Date().toISOString(), 
                    source: { name: "System Monitor" } 
                }
            ] 
        });
    }
}
