'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { formatNAV, formatPercent, formatDate, formatMetric, getChangeClass } from '@/lib/formatters';

// Dynamic imports for Chart.js
import dynamic from 'next/dynamic';
const NavChart = dynamic(() => import('@/components/NavChart'), { ssr: false });
const HistoricalComparison = dynamic(() => import('@/components/Fund/HistoricalComparison'), { ssr: false });
const FactsheetData = dynamic(() => import('@/components/Fund/FactsheetData'), { ssr: false });

// Risk metric explanations
const RISK_EXPLANATIONS = {
    portfolio_turnover: {
        label: 'Portfolio Turnover',
        suffix: 'x',
        desc: 'Rate at which the fund\'s assets are bought and sold by the managers. Higher = more frequent trading.',
        good: 'depends',
    },
    stdDev: {
        label: 'Std Deviation',
        suffix: '%',
        desc: 'Measures how much NAV fluctuates from its average. Higher = more volatile/risky.',
        good: 'lower',
    },
    sharpe: {
        label: 'Sharpe Ratio',
        suffix: '',
        desc: 'Risk-adjusted return per unit of total risk. Higher means better returns for the risk taken. >1 is good, >2 is excellent.',
        good: 'higher',
    },
    sortino: {
        label: 'Sortino Ratio',
        suffix: '',
        desc: 'Like Sharpe but only penalizes downside volatility (losses). Higher is better. More relevant for investors who care only about downside risk.',
        good: 'higher',
    },
    beta: {
        label: 'Beta',
        suffix: '',
        desc: 'Sensitivity to market movements. Beta=1 means moves with market. <1 = less volatile than market, >1 = more volatile.',
        good: 'depends',
    },
    alpha: {
        label: 'Alpha',
        suffix: '%',
        desc: 'Excess return over what Beta would predict. Positive alpha = fund manager is adding value beyond market returns.',
        good: 'higher',
    },
    upsideCapture: {
        label: 'Upside Capture',
        suffix: '%',
        desc: 'How much of the market\'s gains the fund captures when markets rise. >100% = outperforms in up markets.',
        good: 'higher',
    },
    downsideCapture: {
        label: 'Downside Capture',
        suffix: '%',
        desc: 'How much of the market\'s losses the fund captures when markets fall. <100% = loses less in down markets.',
        good: 'lower',
    },
    maxDrawdown: {
        label: 'Max Drawdown',
        suffix: '%',
        desc: 'Largest peak-to-trough decline. Shows the worst-case loss an investor could have experienced.',
        good: 'lower',
    },
};

