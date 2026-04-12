import * as cheerio from 'cheerio';
import { db } from './firebase.js';
import { doc, getDoc, setDoc, query, collection, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { computeFundMetrics } from './calculations.js';

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
        this.amfiRegistry = null; // Memory cache for global lookup
        this.stats = { matched: 0, failed: 0, fuzzy: 0 };
        this.CACHE_TTL_DAYS = 30; // 30 day refresh policy
    }

    /**
     * Fetch from Firestore Cache
     */
    async getFromCache(instId, ignoreTTL = false) {
        try {
            if (!db) return null;
            const docRef = doc(db, 'fund_factsheets', instId.toString());
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) return null;
            
            const data = docSnap.data();
            const lastUpdated = new Date(data.lastChecked);
            const ageInDays = (new Date() - lastUpdated) / (1000 * 60 * 60 * 24);
            
            // In DB-Only/Resilient mode, we accept ANY cached data to prevent hangs
            if (ignoreTTL || ageInDays < this.CACHE_TTL_DAYS) {
                console.log(`[Scraper] Cache HIT (Firestore) for ID: ${instId} (Age: ${ageInDays.toFixed(1)} days, ignoreTTL: ${ignoreTTL})`);
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
        // 1. Memory Cache Check (24-hour TTL)
        if (this.indexCache && (Date.now() - this.lastIndexFetch < 24 * 60 * 60 * 1000)) {
            return this.indexCache;
        }

        // 2. Web Fetch with 5s hard timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            console.log("[Scraper] Fetching Global Index from Institutional Data Network...");
            const res = await fetch(`${this.baseUrl}/home/get_search_data`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': this.userAgent,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                const index = data.search_data || [];
                
                if (index.length > 0) {
                    this.indexCache = index;
                    this.lastIndexFetch = Date.now();
                    
                    // Mirror to Firestore for absolute persistence/offline-first
                    try {
                        const indexRef = doc(db, 'metadata', 'global_index');
                        await setDoc(indexRef, {
                            data: JSON.stringify(index),
                            lastUpdated: new Date().toISOString()
                        });
                        console.log(`[Scraper] Index mirrored to Firestore (${index.length} entries)`);
                    } catch (e) {}
                    
                    return index;
                }
            }
        } catch (e) {
            clearTimeout(timeoutId);
            console.warn(`[Scraper] Index Fetch HANG/FAIL (${e.name}). Attempting Firestore Fallback...`);
        }

        // 3. Absolute Fallback: Firestore Index Cache
        try {
            const indexRef = doc(db, 'metadata', 'global_index');
            const indexSnap = await getDoc(indexRef);
            if (indexSnap.exists()) {
                const persisted = indexSnap.data();
                const index = JSON.parse(persisted.data);
                console.log(`[Scraper] Using Firestore-Persisted Index (${index.length} entries). Resilience active.`);
                this.indexCache = index;
                this.lastIndexFetch = Date.now();
                return index;
            }
        } catch (e) {
            console.error("[Scraper] Absolute Index Failure:", e.message);
        }

        return [];
    }

    /**
     * Find the AMFI 6-digit code for a given fund name (Using MFAPI Global Mirror)
     */
    async findAmfiByName(fundName) {
        if (!fundName) return null;
        
        try {
            console.log(`[Scraper] Searching for AMFI code for: ${fundName}`);
            // Memoized fetch of the ~1.5MB global registry
            if (!this.amfiRegistry) {
                const res = await fetch(`https://api.mfapi.in/mf`, { headers: { 'User-Agent': this.userAgent } });
                if (!res.ok) return null;
                this.amfiRegistry = await res.json();
                console.log(`[Scraper] AMFI Global Registry Cache Warmed (${this.amfiRegistry.length} funds).`);
            }
            const allFunds = this.amfiRegistry;

            const normalize = (s) => (s || '').toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .replace(/directplan/g, '')
                .replace(/growthoption/g, '')
                .replace(/growth/g, '');

            const inputNorm = normalize(fundName);
            
            // 1. Precise Match
            let match = allFunds.find(f => normalize(f.schemeName) === inputNorm);
            if (match) return match.schemeCode;

            // 2. Fuzzy Overlap
            const tokens = fundName.toLowerCase().split(' ').filter(t => t.length > 3);
            const scored = allFunds.map(f => {
                const fName = f.schemeName.toLowerCase();
                const score = tokens.filter(t => fName.includes(t)).length / tokens.length;
                return { code: f.schemeCode, score };
            }).sort((a, b) => b.score - a.score);

            if (scored[0] && scored[0].score > 0.8) {
                console.log(`[Scraper] Linked "${fundName}" to AMFI: ${scored[0].code} (Score: ${scored[0].score.toFixed(2)})`);
                return scored[0].code;
            }
        } catch (e) {
            console.error(`[Scraper] AMFI Lookup Error:`, e.message);
        }
        return null;
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
     * Standardize fund names for the Discovery engine.
     * Cleanses 'erstwhile', brackets, plans, and growth variants.
     * Now includes AMC Expansion for abbreviated inputs.
     */
    normalizeFundName(name) {
        if (!name) return "";
        let n = name.toLowerCase();

        // 🛡️ AMC Expansion Dictionary (Institutional Mapping)
        const amcMappings = {
            'sbi': 'sbi mutual fund',
            'icici': 'icici prudential',
            'hdfc': 'hdfc mutual fund',
            'nippon': 'nippon india',
            'uti': 'uti mutual fund',
            'mirae': 'mirae asset',
            'dsp': 'dsp mutual fund',
            'tata': 'tata mutual fund',
            'kotak': 'kotak mahindra'
        };

        // If the name starts with an abbreviation, expand it
        const firstWord = n.split(' ')[0];
        if (amcMappings[firstWord] && !n.includes(amcMappings[firstWord])) {
            n = n.replace(firstWord, amcMappings[firstWord]);
        }

        return n
            .replace(/\((.*?)\)/g, (match) => {
                // Keep 'erstwhile' content as it often contains the searchable name
                if (match.toLowerCase().includes('erstwhile')) {
                    return match.replace(/\(|\)|erstwhile/gi, '');
                }
                return '';
            })
            .replace(/ - direct plan/gi, '')
            .replace(/ - growth/gi, '')
            .replace(/ growth plan/gi, '')
            .replace(/ growth option/gi, '')
            .replace(/ fund /gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Captures session and CSRF token for a given fund page.
     * MULTI-ATTEMPT LOGIC: Tries multiple URL patterns to ensure discovery success.
     * Also extracts initial metrics (Expense Ratio, PE, PB).
     */
    async getSession(fundName, schemeId) {
        const norm = this.normalizeFundName(fundName);
        const attempts = [
            norm, // Pattern 1: Raw Normalized
            norm.replace(/sbi-mutual-fund/i, 'sbi'), // Pattern 2: SBI Short
            norm.toLowerCase().includes('icici') && norm.toLowerCase().includes('value') ? 'icici-pru-value-fund-g' : norm, // Pattern 3: Precision ICICI Value
            norm.replace(/icici-prudential/i, 'icici-pru'), // Pattern 4: ICICI Short
        ];

        for (const cleanName of attempts) {
            const urlName = cleanName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const url = `https://www.rupeevest.com/Mutual-Funds-India/Scheme-Portfolio/${urlName}/${schemeId}`;
            
            console.log(`[Scraper] Attempting discovery at: ${url}`);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': this.userAgent },
                    signal: controller.signal
                });
                clearTimeout(timeout);
                if (!response.ok) continue;

                const html = await response.text();
                const $ = cheerio.load(html);
                const csrfToken = $('meta[name="csrf-token"]').attr('content');
                if (!csrfToken) continue;

                const setCookie = response.headers.get('set-cookie');
                const sessionCookie = setCookie ? setCookie.split(';').find(c => c.trim().startsWith('_rupeevest_session')) : null;
                
                let expenseRatio = 0, peRatio = 0, pbRatio = 0;

                // Extract Expense Ratio from static HTML
                $('td').each((i, el) => {
                    if (/Expense Ratio/i.test($(el).text())) {
                        const nextValue = $(el).next('td').text().trim();
                        const m = nextValue.match(/(\d+(?:\.\d+)?)/);
                        if (m) expenseRatio = parseFloat(m[1]);
                    }
                });

                // Extract PE/PB via AJAX
                try {
                    const convalRes = await fetch(`${this.baseUrl}/functionalities/get_concentration_value?schemecode=${schemeId}`, {
                        headers: { 'User-Agent': this.userAgent, 'X-Requested-With': 'XMLHttpRequest', 'Referer': url }
                    });
                    if (convalRes.ok) {
                        const cd = await convalRes.json();
                        if (cd?.concen_value?.length >= 3) {
                            peRatio = cd.concen_value[1];
                            pbRatio = cd.concen_value[2];
                        }
                    }
                } catch (e) {
                    console.warn(`[Scraper] PE/PB fail for ${schemeId}:`, e.message);
                }

                const clean = (v) => isNaN(parseFloat(v)) ? 0 : parseFloat(v);
                return { 
                    csrfToken, 
                    cookie: sessionCookie, 
                    expenseRatio: clean(expenseRatio), 
                    peRatio: clean(peRatio), 
                    pbRatio: clean(pbRatio) 
                };
            } catch (err) {
                clearTimeout(timeout);
                continue;
            }
        }
        return { csrfToken: null, cookie: null, expenseRatio: 0, peRatio: 0, pbRatio: 0 };
    }

    /**
     * Mark a fund for priority discovery (Securing Data)
     */
    async markForDiscovery(fundName, instId) {
        if (!db || !instId) return;
        try {
            const docRef = doc(db, 'fund_factsheets', instId.toString());
            const docSnap = await getDoc(docRef);
            
            // If already exists and has holdings, don't mark as discovery
            if (docSnap.exists() && docSnap.data().holdings?.length > 0) return;

            await setDoc(docRef, {
                fundName,
                instId,
                needsDiscovery: true,
                lastChecked: new Date(0).toISOString(), // Set to epoch so cron picks it up
                holdings: [],
                sectors: [],
                marketCap: { pe: 0, pb: 0, large: 0, mid: 0, small: 0 }
            }, { merge: true });
            
            console.log(`[Scraper] Flagged "${fundName}" (ID: ${instId}) for Discovery.`);
        } catch (e) {
            console.error(`[Scraper] Failed to mark ${instId} for discovery:`, e.message);
        }
    }

    /**
     * Fetch complete factsheet data for a fund
     * amfiCode is the industry standard ID used for portfolio weights.
     */
    async getFactsheet(fundName, force = false, omitHoldings = false, dbOnly = false, amfiCode = null) {
        // 🛡️ Phase 0: Resolve Institutional ID
        // If we ONLY have an amfiCode but it's not a verified ID (usually 4-5 digits), we still need to find the node ID.
        let instId = amfiCode; 
        
        // If amfiCode looks like an AMFI code (> 100000) or is missing, resolve the RV ID
        if (!instId || parseInt(instId) > 50000) {
            instId = await this.findSchemeCode(fundName || amfiCode);
        }

        if (!instId) {
            console.warn(`[Scraper] Could not resolve Institutional ID for: ${fundName || amfiCode}`);
            return null;
        }

        // 1. Check Cache First (Keyed by Institutional ID for reliability)
        if (!force || dbOnly) {
            const cached = await this.getFromCache(instId, dbOnly);
            if (cached) {
                // Precision: Ensure the amfiCode is attached even if it wasn't in cache
                if (amfiCode && !cached.schemeCode) cached.schemeCode = amfiCode;
                
                if (omitHoldings) {
                    const { holdings, ...rest } = cached;
                    return rest;
                }
                return cached;
            }
            if (dbOnly) return null;
        }

        console.log(`[Scraper] Fetching ${fundName} (ID: ${instId}, AMFI: ${amfiCode || 'N/A'})`);
        const session = await this.getSession(fundName, instId);
        
        // If session fails (timeout/block), mark for discovery and return "thin" data
        if (!session.csrfToken && !omitHoldings) {
            console.warn(`[Scraper] Session failed for ${fundName}. Marking for PRIORITY discovery.`);
            await this.markForDiscovery(fundName, instId);
            return {
                fundName,
                instId,
                schemeCode: amfiCode, // Persist the industry ID
                unsecured: true,
                holdings: [],
                sectors: [],
                lastChecked: new Date().toISOString()
            };
        }
        
        const apiHeaders = {
            'User-Agent': this.userAgent,
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': session.csrfToken,
            'Cookie': session.cookie,
            'Referer': `${this.baseUrl}/Mutual-Funds-India/${instId}`
        };

        const fetchPromises = [
            fetch(`${this.baseUrl}/functionalities/get_protfolio_graph_equity?schemecode=${instId}`, { headers: apiHeaders }),
            fetch(`${this.baseUrl}/functionalities/portfolio_markettable?schemecode=${instId}`, { headers: apiHeaders })
        ];

        // Only fetch holdings if not omitted
        if (!omitHoldings) {
            fetchPromises.unshift(fetch(`${this.baseUrl}/functionalities/portfolio_holdings?schemecode=${instId}`, { headers: apiHeaders }));
        }

        const responses = await Promise.all(fetchPromises);
        let holdingsData = { portfolio_holdings: [] };
        let sectorsData = {};
        let mcapData = {};

        if (!omitHoldings) {
            holdingsData = await responses[0].json();
            sectorsData = await responses[1].json();
            mcapData = await responses[2].json();
        } else {
            sectorsData = await responses[0].json();
            mcapData = await responses[1].json();
        }

        // Normalization with Type Safety
        const cleanVal = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            const n = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
            return isNaN(n) ? 0 : n;
        };

        const factsheet = {
            fundName: fundName || "Unnamed Fund",
            instId,
            schemeCode: amfiCode, // Industry Standard ID for weights
            lastChecked: new Date().toISOString(),
            expenseRatio: cleanVal(session.expenseRatio),
            marketCap: (mcapData.cap_values && mcapData.cap_values[0]) ? {
                large: cleanVal(mcapData.cap_values[0].lcap),
                mid: cleanVal(mcapData.cap_values[0].mcap),
                small: cleanVal(mcapData.cap_values[0].scap),
                avgMcap: cleanVal(mcapData.cap_values[0].ppmcap),
                pe: cleanVal(session.peRatio),
                pb: cleanVal(session.pbRatio)
            } : { pe: cleanVal(session.peRatio), pb: cleanVal(session.pbRatio) },
            sectors: (sectorsData.port_graph || []).map(s => ({
                sector: (s.rv_sect_name || "Other").trim(),
                percentage: cleanVal(s.hold_perc)
            })),
            holdings: (holdingsData.portfolio_holdings || []).map(h => ({
                stock: (h.compname || "Unknown Stock").trim(),
                percentage: cleanVal(h.holdpercentage)
            }))
        };

        // 🛡️ Total Alpha Unification: Pricing & Risk Metrics
        const resolvedAmfi = amfiCode || await this.findAmfiByName(fundName);
        if (resolvedAmfi) {
            factsheet.schemeCode = resolvedAmfi;
            console.log(`[Scraper] Securing Performance Alpha for ${fundName} (AMFI: ${resolvedAmfi})...`);
            const navHistory = await this.fetchNavData(resolvedAmfi);
            if (navHistory && navHistory.length > 0) {
                const metrics = computeFundMetrics(navHistory);
                factsheet.performance = {
                    currentNav: cleanVal(navHistory[0].nav),
                    navDate: navHistory[0].date,
                    cagr_1yr: metrics.cagr['1yr'],
                    cagr_3yr: metrics.cagr['3yr'],
                    cagr_5yr: metrics.cagr['5yr'],
                    sharpe: metrics.risk.sharpe,
                    stdDev: metrics.risk.stdDev,
                    period: metrics.risk.period
                };
            }
        }

        // 2. Save to Cache (Only if complete)
        if (!omitHoldings && factsheet.holdings.length > 0) {
            // Clear discovery flag if it was set
            factsheet.needsDiscovery = false;
            await this.saveToCache(instId, factsheet);
        } else if (!omitHoldings) {
            // If we attempted holdings but got none, mark for discovery
            factsheet.unsecured = true;
            await this.markForDiscovery(fundName, instId);
        }

        return factsheet;
    }

    /**
     * Fetch historical NAV data from MFAPI.in
     */
    async fetchNavData(schemeCode) {
        if (!schemeCode) return null;
        
        // 1. Check Firestore Cache first
        try {
            const cacheRef = doc(db, 'fund_nav_cache', schemeCode.toString());
            const cacheSnap = await getDoc(cacheRef);
            if (cacheSnap.exists()) {
                const cache = cacheSnap.data();
                const age = (Date.now() - new Date(cache.lastChecked).getTime()) / (1000 * 60 * 60);
                if (age < 24) { // 24-hour price freshness
                    console.log(`[Scraper] NAV Cache HIT (Firestore) for ${schemeCode} (Age: ${age.toFixed(1)}h)`);
                    return cache.navData || [];
                }
                console.log(`[Scraper] NAV Cache STALE (Firestore) for ${schemeCode} (Age: ${age.toFixed(1)}h). Refreshing...`);
            }
        } catch (e) {
            console.warn(`[Scraper] NAV Cache recovery error for ${schemeCode}:`, e.message);
        }

        // 2. Fetch from source with 8s soft timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            console.log(`[Scraper] NAV Cache MISS (External) for ${schemeCode}. Fetching...`);
            const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
                signal: controller.signal,
                headers: { 'User-Agent': this.userAgent }
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error(`MFAPI status ${res.status}`);
            const json = await res.json();
            const navData = json.data || [];

            // 3. Save to Cache
            if (navData.length > 0) {
                const cacheRef = doc(db, 'fund_nav_cache', schemeCode.toString());
                await setDoc(cacheRef, {
                    schemeCode,
                    navData: navData,
                    lastChecked: new Date().toISOString()
                });
                console.log(`[Scraper] NAV Cache SAVED (Firestore) for ${schemeCode}`);
            }
            
            return navData;
        } catch (e) {
            clearTimeout(timeoutId);
            console.warn(`[Scraper] NAV Source Failure for ${schemeCode} (${e.name}):`, e.message);
            
            // 4. Stale Data Fallback: Better than nothing!
            try {
                const cacheRef = doc(db, 'fund_nav_cache', schemeCode.toString());
                const cacheSnap = await getDoc(cacheRef);
                if (cacheSnap.exists()) {
                    console.log(`[Scraper] Using Stale-Fallback for ${schemeCode} instead of empty dash.`);
                    return cacheSnap.data().navData || [];
                }
            } catch (fallbackErr) {}

            return []; 
        }
    }

    /**
     * Discovery Queue: Prioritize funds that failed real-time scraping
     * then target funds missing from the institutional cache.
     */
    async getDiscoveryQueue(batchSize = 20) {
        if (!db) return [];
        try {
            console.log(`[Scraper] Generating Discovery Queue (Target Batch: ${batchSize})...`);
            
            // Priority 1: Funds flagged with 'needsDiscovery' (Backlog from user failures)
            const p1Query = query(
                collection(db, 'fund_factsheets'),
                where('needsDiscovery', '==', true),
                limit(batchSize)
            );
            const p1Snap = await getDocs(p1Query);
            const queue = p1Snap.docs.map(d => ({ 
                instId: d.id, 
                fundName: d.data().fundName,
                priority: 'URGENT'
            }));

            console.log(`[Scraper] Priority 1 (Backlog): ${queue.length} funds.`);
            if (queue.length >= batchSize) return queue;

            // Priority 2: Systematic Universe Discovery (Funds missing from cache)
            const remaining = batchSize - queue.length;
            console.log(`[Scraper] Universe Discovery: Picking up to ${remaining} new funds...`);
            
            const index = await this.fetchIndex();
            // Shuffle to ensure we cover different AMCs/Categories in each batch
            const shuffledIndex = [...index].sort(() => Math.random() - 0.5);
            
            // We iterate through the shuffled index to find funds not yet in Firestore
            for (const fund of shuffledIndex) {
                if (queue.length >= batchSize) break;
                
                const docRef = doc(db, 'fund_factsheets', fund.schemecode.toString());
                const docSnap = await getDoc(docRef);
                
                if (!docSnap.exists()) {
                    queue.push({
                        instId: fund.schemecode,
                        fundName: fund.s_name,
                        priority: 'UNIVERSE'
                    });
                }
            }

            console.log(`[Scraper] Discovery Queue finalized with ${queue.length} funds. Priority: ${queue[0]?.priority || 'NONE'}`);
            return queue;
        } catch (e) {
            console.error("[Scraper] Queue Generation Error:", e.message);
            return [];
        }
    }
}

const scraper = new ScraperEngine();
export default scraper;
