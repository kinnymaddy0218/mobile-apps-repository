'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MagicSearch from '@/components/MagicSearch';
import { formatPercent, getChangeClass } from '@/lib/formatters';

export default function SearchPage() {
    const router = useRouter();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allData, setAllData] = useState([]);
    const [searchActive, setSearchActive] = useState(false);

    useEffect(() => {
        // Load enriched data for the table
        setLoading(true);
        fetch('/api/funds/search')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAllData(data);
                    setResults(data.slice(0, 50)); // Initial view
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleResultsChange = (filteredResults, query) => {
        if (query.trim().length > 0) {
            setResults(filteredResults);
            setSearchActive(true);
        } else {
            setResults(allData.slice(0, 50));
            setSearchActive(false);
        }
    };

    const handleRowClick = (schemeCode) => {
        console.log('Row clicked for schemeCode:', schemeCode);
        if (schemeCode) {
            router.push(`/fund/${schemeCode}`);
        }
    };

    return (
        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
            <div className="page-header" style={{ marginBottom: 'var(--space-2xl)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-lg)' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Explore Funds</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Use Magic Search to find funds based on your investment goals</p>
            </div>

            {/* Magic Search Component - lower z-index than results to prevent blocking */}
            <div style={{ marginBottom: 'var(--space-2xl)', position: 'relative', zIndex: 10 }}>
                <MagicSearch onResultsChange={handleResultsChange} hideDropdown={true} />
            </div>

            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', padding: '0 var(--space-xs)' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
                    {searchActive ? 'Search Results' : 'Market Leaders'}
                </h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Showing {results.length} funds
                </span>
            </div>

            {/* Results Table - with maximum stack priority to avoid ghost overlays */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', zIndex: 100 }}>
                {loading ? (
                    <div style={{ padding: 'var(--space-xl)' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton skeleton-text" style={{ width: `${80 - i * 5}%`, marginBottom: '16px' }}></div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="table-responsive" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-md)' }}>
                        <table className="data-table">
                            <thead style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <th style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Scheme Name</th>
                                    <th style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Category</th>
                                    <th className="text-right" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>1Y Return</th>
                                    <th className="text-right" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Bench (1Y)</th>
                                    <th className="text-right" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Alpha (3Y)</th>
                                    <th className="text-right" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em' }}>Beta (3Y)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((fund, idx) => (
                                    <tr 
                                        key={fund.schemeCode || idx} 
                                        className="clickable-row" 
                                        onClick={() => handleRowClick(fund.schemeCode)}
                                        style={{ 
                                            borderBottom: '1px solid var(--border-secondary)', 
                                            cursor: 'pointer',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: 'var(--space-md)' }}>
                                            <Link
                                                href={`/fund/${fund.schemeCode}`}
                                                style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', display: 'block', marginBottom: '2px' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {fund.schemeName}
                                            </Link>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>{fund.schemeCode}</span>
                                        </td>
                                        <td style={{ padding: 'var(--space-md)' }}>
                                            <span className="badge badge-accent" style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>{fund.category}</span>
                                        </td>
                                        <td className="text-right" style={{ padding: 'var(--space-md)' }}>
                                            <div className={getChangeClass(fund.cagr?.['1yr'])} style={{ fontWeight: 900, fontSize: '0.95rem' }}>
                                                {formatPercent(fund.cagr?.['1yr'])}
                                            </div>
                                        </td>
                                        <td className="text-right" style={{ padding: 'var(--space-md)' }}>
                                            <div className={getChangeClass(fund.benchmarkROI1Y)} style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {fund.benchmarkROI1Y !== undefined ? formatPercent(fund.benchmarkROI1Y) : '—'}
                                            </div>
                                        </td>
                                        <td className="text-right" style={{ padding: 'var(--space-md)', color: fund.alpha > 0 ? 'var(--color-positive)' : 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                            {fund.alpha?.toFixed(2) || '-'}
                                        </td>
                                        <td className="text-right" style={{ padding: 'var(--space-md)', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                            {fund.beta?.toFixed(2) || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>No data available</h3>
                        <p>Our magical database is currently being updated. Please try again in a few minutes.</p>
                    </div>
                )}
            </div>

            <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <p>Looking for a specific fund not listed here? Start typing in the search bar above.</p>
            </div>
        </div>
    );
}
