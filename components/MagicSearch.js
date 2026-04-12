'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPercent, getChangeClass } from '@/lib/formatters';

const QUICK_FILTERS = [
    { label: '🔥 Top Performers', query: 'top' },
    { label: '🛡️ Low Volatility', query: 'low beta' },
    { label: '💎 Mid Cap Stars', query: 'mid cap' },
    { label: '📈 Index Funds', query: 'index' },
];

export default function MagicSearch({ onResultsChange, onSelect, hideDropdown = false }) {
    const router = useRouter();

    const handleSelectFund = (f) => {
        // Persistence Shield: Trigger a silent warmup for the selected fund.
        // This ensures the factsheet is mirrored in Firestore before the user clicks 'Analyze'.
        fetch('/api/funds/warmup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: f.schemeName || f.name, schemeCode: f.schemeCode })
        }).catch(() => {}); // Silent failure (non-blocking)

        if (onSelect) {
            onSelect(f);
            setQuery('');
            setResults([]);
            setIsOpen(false);
        } else {
            router.push(`/fund/${f.schemeCode}`);
        }
    };

    const [query, setQuery] = useState('');
    const [allData, setAllData] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        // Preload our enriched fund data from Firestore categories
        setLoading(true);
        fetch('/api/funds/search')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAllData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Click outside listener
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Use a ref to track the last query processed to avoid redundant filter operations
    const lastProcessedQuery = useRef('');

    useEffect(() => {
        const q = query.trim().toLowerCase();
        
        // Skip if query hasn't changed (prevents loops if parent re-renders and passes new context)
        if (q === lastProcessedQuery.current && allData.length > 0) return;
        lastProcessedQuery.current = q;

        if (!q) {
            setResults([]);
            if (onResultsChange) onResultsChange([], '');
            return;
        }

        // Natural Language Parsing Logic
        let filtered = [...allData];

        // 1. Category Detection (Regex based)
        const hasSmallCap = /small\s*cap/i.test(q);
        const hasMidCap = /mid\s*cap/i.test(q);
        const hasLargeCap = /large\s*cap/i.test(q);
        const hasIndex = /index|nifty|sensex|passive|etf/i.test(q);
        const hasFlexiCap = /flexi\s*cap/i.test(q);
        const hasMultiCap = /multi\s*cap/i.test(q);
        const hasLargeMid = /large\s*&\s*mid|large\s*and\s*mid|emerging\s*bluechip/i.test(q);
        const hasELSS = /elss|tax\s*saver|tax\s*saving/i.test(q);
        const hasValue = /value|contra/i.test(q);
        const hasFocused = /focused/i.test(q);
        const hasMultiAsset = /multi\s*asset/i.test(q);
        const hasHybrid = /hybrid|balanced|aggressive|arbitrage|baf/i.test(q);
        const hasDebt = /debt|bond|gilt|liquid|overnight|money\s*market|duration/i.test(q);
        const hasGold = /gold|silver|commodity/i.test(q);
        const hasInternational = /international|global|us\s*equity|nasdaq/i.test(q);

        const normalize = (str) => (str || '').toLowerCase().replace(/[\s-]/g, '').replace(/&/g, '');

        if (hasSmallCap) filtered = filtered.filter(f => normalize(f.category).includes('smallcap'));
        if (hasMidCap) filtered = filtered.filter(f => normalize(f.category).includes('midcap'));
        if (hasLargeCap) filtered = filtered.filter(f => normalize(f.category).includes('largecap'));
        if (hasLargeMid) filtered = filtered.filter(f => normalize(f.category).includes('largemid'));
        if (hasIndex) filtered = filtered.filter(f => normalize(f.category).includes('index'));
        if (hasFlexiCap) filtered = filtered.filter(f => normalize(f.category).includes('flexicap'));
        if (hasMultiCap) filtered = filtered.filter(f => normalize(f.category).includes('multicap'));
        if (hasELSS) filtered = filtered.filter(f => normalize(f.category).includes('elss') || normalize(f.category).includes('taxsaver'));
        if (hasValue) filtered = filtered.filter(f => normalize(f.category).includes('value') || normalize(f.category).includes('contra'));
        if (hasFocused) filtered = filtered.filter(f => normalize(f.category).includes('focused'));
        if (hasMultiAsset) filtered = filtered.filter(f => normalize(f.category).includes('multiasset'));
        if (hasHybrid) filtered = filtered.filter(f => normalize(f.category).includes('hybrid') || normalize(f.category).includes('balanced') || normalize(f.category).includes('arbitrage'));
        if (hasDebt) filtered = filtered.filter(f => normalize(f.category).includes('debt') || normalize(f.category).includes('liquid') || normalize(f.category).includes('bond'));
        if (hasGold) filtered = filtered.filter(f => normalize(f.category).includes('gold') || normalize(f.category).includes('silver'));
        if (hasInternational) filtered = filtered.filter(f => normalize(f.category).includes('international'));

        // 2. Intent & Quality Filtering
        if (/loser|worst|bottom|lowest|falling|underperformer|beaten|down|weak|negative|declining/i.test(q)) {
            filtered = filtered.sort((a, b) => (a.cagr?.['1yr'] || 0) - (b.cagr?.['1yr'] || 0));
        } else if (/top|best|highest|gainers|performer|stars|leader|champion|outperformer|winner|return|leading|ranking|popular/i.test(q)) {
            filtered = filtered.sort((a, b) => (b.cagr?.['1yr'] || 0) - (a.cagr?.['1yr'] || 0));
        } else if (/safe|low\s*risk|low\s*beta|stable|steady|defensive|volatility|secure|protection/i.test(q)) {
            filtered = filtered.filter(f => f.beta && f.beta > 0).sort((a, b) => a.beta - b.beta);
        } else if (/alpha|consistent|beat|smart|intelligent|skilled/i.test(q)) {
            filtered = filtered.filter(f => f.alpha && f.alpha > 0).sort((a, b) => b.alpha - a.alpha);
        }

        // 3. Keyword Search (Forgiving name/category matching)
        const cleanQuery = q.replace(/(show|me|find|list|of|the|with|in|for|balanced|funds|loser|worst|bottom|lowest|falling|underperformer|beaten|down|leader|champion|outperformer|winner|return|steady|defensive|volatility|smart|intelligent|skilled|balanced|aggressive|weak|negative|declining|leading|ranking|popular|secure|protection|concentrated|asset)/gi, '').trim();
        const words = cleanQuery.split(/\s+/).filter(w => w.length > 1); // Ignore single chars

        if (words.length > 0) {
            filtered = filtered.filter(f => {
                const name = (f.schemeName || '').toLowerCase();
                const cat = (f.category || '').toLowerCase();
                // Match ALL words against (Name + Category)
                return words.every(w => name.includes(w) || cat.includes(w));
            });
        }

        // 4. Boost exact matches if query is short
        if (q.length > 3) {
            filtered.sort((a, b) => {
                const aName = a.schemeName.toLowerCase();
                const bName = b.schemeName.toLowerCase();
                const aExact = aName.includes(q);
                const bExact = bName.includes(q);
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                return 0;
            });
        }

        const finalResults = filtered.slice(0, 10);
        setResults(finalResults);
        
        // Critical: Update parent with results (ensures Budget/Architect UI reacts)
        if (onResultsChange) {
            onResultsChange(finalResults, q);
        }
        
        setIsOpen(true);
    }, [query, allData, onResultsChange]);

    const handleFilterClick = (filterQuery) => {
        setQuery(filterQuery);
        setIsOpen(true);
    };

    return (
        <div ref={searchRef} className="magic-search-container" style={{ position: 'relative', width: '100%' }}>
            <div className="search-container" style={{ maxWidth: '100%' }}>
                <span className="search-icon">✨</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by intent (e.g. 'top small cap' or 'safe large cap')..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 0 && setIsOpen(true)}
                />
            </div>

            <div className="filter-chips" style={{ marginTop: '12px' }}>
                {QUICK_FILTERS.map(f => (
                    <button
                        key={f.query}
                        className={`chip ${query.includes(f.query) ? 'active' : ''}`}
                        onClick={() => handleFilterClick(f.query)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {!hideDropdown && isOpen && query.length > 0 && (
                <div className="card magic-results" style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    left: 0,
                    right: 0,
                    zIndex: 2000,
                    padding: '0px',
                    maxHeight: '480px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    boxShadow: 'var(--shadow-lg), 0 0 0 1px var(--border-primary)',
                    background: 'var(--bg-card)',
                    backdropFilter: 'var(--glass-blur)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-primary)',
                }}>
                    {loading && results.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Warming up the magic...
                        </div>
                    ) : results.length > 0 ? (
                        <div>
                            {results.map((f, idx) => (
                                <div key={idx} 
                                    onClick={() => handleSelectFund(f)}
                                    className="magic-result-item flex items-center justify-between p-5 cursor-pointer transition-all duration-300 hover:bg-indigo-500/10 group border-b border-[var(--border-primary)] last:border-0"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-sm font-black text-[var(--text-primary)] transition-colors group-hover:text-indigo-500 truncate leading-tight">
                                            {f.schemeName || f.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1.5 pl-2 border-l-2 border-indigo-500/20">
                                            <span className="text-[10px] uppercase font-black text-indigo-400 group-hover:text-indigo-500/80 transition-colors tracking-tighter">
                                                {f.category}
                                            </span>
                                            <span className="text-[9px] font-black text-[var(--text-muted)] opacity-50 uppercase">• {f.fundHouse || 'AMC'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="text-right">
                                            <div className={getChangeClass(f.cagr?.['1yr'])} style={{ fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>
                                                {formatPercent(f.cagr?.['1yr'], 1)}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 900, marginTop: '2px' }}>1Y CAGR</div>
                                        </div>
                                        <div style={{ width: '1px', height: '28px', background: 'var(--border-primary)' }}></div>
                                        <div className="text-right min-w-[50px]">
                                            <div style={{ fontWeight: 900, fontSize: '0.9rem', color: f.alpha > 0 ? 'var(--color-positive)' : 'var(--text-primary)', opacity: f.alpha > 0 ? 1 : 0.6 }}>
                                                {f.alpha?.toFixed(1) || '0.0'}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 900, marginTop: '2px' }}>Alpha</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem', borderTop: '1px solid var(--border-secondary)', marginTop: '4px' }}>
                                <Link href={`/search?q=${encodeURIComponent(query)}`} style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                                    View all matching funds →
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔍</div>
                            <p className="font-medium">No magical results found.</p>
                            <p className="text-xs text-muted mt-1">Try an AMC name or simpler keywords.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