function RiskMetricRow({ metricKey, fundValue, factsheetValue, categoryValue, benchmarkValue, loadingAverages, period }) {
    const [showTip, setShowTip] = useState(false);
    const info = RISK_EXPLANATIONS[metricKey];
    if (!info || (fundValue == null && factsheetValue == null)) return null;

    // Don't show period for static metrics like capture or drawdown or turnover
    const showPeriod = period && !['portfolio_turnover', 'upsideCapture', 'downsideCapture', 'maxDrawdown'].includes(metricKey);

    return (
        <tr>
            <td style={{ fontWeight: 500 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {info.label} {showPeriod && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>({period})</span>}
                    <button
                        onClick={() => setShowTip(!showTip)}
                        style={{
                            fontSize: '0.7rem',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        ?
                    </button>
                </span>
                {showTip && (
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px',
                        lineHeight: 1.4,
                        padding: '6px 8px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        maxWidth: '300px',
                    }}>
                        {info.desc}
                    </div>
                )}
            </td>
            <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}
                className={metricKey === 'alpha' ? getChangeClass(fundValue) : ''}>
                {fundValue != null ? `${formatMetric(fundValue)}${info.suffix}` : '—'}
            </td>
            <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>
                {loadingAverages ? '...' : (categoryValue != null ? `${formatMetric(categoryValue)}${info.suffix}` : '—')}
            </td>
            <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>
                {benchmarkValue != null ? `${formatMetric(benchmarkValue)}${info.suffix}` : '—'}
            </td>
        </tr>
    );
}

export default function FundDetailPage() {
    const params = useParams();
    const { schemeCode } = params;
    const { user } = useAuth();

    const [fund, setFund] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [averages, setAverages] = useState(null);
    const [averagesLoading, setAveragesLoading] = useState(false);
    const [userHoldings, setUserHoldings] = useState(null);

    // Fetch fund data
    useEffect(() => {
        if (!schemeCode) return;
        setLoading(true);
        fetch(`/api/funds/${schemeCode}`)
            .then(res => {
                if (!res.ok) throw new Error('Fund not found');
                return res.json();
            })
            .then(data => {
                setFund(data);
                setLoading(false);

                // Fetch category averages using internal API
                if (data.schemeCategory) {
                    setAveragesLoading(true);
                    fetch(`/api/categories/${encodeURIComponent(data.schemeCategory)}/averages`)
                        .then(res => res.json())
                        .then(avgData => {
                            if (!avgData.error) setAverages(avgData.averages);
                            setAveragesLoading(false);
                        })
                        .catch(() => setAveragesLoading(false));
                }
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [schemeCode]);

    // Check if in watchlist & Fetch Portfolio Holdings
    useEffect(() => {
        if (!user || !schemeCode || !db) return;
        
        // Check Watchlist
        getDoc(doc(db, 'users', user.uid, 'watchlist', schemeCode))
            .then(snap => setInWatchlist(snap.exists()))
            .catch(() => { });

        // Fetch Portfolio for Ownership Badge
        getDoc(doc(db, 'user_portfolios', user.uid))
            .then(snap => {
                if (snap.exists()) {
                    const data = snap.data();
                    const fundInPortfolio = data.funds?.find(f => f.schemeCode.toString() === schemeCode.toString());
                    if (fundInPortfolio) {
                        setUserHoldings(fundInPortfolio);
                    }
                }
            })
            .catch(err => console.warn('[Portfolio] Failed to check ownership:', err));
    }, [user, schemeCode]);

    const toggleWatchlist = async () => {
        if (!user) {
            setToast({ type: 'error', message: 'Please sign in to add to watchlist' });
            setTimeout(() => setToast(null), 3000);
            return;
        }
        setWatchlistLoading(true);
        try {
            const ref = doc(db, 'users', user.uid, 'watchlist', schemeCode);
            if (inWatchlist) {
                await deleteDoc(ref);
                setInWatchlist(false);
                setToast({ type: 'success', message: 'Removed from watchlist' });
            } else {
                await setDoc(ref, {
                    schemeCode: fund.schemeCode,
                    schemeName: fund.schemeName,
                    schemeCategory: fund.schemeCategory,
                    addedAt: new Date().toISOString(),
                });
                setInWatchlist(true);
                setToast({ type: 'success', message: 'Added to watchlist!' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to update watchlist' });
        } finally {
            setWatchlistLoading(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div className="skeleton skeleton-title" style={{ width: '400px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '200px' }}></div>
                </div>
                <div className="grid grid-3">
                    {[1, 2, 3].map(i => <div key={i} className="card skeleton skeleton-card"></div>)}
                </div>
            </div>
        );
    }

    if (error || !fund) {
        return (
            <div>
                <div className="page-header"><h1>Fund Not Found</h1></div>
                <div className="card empty-state">
                    <div className="empty-state-icon">❌</div>
                    <h3>{error || 'This fund could not be found'}</h3>
                    <Link href="/search" className="btn btn-primary" style={{ marginTop: '16px' }}>Search Funds</Link>
                </div>
            </div>
        );
    }

    const returnPeriods = ['1yr', '3yr', '5yr', '7yr', '10yr'];

    return (
        <div className="animate-fade-in">
            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: 'var(--space-2xl)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xl)' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>{fund.schemeName}</h1>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <span className="badge badge-accent" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 12px' }}>{fund.schemeCategory || fund.schemeType}</span>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 12px' }}>{fund.fundHouse}</span>
                    </div>
                </div>
                <button
                    className={`btn ${inWatchlist ? 'btn-danger' : 'btn-primary'} shadow-glow`}
                    style={{ padding: '12px 24px', borderRadius: 'var(--radius-lg)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    onClick={toggleWatchlist}
                    disabled={watchlistLoading}
                >
                    {watchlistLoading ? '...' : inWatchlist ? '★ In Watchlist' : '☆ Add to Watchlist'}
                </button>
            </div>

            {/* Portfolio Ownership Badge (New) */}
            {userHoldings && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700 mb-8">
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 'var(--radius-2xl)',
                        padding: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '24px',
                        flexWrap: 'wrap',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'rgba(16, 185, 129, 0.2)',
                                borderRadius: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                fontSize: '28px',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                                <span style={{ marginLeft: '12px', marginTop: '4px' }}>💼</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#10b981', marginBottom: '4px' }}>
                                    Portfolio Insight
                                </h3>
                                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                    You own <span style={{ color: '#10b981' }}>{userHoldings.weight?.toFixed(2)}%</span> of your total holdings in this fund.
                                </div>
                            </div>
                        </div>
                        <div style={{ 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '16px 24px', 
                            borderRadius: '16px', 
                            border: '1px solid rgba(255,255,255,0.05)',
                            textAlign: 'right'
                        }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Current Valuation
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-mono)' }}>
                                ₹{userHoldings.valuation?.toLocaleString() || '0'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NAV & Metrics Grid */}
            <div className="grid grid-3 xl:grid-6" style={{ marginBottom: 'var(--space-2xl)', gap: 'var(--space-lg)' }}>
                {[
                    { label: 'Current NAV', value: formatNAV(fund.nav), sub: `as on ${formatDate(fund.navDate)}`, mono: true },
                    { label: 'Daily Change', value: fund.dailyChangePercent != null ? formatPercent(fund.dailyChangePercent) : '—', sub: fund.dailyChange != null ? `₹${fund.dailyChange.toFixed(4)}` : '—', colorClass: getChangeClass(fund.dailyChangePercent) },
                    { label: '1 Year CAGR', value: fund.cagr?.['1yr'] != null ? formatPercent(fund.cagr['1yr']) : '—', colorClass: getChangeClass(fund.cagr?.['1yr']) },
                    { label: '3 Year CAGR', value: fund.cagr?.['3yr'] != null ? formatPercent(fund.cagr['3yr']) : '—', colorClass: getChangeClass(fund.cagr?.['3yr']) },
                    { label: 'P/E Ratio', value: fund.factsheet?.marketCap?.pe != null && Number(fund.factsheet.marketCap.pe) > 0 ? Number(fund.factsheet.marketCap.pe).toFixed(2) : '—', sub: 'Portfolio Valuation', mono: true, colorClass: 'text-indigo-400' },
                    { label: 'P/B Ratio', value: fund.factsheet?.marketCap?.pb != null && Number(fund.factsheet.marketCap.pb) > 0 ? Number(fund.factsheet.marketCap.pb).toFixed(2) : '—', sub: 'Price/Book Value', mono: true, colorClass: 'text-violet-400' }
                ].map((item, i) => (
                    <div key={i} className="card" style={{ 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-primary)', 
                        padding: 'var(--space-xl)', 
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: 'var(--shadow-md)',
                        position: 'relative',
                        overflow: 'hidden',
                        minWidth: '160px'
                    }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', opacity: 0.03, fontSize: '40px', fontWeight: 900, pointerEvents: 'none', color: 'var(--text-primary)' }}>{item.label.split(' ')[0]}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.15em', marginBottom: '12px' }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: item.mono ? "var(--font-mono)" : "inherit" }} className={item.colorClass}>
                            {item.value}
                        </div>
                        {item.sub && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>
                                {item.sub}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* NAV History Chart */}
            <div className="card" style={{ marginBottom: 'var(--space-2xl)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 'var(--space-xl)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📈</span> NAV History Timeline
                </h3>
                {fund.navHistory && fund.navHistory.length > 0 ? (
                    <NavChart navData={fund.navHistory} height={350} />
                ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-2xl)' }}>No chart data available</p>
                )}
            </div>

            {/* Returns & CAGR Tables */}
            <div className="grid grid-2" style={{ marginBottom: 'var(--space-2xl)', gap: 'var(--space-xl)' }}>
                <div className="card" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 'var(--space-xl)', color: 'var(--text-primary)' }}>📊 Rolling Returns (CAGR)</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <th style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.15em' }}>Period</th>
                                    <th style={{ textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.15em' }}>Fund</th>
                                    <th style={{ textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.15em' }}>Category</th>
                                    <th style={{ textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.15em' }}>Benchmark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returnPeriods.map(period => (
                                    <tr key={period} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                        <td style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{period.replace('yr', ' Year')}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '0.95rem' }} className={getChangeClass(fund.cagr?.[period])}>
                                            {fund.cagr?.[period] != null ? formatPercent(fund.cagr[period]) : '—'}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                            {averagesLoading ? '...' : (averages?.cagr?.[period] != null ? formatPercent(averages.cagr[period]) : '—')}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                            {fund.benchmarkMetrics?.cagr?.[period] != null ? formatPercent(fund.benchmarkMetrics.cagr[period]) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>⚡ Risk-Adjusted Metrics</h3>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Click <strong>?</strong> on any metric to see what it means
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ background: 'transparent' }}>
                             <thead style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <th style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.15em' }}>Metric</th>
                                    <th style={{ textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.15em' }}>Calculated</th>
                                    <th style={{ textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.15em' }}>Category</th>
                                    <th style={{ textAlign: 'right', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.15em' }}>Benchmark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(RISK_EXPLANATIONS).map(key => {
                                    // Map UI keys to Factsheet keys
                                    const fsKeyMap = {
                                        stdDev: 'standard_deviation',
                                        beta: 'beta',
                                        sharpe: 'sharpe_ratio',
                                        alpha: 'alpha',
                                        portfolio_turnover: 'portfolio_turnover'
                                    };
                                    const fsKey = fsKeyMap[key];
                                    const fsValue = fund.factsheet?.risk_ratios?.[fsKey];
                                    
                                    return (
                                         <RiskMetricRow
                                            key={key}
                                            metricKey={key}
                                            fundValue={fund.risk?.[key]}
                                            factsheetValue={fsValue}
                                            categoryValue={averages?.risk?.[key]}
                                            benchmarkValue={fund.benchmarkMetrics?.risk?.[key]}
                                            loadingAverages={averagesLoading}
                                            period={fund.risk?.period}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>


            {/* Risk Metrics Legend */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>📖 Understanding Risk Metrics</h3>
                <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-primary)' }}>Return Metrics</h4>
                        <div style={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                            <p><strong>Sharpe Ratio</strong> — Returns earned per unit of total risk. Think of it as "bang for your buck." A ratio {'>'} 1 is good, {'>'} 2 is excellent.</p>
                            <p style={{ marginTop: '8px' }}><strong>Sortino Ratio</strong> — Like Sharpe but smarter — only counts downside moves as risk. Better for assessing volatility quality.</p>
                            <p style={{ marginTop: '8px' }}><strong>Alpha</strong> — The fund manager's "edge." Positive alpha means the fund beat what you'd expect given its risk level.</p>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-warning)' }}>Risk Metrics</h4>
                        <div style={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                            <p><strong>Std Deviation</strong> — How much the fund's NAV bounces around. Higher = more unpredictable. Compare within the same category.</p>
                            <p style={{ marginTop: '8px' }}><strong>Beta</strong> — Market sensitivity. Beta of 1.2 means if market moves 10%, fund moves ~12%. Low beta = defensive.</p>
                            <p style={{ marginTop: '8px' }}><strong>Capture Ratios</strong> — Upside {'>'} 100% and Downside {'<'} 100% is ideal. It means the fund gains more than market in rallies and loses less in crashes.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Peer & Historical Comparison */}
            <HistoricalComparison 
                schemeCode={schemeCode} 
                fundName={fund.schemeName}
                categoryName={fund.schemeCategory}
            />

            <FactsheetData schemeCode={schemeCode} />

            {/* Fund Information */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>ℹ️ Fund Information</h3>
                <div className="grid grid-3" style={{ gap: 'var(--space-md)' }}>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>AMC</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{fund.fundHouse || '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Category</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{fund.schemeCategory || '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Scheme Type</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{fund.schemeType || '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Scheme Code</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem', fontFamily: "'JetBrains Mono', monospace" }}>{fund.schemeCode}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Data Points</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{fund.totalDataPoints || fund.navHistory?.length || 0} NAV records</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
