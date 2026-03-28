// lib/amc-discoverer.js
import * as cheerio from 'cheerio';
import { AMC_CONFIG } from './amc-config.js';

/**
 * Discovers the latest factsheet PDF URL for a given AMC.
 */
export async function discoverFactsheetUrl(amcName) {
    const config = AMC_CONFIG[amcName];
    if (!config) return null;

    if (config.localFile) {
        console.log(`[Discoverer] Using local file for ${amcName}: ${config.localFile}`);
        return config.localFile;
    }

    if (config.directUrl) {
        console.log(`[Discoverer] Using direct URL for ${amcName}: ${config.directUrl}`);
        return config.directUrl;
    }

    try {
        // HDFC Pattern-based Fallback
        if (amcName.includes('HDFC')) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const prevMonth = String(now.getMonth()).padStart(2, '0');
            
            // Try current month folder, then previous
            const urls = [
                `https://files.hdfcfund.com/s3fs-public/${year}-${month}/HDFC%20MF%20Factsheet%20-%20February%202026_0.pdf`,
                `https://files.hdfcfund.com/s3fs-public/${year}-${prevMonth}/HDFC%20MF%20Factsheet%20-%20February%202026_0.pdf`,
            ];
            return urls[0]; // The scraper will try this first
        }

        // Pattern-based fallback for SBI
        if (amcName.includes('SBI')) {
            const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
            const now = new Date();
            const year = now.getFullYear();
            const currentMonth = months[now.getMonth()];
            const prevMonth = months[now.getMonth() - 1] || 'december';
            
            // Try both folder naming conventions
            const urls = [
                `https://www.sbimf.com/docs/default-source/factsheets/all-sbimf-schemes-factsheet-${prevMonth}-${year}.pdf`,
                `https://www.sbimf.com/docs/default-source/scheme-factsheets/all-sbimf-schemes-factsheet-${prevMonth}-${year}.pdf`
            ];
            return urls[0];
        }

        console.log(`Discovering factsheet for ${amcName} at ${config.downloadPage}...`);
        
        const response = await fetch(config.downloadPage, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            console.error(`Failed to fetch ${config.downloadPage}: ${response.statusText}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Strategy 1: Find all PDF links
        const pdfLinks = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text();
            if (href && (href.toLowerCase().includes('.pdf') || href.toLowerCase().endsWith('.pdf'))) {
                // Ensure absolute URL
                let absoluteUrl = href;
                if (href.startsWith('/')) {
                    const url = new URL(config.downloadPage);
                    absoluteUrl = `${url.origin}${href}`;
                } else if (!href.startsWith('http')) {
                    const url = new URL(config.downloadPage);
                    absoluteUrl = `${url.origin}/${href}`;
                }
                pdfLinks.push({ url: absoluteUrl, text: text.trim().replace(/\s+/g, ' ') });
            }
        });

        if (pdfLinks.length === 0) {
            console.log(`No direct PDF links found for ${amcName}. Checking secondary selectors...`);
            // Fallback to AMC-specific selectors if defined
            if (config.pdfSelector) {
                $(config.pdfSelector).each((i, el) => {
                    const href = $(el).attr('href');
                    if (href && (href.toLowerCase().includes('.pdf') || href.toLowerCase().endsWith('.pdf'))) {
                        pdfLinks.push({ url: href, text: $(el).text().trim() });
                    }
                });
            }
        }

        // Strategy 2: Filter for "Latest" or "Factsheet" or current Month
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const currentYear = new Date().getFullYear();
        const currentMonthIdx = new Date().getMonth();
        const currentMonth = months[currentMonthIdx];
        const prevMonth = months[currentMonthIdx - 1] || 'december';

        const scoredLinks = pdfLinks.map(p => {
            let score = 0;
            const text = p.text.toLowerCase();
            const url = p.url.toLowerCase();
            
            // Score based on keywords
            if (text.includes('factsheet') || url.includes('factsheet')) score += 50;
            if (text.includes('monthly') || url.includes('monthly')) score += 20;
            if (text.includes('portfolio') || url.includes('portfolio')) score += 10;
            if (text.includes('statement') || url.includes('additional') || text.includes('sai')) score -= 30; // Deprioritize SAI

            // Score based on year
            const yearMatch = text.match(/20\d{2}/) || url.match(/20\d{2}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : 0;
            if (year === currentYear) score += 100;
            else if (year === currentYear - 1) score += 50;
            else if (year > 0 && year < currentYear - 1) score -= 100; // Deprioritize old years

            // Score based on month
            if (text.includes(currentMonth) || url.includes(currentMonth)) score += 30;
            if (text.includes(prevMonth) || url.includes(prevMonth)) score += 20;

            return { ...p, score, year };
        });

        const sorted = scoredLinks.sort((a, b) => b.score - a.score);
        const latest = sorted[0];

        return latest ? latest.url : null;

    } catch (error) {
        console.error(`Error discovering factsheet for ${amcName}:`, error);
        return null;
    }
}
