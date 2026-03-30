import * as cheerio from 'cheerio';
import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Scraper Engine for Mutual Fund Factsheets
 * Targeting high-fidelity internal APIs for institutional data.
 */
class ScraperEngine {
    constructor() {
        this.baseUrl = 'https://www.rupeevest.com';
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
        this.indexCache = null;
        this.lastIndexFetch = 0;
        this.stats = { matched: 0, failed: 0, fuzzy: 0 };
        this.CACHE_TTL_DAYS = 30; // 30 day refresh policy
    }

    /**
     * Fetch from Firestore Cache
     */
    async getFromCache(instId) {
        try {
            if (!db) return null;
            const docRef = doc(db, 'fund_factsheets', instId.toString());
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) return null;
            
            const data = docSnap.data();
            const lastUpdated = new Date(data.lastChecked);
            const ageInDays = (new Date() - lastUpdated) / (1000 * 60 * 60 * 24);
            
            if (ageInDays < this.CACHE_TTL_DAYS) {
                console.log(`[Scraper] Cache HIT (Firestore) for ID: ${instId} (Age: ${ageInDays.toFixed(1)} days)`);
                return data;
            }
            
            console.log(`[Scraper] Cache STALE (Firestore) for ID: ${instId} (Age: ${ageInDays.toFixed(1)} days). Re-scraping...`);
            return null;
        } catch (e) {
            console.error(`[Scraper] Cache Read Error for ${instId}:`, e.message);
            return null;
        }
    }

    /**
     * Save to Firestore Cache
     */
    async saveToCache(instId, data) {
        try {
            if (!db) return;
            const docRef = doc(db, 'fund_factsheets', instId.toString());
            await setDoc(docRef, {
                ...data,
                lastChecked: new Date().toISOString()
            });
            console.log(`[Scraper] Cache SAVED (Firestore) for ID: ${instId}`);
        } catch (e) {
            console.error(`[Scraper] Cache Write Error for ${instId}:`, e.message);
        }
    }

    /**
     * Fetch the global fund index from the high-fidelity source
     */
    async fetchIndex() {
        // Cache index for 24 hours
        if (this.indexCache && (Date.now() - this.lastIndexFetch < 24 * 60 * 60 * 1000)) {
            return this.indexCache;
        }

        console.log("[Scraper] Fetching Global Index from Institutional Engine...");
        const res = await fetch(`${this.baseUrl}/home/get_search_data`, {
            headers: {
                'User-Agent': this.userAgent,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!res.ok) throw new Error(`Failed to fetch Data Source index: ${res.status}`);
        const data = await res.json();
        this.indexCache = data.search_data || [];
        this.lastIndexFetch = Date.now();
        return this.indexCache;
    }

    /**
     * Find the Institutional ID (schemecode) for a given fund name
     */
    async findSchemeCode(fundName) {
        const index = await this.fetchIndex();
        
        const normalize = (s) => (s || '').toLowerCase()
            .replace(/prudential/g, 'pru')
            .replace(/direct plan/g, '')
            .replace(/direct/g, '')
            .replace(/regular plan/g, '')
            .replace(/regular/g, '')
            .replace(/growth option/g, '')
            .replace(/growth plan/g, '')
            .replace(/growth/g, '')
            .replace(/idcw payout/g, '')
            .replace(/idcw reinvestment/g, '')
            .replace(/idcw/g, '')
            .replace(/dividend payout/g, '')
            .replace(/dividend reinvestment/g, '')
            .replace(/dividend/g, '')
            .replace(/payout/g, '')
            .replace(/reinvestment/g, '')
            .replace(/institutional/g, '')
            .replace(/retail/g, '')
            .replace(/\(g\)/g, '')
            .replace(/\(d\)/g, '')
            .replace(/plan/g, '')
            .replace(/scheme/g, '')
            .replace(/mutual fund/g, '')
            .replace(/fund/g, '')
            .replace(/equity/g, 'eq')
            .replace(/[^a-z0-9]/g, '');

        const inputNormalized = normalize(fundName);
        
        // 1. Precise Match
        let match = index.find(f => normalize(f.s_name) === inputNormalized);
        if (match) {
            this.stats.matched++;
            return match.schemecode;
        }

        // 2. Token overlap logic
        const inputTokens = fundName.toLowerCase()
            .replace(/[^a-z0-9 ]/g, '')
            .split(' ')
            .filter(t => t.length > 2 && !['fund', 'mutual', 'scheme', 'direct', 'growth', 'plan', 'regular', 'idcw', 'option', 'payout', 'reinvestment'].includes(t));
        
        if (inputTokens.length === 0) return null;

        const matches = index.map(f => {
            const fName = f.s_name.toLowerCase();
            const overlap = inputTokens.filter(t => fName.includes(t)).length;
            return { schemecode: f.schemecode, score: overlap / inputTokens.length, name: f.s_name };
        }).sort((a, b) => b.score - a.score);

        if (matches[0] && matches[0].score > 0.6) {
            console.log(`[Scraper] Fuzzy Matched "${fundName}" to "${matches[0].name}" (ID: ${matches[0].schemecode}, score: ${matches[0].score.toFixed(2)})`);
            this.stats.fuzzy++;
            return matches[0].schemecode;
        }

        console.warn(`[Scraper] No match found for: ${fundName}`);
        this.stats.failed++;
        return null;
    }

    /**
     * Capture session and CSRF token for a given fund page
     */
    async getSession(fundName, schemeId) {
        // The Portfolio page contains PE/PB ratios and more detailed intelligence
        const urlName = fundName.toLowerCase()
            .replace(/ - direct plan/gi, '')
            .replace(/ - growth/gi, '')
            .replace(/ growth plan/gi, '')
            .replace(/ growth option/gi, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[()]/g, '');
        const url = `https://www.rupeevest.com/Mutual-Funds-India/Scheme-Portfolio/${urlName}/${schemeId}`;
        console.log(`[Scraper] Fetching session & HTML from: ${url}`);
        
        const response = await fetch(url, {
            headers: { 'User-Agent': this.userAgent }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const csrfToken = $('meta[name="csrf-token"]').attr('content');
        const setCookie = response.headers.get('set-cookie');
        const sessionCookie = setCookie ? setCookie.split(';').find(c => c.trim().startsWith('_rupeevest_session')) : null;
        
        let expenseRatio = 0;
        let peRatio = 0;
        let pbRatio = 0;

        $('td').each((i, el) => {
            const text = $(el).text().trim();
            if (/Expense Ratio/i.test(text)) {
                const nextValue = $(el).next('td').text().trim();
                const m = nextValue.match(/(\d+(?:\.\d+)?)/);
                if (m) expenseRatio = parseFloat(m[1]);
            }
        });

        try {
            const convalRes = await fetch(`${this.baseUrl}/functionalities/get_concentration_value?schemecode=${schemeId}`, {
                headers: {
                    'User-Agent': this.userAgent,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': url
                }
            });
            if (convalRes.ok) {
                const convalData = await convalRes.json();
                if (convalData && convalData.concen_value && convalData.concen_value.length >= 3) {
                    peRatio = convalData.concen_value[1];
                    pbRatio = convalData.concen_value[2];
                    console.log(`[Scraper] Extracted PE: ${peRatio}, PB: ${pbRatio} via AJAX`);
                }
            }
        } catch (e) {
            console.warn(`[Scraper] Failed to fetch concentration values for ${schemeId}:`, e.message);
        }

        return { csrfToken, cookie: sessionCookie, expenseRatio, peRatio, pbRatio };
    }

    /**
     * Fetch complete factsheet data for a fund
     */
    async getFactsheet(fundName) {
        const schemeId = await this.findSchemeCode(fundName);
        if (!schemeId) {
            console.warn(`[Scraper] Could not find Institutional ID for: ${fundName}`);
            return null;
        }

        // 1. Check Cache First
        const cached = await this.getFromCache(schemeId);
        if (cached) return cached;

        console.log(`[Scraper] Found ID ${schemeId} for ${fundName}. Initiating session...`);
        const session = await this.getSession(fundName, schemeId);
        
        const apiHeaders = {
            'User-Agent': this.userAgent,
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': session.csrfToken,
            'Cookie': session.cookie,
            'Referer': `${this.baseUrl}/Mutual-Funds-India/${schemeId}`
        };

        const [holdingsRes, sectorsRes, mcapRes] = await Promise.all([
            fetch(`${this.baseUrl}/functionalities/portfolio_holdings?schemecode=${schemeId}`, { headers: apiHeaders }),
            fetch(`${this.baseUrl}/functionalities/get_protfolio_graph_equity?schemecode=${schemeId}`, { headers: apiHeaders }),
            fetch(`${this.baseUrl}/functionalities/portfolio_markettable?schemecode=${schemeId}`, { headers: apiHeaders })
        ]);

        const holdingsData = await holdingsRes.json();
        const sectorsData = await sectorsRes.json();
        const mcapData = await mcapRes.json();

        // Normalize
        const factsheet = {
            fundName,
            instId: schemeId,
            lastChecked: new Date().toISOString(),
            expenseRatio: session.expenseRatio,
            marketCap: mcapData.cap_values && mcapData.cap_values[0] ? {
                large: mcapData.cap_values[0].lcap,
                mid: mcapData.cap_values[0].mcap,
                small: mcapData.cap_values[0].scap,
                avgMcap: mcapData.cap_values[0].ppmcap,
                pe: session.peRatio,
                pb: session.pbRatio
            } : { pe: session.peRatio, pb: session.pbRatio },
            sectors: (sectorsData.port_graph || []).map(s => ({
                sector: s.rv_sect_name,
                percentage: s.hold_perc
            })),
            holdings: (holdingsData.portfolio_holdings || []).map(h => ({
                stock: h.compname,
                percentage: h.holdpercentage
            }))
        };

        // 2. Save to Cache
        await this.saveToCache(schemeId, factsheet);

        return factsheet;
    }

    /**
     * Fetch historical NAV data from MFAPI.in
     */
    async fetchNavData(schemeCode) {
        if (!schemeCode) return null;
        try {
            console.log(`[Scraper] Fetching NAV history for scheme: ${schemeCode}`);
            const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
            if (!res.ok) throw new Error(`MFAPI returned ${res.status}`);
            const data = await res.json();
            return data.data || [];
        } catch (e) {
            console.warn(`[Scraper] Failed to fetch NAV data for ${schemeCode}:`, e.message);
            return [];
        }
    }
}

const scraper = new ScraperEngine();
export default scraper;
