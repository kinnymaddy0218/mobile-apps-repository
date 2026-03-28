'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNAV, formatPercent, getChangeClass } from '@/lib/formatters';
import MarketIndices from '@/components/Dashboard/MarketIndices';

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [radar, setRadar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/funds/top').then(res => res.json()),
            fetch('/api/radar').then(res => res.json())
        ]).then(([d, r]) => {
            setData(d);
            setRadar(Array.isArray(r) ? r : []);
            setLoading(false);
        }).catch(err => {
            setError('Failed to load dashboard data');
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <h1>Dashboard</h1>
                    <p>Market overview and top performers</p>
                </div>
                <div className="hero-banner" style={{ minHeight: '160px' }}>
                    <div className="hero-content">
                        <div className="skeleton skeleton-title" style={{ width: '300px' }}></div>
                        <div className="skeleton skeleton-text" style={{ width: '200px' }}></div>
                    </div>
                </div>
                <div className="grid grid-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card skeleton skeleton-card"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="page-header">
                    <h1>Dashboard</h1>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <p style={{ color: 'var(--color-negative)', fontSize: '1.1rem' }}>{error}</p>
                    <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const { gainers = [], losers = [], categoryPerformers = {}, totalTracked = 0, totalCategories = 0 } = data || {};

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Indian Mutual Fund Market Overview</p>
            </div>

            {/* Market Indices Pulse */}
            <MarketIndices />

            {/* Market Radar */}
            {radar.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)', borderLeft: '4px solid var(--accent-primary)', background: 'var(--bg-card)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✨ Market Radar
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                        {radar.slice(0, 3).map((item, i) => (
                            <Link
                                key={`${item.schemeCode}-${i}`}
                                href={`/fund/${item.schemeCode}`}
                                className="radar-item"
                                style={{
                                    padding: '12px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-secondary)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className={`badge badge-${item.severity || 'info'}`} style={{ fontSize: '0.65rem' }}>
                                        {item.type?.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {item.category}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.schemeName}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {item.message}
                                    {item.evidence && (
                                        <span style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.68rem',
                                            color: 'var(--accent-primary)',
                                            border: '1px solid rgba(0, 163, 255, 0.2)',
                                            fontWeight: 500
                                        }}>
                                            {item.evidence}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Hero Banner */}
            <div className="hero-banner">
                <div className="hero-content">
                    <h2 className="hero-title">📈 Market Summary</h2>
                    <p className="hero-subtitle">Real-time NAV data from AMFI. Explore top performing mutual funds across categories.</p>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-value" style={{ color: 'var(--accent-primary)' }}>
                                {totalTracked || '80'}+
                            </span>
                            <span className="hero-stat-label">Funds Tracked</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value" style={{ color: 'var(--color-positive)' }}>
                                {totalCategories || Object.keys(categoryPerformers).length || 14}
                            </span>
                            <span className="hero-stat-label">Categories</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">Live</span>
                            <span className="hero-stat-label">NAV Updates</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Gainers & Losers */}
            <div className="grid grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
                {/* Gainers */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-positive)' }}>▲</span> Top Gainers Today
                    </h3>
                    {gainers.length > 0 ? (
                        <div className="stagger">
                            {gainers.map((fund, i) => (
                                <Link
                                    key={fund.schemeCode}
                                    href={`/fund/${fund.schemeCode}`}
                                    className="animate-fade-in"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 0',
                                        borderBottom: i < gainers.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.87rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {fund.schemeName}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatNAV(fund.nav)}</div>
                                    </div>
                                    <span className="badge badge-positive" style={{ marginLeft: '12px', flexShrink: 0 }}>
                                        {formatPercent(fund.dailyChangePercent)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data available yet.</p>
                    )}
                </div>

                {/* Losers */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-negative)' }}>▼</span> Top Losers Today
                    </h3>
                    {losers.length > 0 ? (
                        <div className="stagger">
                            {losers.map((fund, i) => (
                                <Link
                                    key={fund.schemeCode}
                                    href={`/fund/${fund.schemeCode}`}
                                    className="animate-fade-in"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 0',
                                        borderBottom: i < losers.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.87rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {fund.schemeName}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatNAV(fund.nav)}</div>
                                    </div>
                                    <span className="badge badge-negative" style={{ marginLeft: '12px', flexShrink: 0 }}>
                                        {formatPercent(fund.dailyChangePercent)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data available yet.</p>
                    )}
                </div>
            </div>

            {/* Category-wise Top Performers */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏆 Category-wise Top Performers (1 Year)
                </h3>
                {Object.keys(categoryPerformers).length > 0 ? (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Top Fund</th>
                                    <th style={{ textAlign: 'right' }}>NAV</th>
                                    <th style={{ textAlign: 'right' }}>1Y Return</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(categoryPerformers).map(([category, fund]) => (
                                    <tr 
                                        key={category} 
                                        className="clickable-row"
                                        onClick={() => router.push(`/fund/${fund.schemeCode}`)}
                                    >
                                        <td>
                                            <span className="badge badge-accent">{category}</span>
                                        </td>
                                        <td>
                                            <Link href={`/fund/${fund.schemeCode}`} style={{ fontWeight: 500 }}>
                                                {fund.schemeName}
                                            </Link>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                                            {formatNAV(fund.nav)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className={getChangeClass(fund.return1yr)}>
                                                {fund.return1yr != null ? formatPercent(fund.return1yr) : '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Loading category data...</p>
                )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-3">
                <Link href="/search" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Search Funds</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Search any Indian mutual fund by name</p>
                </Link>
                <Link href="/compare" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚖️</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Compare Funds</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Side-by-side comparison up to 4 funds</p>
                </Link>
                <Link href="/categories" className="card" style={{ textDecoration: 'none', color: 'inherit', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Category Rankings</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Find the best fund in each category</p>
                </Link>
            </div>
        </div>
    );
}
