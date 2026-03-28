'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNAV, formatPercent, getChangeClass, formatRelativeTime } from '@/lib/formatters';
import { CATEGORIES } from '@/lib/categories';

export default function CategoriesPage() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [fetchedFunds, setFetchedFunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [sortBy, setSortBy] = useState('1yr');
    const [sortDir, setSortDir] = useState('desc'); // 'desc' = best first

    // Fetch pre-calculated rankings from backend API (which hits Firestore)
    useEffect(() => {
        setLoading(true);
        fetch(`/api/categories/${activeCategory.key}/rankings`)
            .then(res => res.json())
            .then(data => {
                if (data && data.funds) {
                    setFetchedFunds(data.funds);
                    setLastUpdated(data.lastUpdated);
                } else {
                    setFetchedFunds([]);
                    setLastUpdated(null);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch category rankings:', err);
                setFetchedFunds([]);
                setLoading(false);
            });
    }, [activeCategory]);

    const toggleSort = (col) => {
        if (sortBy === col) {
            setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(col);
            setSortDir('desc');
        }
    };

    const sortArrow = (col) => {
        if (sortBy !== col) return ' ↕';
        return sortDir === 'desc' ? ' ↓' : ' ↑';
    };

    // Sort the fetched array in memory if the user clicks a specific column
    const rankedFunds = useMemo(() => {
        const sorted = [...fetchedFunds].sort((a, b) => {
            const retA = a.cagr?.[sortBy] ?? -Infinity;
            const retB = b.cagr?.[sortBy] ?? -Infinity;
            return sortDir === 'desc' ? retB - retA : retA - retB;
        });
        // We now have the absolute mathematically sorted universe. Slice the top 50 strictly for view.
        return sorted.slice(0, 50);
    }, [fetchedFunds, sortBy, sortDir]);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Category Rankings</h1>
                <p>Top performing Direct Growth funds mathematically ranked across all funds</p>
            </div>

            {/* Category Tabs */}
            <div className="tabs">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        className={`tab ${activeCategory.key === cat.key ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--space-sm) 0' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                    📊 Displaying absolute top 50 mathematically-sorted funds computed dynamically from the entire live `{activeCategory.label}` universe.
                </div>
                {lastUpdated && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Last Updated: <strong>{formatRelativeTime(lastUpdated)}</strong>
                    </div>
                )}
            </div>

            {/* Loading indicator */}
            {loading ? (
                <div className="card">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="skeleton skeleton-text" style={{ width: `${95 - (i % 3) * 5}%`, marginBottom: '16px' }}></div>
                    ))}
                </div>
            ) : rankedFunds.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3>No stored rankings found</h3>
                    <p>The daily backend cron job has not generated rankings for this category yet.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="data-table" style={{ minWidth: '1000px' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>Rank</th>
                                    <th>Fund Name</th>
                                    <th style={{ textAlign: 'right' }}>NAV</th>
                                    {[{ key: '1yr', label: '1Y' }, { key: '3yr', label: '3Y' }, { key: '5yr', label: '5Y' }, { key: '7yr', label: '7Y' }, { key: '10yr', label: '10Y' }].map(col => (
                                        <th
                                            key={col.key}
                                            onClick={() => toggleSort(col.key)}
                                            style={{
                                                textAlign: 'right',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                color: sortBy === col.key ? 'var(--accent-primary)' : undefined,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {col.label}{sortArrow(col.key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rankedFunds.map((fund, idx) => {
                                    const isTop = idx === 0 && sortBy === '1yr' && sortDir === 'desc';
                                    return (
                                        <tr 
                                            key={fund.schemeCode} 
                                            className="clickable-row"
                                            onClick={() => router.push(`/fund/${fund.schemeCode}`)}
                                            style={isTop ? { background: 'var(--color-warning-soft)' } : {}}
                                        >
                                            <td>
                                                {isTop ? (
                                                    <span className="badge badge-gold">🥇 1</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{idx + 1}</span>
                                                )}
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/fund/${fund.schemeCode}`}
                                                    style={{ fontWeight: isTop ? 700 : 500, color: 'var(--text-primary)', textDecoration: 'none' }}
                                                >
                                                    {fund.schemeName}
                                                </Link>
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                                                {fund.latestNav != null ? formatNAV(fund.latestNav) : '...'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }} className={getChangeClass(fund.cagr?.['1yr'])}>
                                                {fund.cagr?.['1yr'] != null ? formatPercent(fund.cagr['1yr']) : '...'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }} className={getChangeClass(fund.cagr?.['3yr'])}>
                                                {fund.cagr?.['3yr'] != null ? formatPercent(fund.cagr['3yr']) : '...'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }} className={getChangeClass(fund.cagr?.['5yr'])}>
                                                {fund.cagr?.['5yr'] != null ? formatPercent(fund.cagr['5yr']) : '...'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }} className={getChangeClass(fund.cagr?.['7yr'])}>
                                                {fund.cagr?.['7yr'] != null ? formatPercent(fund.cagr['7yr']) : '—'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }} className={getChangeClass(fund.cagr?.['10yr'])}>
                                                {fund.cagr?.['10yr'] != null ? formatPercent(fund.cagr['10yr']) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
