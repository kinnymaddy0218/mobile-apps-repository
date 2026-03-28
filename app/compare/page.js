'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { formatNAV, formatPercent, formatMetric, getChangeClass } from '@/lib/formatters';
import dynamic from 'next/dynamic';

const NavChart = dynamic(() => import('@/components/NavChart'), { ssr: false });

function CompareContent() {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [allFunds, setAllFunds] = useState(null); // preloaded fund index
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedFunds, setSelectedFunds] = useState([]);
    const [fundData, setFundData] = useState({});
    const [categoryData, setCategoryData] = useState({});
    const [loadingFunds, setLoadingFunds] = useState(new Set());
    const [showContext, setShowContext] = useState(true);
    const [chartPeriod, setChartPeriod] = useState('3yr');

    // Preload entire fund list for instant search
    useEffect(() => {
        fetch('/api/funds?q=')
            .then(res => res.json())
            .catch(() => null);
        // Fetch full list from MFAPI
        fetch('https://api.mfapi.in/mf')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAllFunds(data);
            })
            .catch(() => { });
    }, []);

    // Instant client-side search
    useEffect(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q || q.length < 2) {
            setSearchResults([]);
            return;
        }

        if (allFunds) {
            // Instant client-side filter
            const words = q.split(/\s+/);
            const results = allFunds.filter(fund => {
                const name = (fund.schemeName || '').toLowerCase();
                return words.every(w => name.includes(w));
            }).slice(0, 12);
            setSearchResults(results);
        } else {
            // Fallback: server-side search with short debounce
            const timer = setTimeout(() => {
                setSearchLoading(true);
                fetch(`/api/funds?q=${encodeURIComponent(q)}`)
                    .then(res => res.json())
                    .then(data => {
                        setSearchResults(Array.isArray(data) ? data.slice(0, 12) : []);
                        setSearchLoading(false);
                    })
                    .catch(() => setSearchLoading(false));
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [searchQuery, allFunds]);

    const addFund = useCallback(async (fundOrCode) => {
        const schemeCode = typeof fundOrCode === 'object' ? fundOrCode.schemeCode : fundOrCode;
        
        setSelectedFunds(prev => {
            if (prev.length >= 4) return prev;
            if (prev.find(f => String(f.schemeCode) === String(schemeCode))) return prev;
            
            const newFund = typeof fundOrCode === 'object' 
                ? fundOrCode 
                : { schemeCode, schemeName: `Loading ${schemeCode}...` };
            
            return [...prev, newFund];
        });
        setSearchQuery('');
        setSearchResults([]);

        // Fetch detail data
        setLoadingFunds(prev => new Set([...prev, schemeCode]));
        try {
            const res = await fetch(`/api/funds/${schemeCode}`);
            if (res.ok) {
                const data = await res.json();
                setFundData(prev => ({ ...prev, [schemeCode]: data }));
                
                // Update the name in selectedFunds list if it was just a placeholder
                setSelectedFunds(prev => prev.map(f => 
                    String(f.schemeCode) === String(schemeCode) 
                        ? { ...f, schemeName: data.schemeName } 
                        : f
                ));

                if (data.schemeCategory) {
                    fetch(`/api/categories/${encodeURIComponent(data.schemeCategory)}/averages`)
                        .then(r => r.json())
                        .then(avgData => {
                            if (!avgData.error) {
                                setCategoryData(prev => ({ ...prev, [data.schemeCategory]: avgData.averages }));
                            }
                        })
                        .catch(() => { });
                }
            }
        } catch { }
        setLoadingFunds(prev => {
            const next = new Set(prev);
            next.delete(schemeCode);
            return next;
        });
    }, []);

    // Handle URL-based pre-selection - now independent of allFunds list
    const initialLoadDone = useRef(false);
    useEffect(() => {
        const ids = searchParams.get('ids');
        if (ids && !initialLoadDone.current) {
            initialLoadDone.current = true;
            const idList = ids.split(',').slice(0, 4);
            idList.forEach(id => {
                // If allFunds is already loaded, we can get the name immediately
                const fund = allFunds?.find(f => String(f.schemeCode) === String(id));
                addFund(fund || id);
            });
        }
    }, [searchParams, allFunds, addFund]);

    const removeFund = (schemeCode) => {
        setSelectedFunds(prev => prev.filter(f => f.schemeCode !== schemeCode));
        setFundData(prev => {
            const next = { ...prev };
            delete next[schemeCode];
            return next;
        });
    };

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
    const loadedCount = selectedFunds.filter(f => fundData[f.schemeCode]).length;
    const anyLoaded = loadedCount > 0;
    const isLoading = loadingFunds.size > 0;

    // Helper to determine the "winner" for a given metric across selected funds
    const getWinnerClass = (metricPath, isLowerBetter = false) => {
        // Collect all valid values for this metric
        const allVals = selectedFunds.map(f => {
            const d = fundData[f.schemeCode];
            if (!d) return null;
            // Resolve nested path e.g. "cagr.1yr"
            return metricPath.split('.').reduce((obj, key) => obj?.[key], d);
        }).filter(v => typeof v === 'number');

        if (allVals.length < 2) return () => ''; // Need at least 2 funds to compare

        const bestVal = isLowerBetter ? Math.min(...allVals) : Math.max(...allVals);

        return (val) => {
            if (val == null) return '';
            return val === bestVal ? 'metric-winner' : '';
        };
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Compare Funds</h1>
                <p>Compare up to 4 mutual funds side by side</p>
            </div>

            {/* Search & Add */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                    <div className="search-container" style={{ flex: 1, minWidth: '280px' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder={selectedFunds.length >= 4 ? 'Max 4 funds reached' : 'Search and add a fund to compare...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={selectedFunds.length >= 4}
                        />
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {selectedFunds.length}/4 selected
                    </span>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginBottom: 'var(--space-md)',
                    }}>
                        {searchResults.map(fund => (
                            <button
                                key={fund.schemeCode}
                                onClick={() => addFund(fund)}
                                disabled={selectedFunds.find(f => f.schemeCode === fund.schemeCode)}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '10px 16px',
                                    textAlign: 'left',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.87rem',
                                    borderBottom: '1px solid var(--border-secondary)',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'var(--accent-primary-soft)'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                                {fund.schemeName}
                            </button>
                        ))}
                    </div>
                )}

                {/* Selected Funds Tags */}
                {selectedFunds.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selectedFunds.map((fund, i) => (
                            <div key={fund.schemeCode} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-full)',
                                background: `${colors[i]}20`,
                                border: `1px solid ${colors[i]}40`,
                                fontSize: '0.82rem',
                                color: colors[i],
                                fontWeight: 500,
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[i] }}></span>
                                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {fund.schemeName}
                                </span>
                                {loadingFunds.has(fund.schemeCode) && (
                                    <span style={{ fontSize: '0.7rem', opacity: 0.7, animation: 'pulse 1.5s infinite' }}>⏳</span>
                                )}
                                <button
                                    onClick={() => removeFund(fund.schemeCode)}
                                    style={{ color: colors[i], fontWeight: 700, fontSize: '1rem', padding: '0 2px', lineHeight: 1 }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedFunds.length === 0 && (
                <div className="card empty-state">
                    <div className="empty-state-icon">⚖️</div>
                    <h3>No funds selected</h3>
                    <p>Search and add up to 4 funds above to start comparing.</p>
                </div>
            )}

            {selectedFunds.length > 0 && anyLoaded && (
                <>
                    {/* NAV Chart Overlay */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>📈 NAV History Comparison</h3>
                        <div style={{ height: '350px' }}>
                            <ComparisonChart funds={selectedFunds} fundData={fundData} colors={colors} />
                        </div>
                    </div>

                    {/* Returns Comparison */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-lg) var(--space-lg) var(--space-md)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                                📊 Returns & CAGR Comparison
                            </h3>
                            <button
                                onClick={() => setShowContext(!showContext)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-secondary)',
                                    padding: '4px 12px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {showContext ? 'Hide Context Rows' : 'Show Category & Benchmark'}
                            </button>
                        </div>
                        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        {selectedFunds.map((fund, i) => (
                                            <th key={fund.schemeCode} style={{ textAlign: 'right', color: colors[i] }}>
                                                {fund.schemeName?.split(' ').slice(0, 3).join(' ')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 500 }}>Current NAV</td>
                                        {selectedFunds.map(f => {
                                            const d = fundData[f.schemeCode];
                                            return <td key={f.schemeCode} style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{d ? formatNAV(d.nav) : '—'}</td>;
                                        })}
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 500 }}>Expense Ratio<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}> (regular)</span></td>
                                        {selectedFunds.map(f => {
                                            const d = fundData[f.schemeCode];
                                            const exp = d?.factsheet?.expense_ratio;
                                            return <td key={f.schemeCode} style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{exp ? exp : '—'}</td>;
                                        })}
                                    </tr>
                                    {['1yr', '3yr', '5yr', '7yr', '10yr'].map(period => {
                                        const winnerCheck = getWinnerClass(`cagr.${period}`, false);
                                        return (
                                            <React.Fragment key={period}>
                                                <tr>
                                                    <td style={{ fontWeight: 500 }}>{period.replace('yr', 'Y')} CAGR</td>
                                                    {selectedFunds.map(f => {
                                                        const d = fundData[f.schemeCode];
                                                        const val = d?.cagr?.[period];
                                                        return (
                                                            <td key={f.schemeCode} style={{ textAlign: 'right', fontWeight: 600 }} className={`${getChangeClass(val)} ${winnerCheck(val)}`}>
                                                                {val != null ? formatPercent(val) : '—'}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                                {showContext && (
                                                    <tr style={{ background: 'transparent' }}>
                                                        <td style={{ paddingLeft: '24px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>↳ Category Avg</td>
                                                        {selectedFunds.map(f => {
                                                            const cat = fundData[f.schemeCode]?.schemeCategory;
                                                            const val = categoryData[cat]?.cagr?.[period];
                                                            return (
                                                                <td key={`${f.schemeCode}-cat`} style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                                                    {val != null ? formatPercent(val) : '—'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                )}
                                                {showContext && (
                                                    <tr style={{ background: 'transparent' }}>
                                                        <td style={{ paddingLeft: '24px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>↳ Benchmark</td>
                                                        {selectedFunds.map(f => {
                                                            const val = fundData[f.schemeCode]?.benchmarkMetrics?.cagr?.[period];
                                                            return (
                                                                <td key={`${f.schemeCode}-bench`} style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                                                    {val != null ? formatPercent(val) : '—'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Risk Metrics Comparison */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-lg) var(--space-lg) var(--space-md)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                                ⚡ Risk-Adjusted Metrics
                            </h3>
                            <button
                                onClick={() => setShowContext(!showContext)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-secondary)',
                                    padding: '4px 12px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {showContext ? 'Hide Context Rows' : 'Show Category & Benchmark'}
                            </button>
                        </div>
                        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        {selectedFunds.map((fund, i) => (
                                            <th key={fund.schemeCode} style={{ textAlign: 'right', color: colors[i] }}>
                                                {fund.schemeName?.split(' ').slice(0, 3).join(' ')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { key: 'stdDev', label: 'Std Deviation', suffix: '%', isLowerBetter: true },
                                        { key: 'sharpe', label: 'Sharpe Ratio', suffix: '', isLowerBetter: false },
                                        { key: 'sortino', label: 'Sortino Ratio', suffix: '', isLowerBetter: false },
                                        { key: 'beta', label: 'Beta', suffix: '', isLowerBetter: true },
                                        { key: 'alpha', label: 'Alpha', suffix: '%', isLowerBetter: false },
                                        { key: 'upsideCapture', label: 'Upside Capture', suffix: '%', isLowerBetter: false },
                                        { key: 'downsideCapture', label: 'Downside Capture', suffix: '%', isLowerBetter: true },
                                    ].map(metric => {
                                        const winnerCheck = getWinnerClass(`risk.${metric.key}`, metric.isLowerBetter);
                                        return (
                                            <React.Fragment key={metric.key}>
                                                <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                                    <td style={{ fontWeight: 500 }}>
                                                        {metric.label}
                                                    </td>
                                                    {selectedFunds.map(f => {
                                                        const d = fundData[f.schemeCode];
                                                        const val = d?.risk?.[metric.key];
                                                        const period = d?.risk?.period;
                                                        const isCalculated = !['upsideCapture', 'downsideCapture'].includes(metric.key);
                                                        
                                                        return (
                                                            <td key={f.schemeCode} style={{ textAlign: 'right', fontWeight: 600 }} className={winnerCheck(val)}>
                                                                <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                                                    {val != null ? `${formatMetric(val)}${metric.suffix}` : '—'}
                                                                </div>
                                                                {isCalculated && period && (
                                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                                        ({period})
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                                {showContext && (
                                                    <tr style={{ background: 'transparent' }}>
                                                        <td style={{ paddingLeft: '24px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>↳ Official (Factsheet)</td>
                                                        {selectedFunds.map(f => {
                                                            const factsheet = fundData[f.schemeCode]?.factsheet;
                                                            // Map UI metric key to factsheet key
                                                            const fsKeyMap = {
                                                                stdDev: 'standard_deviation',
                                                                sharpe: 'sharpe_ratio',
                                                                beta: 'beta',
                                                                alpha: 'alpha'
                                                            };
                                                            const fsKey = fsKeyMap[metric.key];
                                                            const val = factsheet?.risk_ratios?.[fsKey];
                                                            return (
                                                                <td key={`${f.schemeCode}-off`} style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                                                    {val ? `${val}${metric.suffix}` : '—'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                )}
                                                {showContext && (
                                                    <tr style={{ background: 'transparent' }}>
                                                        <td style={{ paddingLeft: '24px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>↳ Category Avg</td>
                                                        {selectedFunds.map(f => {
                                                            const cat = fundData[f.schemeCode]?.schemeCategory;
                                                            const val = categoryData[cat]?.risk?.[metric.key];
                                                            return (
                                                                <td key={`${f.schemeCode}-cat`} style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                                                    {val != null ? `${formatMetric(val)}${metric.suffix}` : '—'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                )}
                                                {showContext && (
                                                    <tr style={{ background: 'transparent' }}>
                                                        <td style={{ paddingLeft: '24px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>↳ Benchmark</td>
                                                        {selectedFunds.map(f => {
                                                            const val = fundData[f.schemeCode]?.benchmarkMetrics?.risk?.[metric.key];
                                                            return (
                                                                <td key={`${f.schemeCode}-bench`} style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                                                    {val != null ? `${formatMetric(val)}${metric.suffix}` : '—'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Risk-Return Scatter Plot */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>🎯 Risk vs Return Analysis</h3>
                            <select
                                value={chartPeriod}
                                onChange={(e) => setChartPeriod(e.target.value)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-secondary)',
                                    padding: '6px 14px',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="1yr">1 Year CAGR</option>
                                <option value="3yr">3 Year CAGR</option>
                                <option value="5yr">5 Year CAGR</option>
                                <option value="7yr">7 Year CAGR</option>
                                <option value="10yr">10 Year CAGR</option>
                            </select>
                        </div>
                        <div style={{ height: '400px' }}>
                            <RiskReturnChart
                                funds={selectedFunds}
                                fundData={fundData}
                                categoryData={categoryData}
                                colors={colors}
                                period={chartPeriod}
                            />
                        </div>
                    </div>

                </>
            )}

            {selectedFunds.length > 0 && isLoading && (
                <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ⏳ Loading data for {loadingFunds.size} fund{loadingFunds.size > 1 ? 's' : ''}...
                </div>
            )}
        </div>
    );
}

// Comparison chart component
function ComparisonChart({ funds, fundData, colors }) {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        let cancelled = false;

        const initChart = async () => {
            const { Chart, registerables } = await import('chart.js');
            await import('chartjs-adapter-date-fns');
            Chart.register(...registerables);

            if (cancelled || !canvasRef.current) return;

            // Destroy previous instance
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }

            // Normalize all fund NAV data to 100 base for fair comparison
            const datasets = funds.map((fund, i) => {
                const data = fundData[fund.schemeCode];
                if (!data?.navHistory) return null;

                const navHistory = [...data.navHistory].reverse(); // oldest first
                if (navHistory.length === 0) return null;

                const baseNav = parseFloat(navHistory[0].nav);

                // Downsample for performance
                let displayData = navHistory;
                if (navHistory.length > 400) {
                    const step = Math.ceil(navHistory.length / 400);
                    displayData = navHistory.filter((_, idx) => idx % step === 0 || idx === navHistory.length - 1);
                }

                return {
                    label: fund.schemeName?.split(' ').slice(0, 4).join(' '),
                    data: displayData.map(d => {
                        const parts = d.date.split('-');
                        return {
                            x: new Date(parts[2], parts[1] - 1, parts[0]),
                            y: (parseFloat(d.nav) / baseNav) * 100,
                        };
                    }),
                    borderColor: colors[i],
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                };
            }).filter(Boolean);

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

            chartInstance.current = new Chart(canvasRef.current, {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 300 },
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            labels: {
                                color: isDark ? '#94a3b8' : '#475569',
                                font: { family: "'Inter', sans-serif", size: 11 },
                                usePointStyle: true,
                                pointStyle: 'circle',
                            },
                        },
                        tooltip: {
                            backgroundColor: isDark ? '#1a2035' : '#ffffff',
                            titleColor: isDark ? '#f0f4ff' : '#0f172a',
                            bodyColor: isDark ? '#94a3b8' : '#475569',
                            borderColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)',
                            borderWidth: 1,
                            cornerRadius: 10,
                            padding: 12,
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}`,
                            },
                        },
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: { unit: 'month', displayFormats: { month: 'MMM yy' } },
                            grid: { display: false },
                            ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 11 }, maxTicksLimit: 8 },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Normalized (Base=100)',
                                color: isDark ? '#64748b' : '#94a3b8',
                                font: { size: 11 },
                            },
                            grid: { color: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.04)' },
                            ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 11 } },
                        },
                    },
                },
            });
        };

        initChart();

        return () => {
            cancelled = true;
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [funds, fundData, colors]);

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}

// Risk-Return scatter chart component
function RiskReturnChart({ funds, fundData, categoryData, colors, period }) {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        let cancelled = false;

        const initChart = async () => {
            const { Chart, registerables } = await import('chart.js');
            Chart.register(...registerables);

            if (cancelled || !canvasRef.current) return;

            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

            const datasets = [];

            // Add Category Average and Benchmark if they exist (based on the first selected fund's category)
            if (funds.length > 0) {
                const firstFundCat = fundData[funds[0].schemeCode]?.schemeCategory;
                const catAvg = categoryData[firstFundCat];

                if (catAvg && catAvg.risk?.stdDev != null && catAvg.cagr?.[period] != null) {
                    datasets.push({
                        label: 'Category Average',
                        data: [{ x: catAvg.risk.stdDev, y: catAvg.cagr[period] }],
                        backgroundColor: isDark ? '#94a3b8' : '#64748b',
                        borderColor: isDark ? '#ffffff' : '#000000',
                        borderWidth: 1,
                        pointRadius: 8,
                        pointStyle: 'rectRot' // Diamond shape
                    });
                }

                const benchMetrics = fundData[funds[0].schemeCode]?.benchmarkMetrics;
                const benchInfo = fundData[funds[0].schemeCode]?.benchmarkInfo;
                if (benchMetrics && benchMetrics.risk?.stdDev != null && benchMetrics.cagr?.[period] != null) {
                    datasets.push({
                        label: benchInfo?.name ? `Benchmark (${benchInfo.name})` : 'Benchmark',
                        data: [{ x: benchMetrics.risk.stdDev, y: benchMetrics.cagr[period] }],
                        backgroundColor: isDark ? '#f87171' : '#dc2626',
                        borderColor: isDark ? '#ffffff' : '#000000',
                        borderWidth: 1,
                        pointRadius: 8,
                        pointStyle: 'triangle'
                    });
                }
            }

            // Add selected funds
            funds.forEach((fund, i) => {
                const d = fundData[fund.schemeCode];
                if (d && d.risk?.stdDev != null && d.cagr?.[period] != null) {
                    // 1. Calculated Point
                    datasets.push({
                        label: `${fund.schemeName?.split(' ').slice(0, 3).join(' ')} (Calculated)`,
                        data: [{ x: d.risk.stdDev, y: d.cagr[period] }],
                        backgroundColor: colors[i],
                        borderColor: isDark ? '#ffffff' : '#000000',
                        borderWidth: 2,
                        pointRadius: 8,
                        pointStyle: 'circle'
                    });

                    // 2. Official Point (if exists)
                    const fs = d.factsheet;
                    if (fs?.risk_ratios?.standard_deviation) {
                        const fsStd = parseFloat(fs.risk_ratios.standard_deviation);
                        // Official factsheets don't usually provide real-time CAGR for 3Y/5Y in a way we can easily use for Y-axis here 
                        // UNLESS it's specifically for the same period.
                        // For now we'll plot Official Risk at the SAME Y (Return) to show the horizontal 'gap' in risk reporting,
                        // or just skip if we don't have return.
                        // Actually, many factsheets DO have Returns. But our parser prioritizes metrics.
                        // Let's just show a vertical line or a hollow circle for official risk.
                        datasets.push({
                            label: `${fund.schemeName?.split(' ').slice(0, 3).join(' ')} (Official AMC)`,
                            data: [{ x: fsStd, y: d.cagr[period] }],
                            backgroundColor: 'transparent',
                            borderColor: colors[i],
                            borderWidth: 2,
                            pointRadius: 6,
                            pointStyle: 'rect', // Square for official
                            borderDash: [2, 2]
                        });
                    }
                }
            });

            chartInstance.current = new Chart(canvasRef.current, {
                type: 'scatter',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 500 },
                    plugins: {
                        legend: {
                            labels: {
                                color: isDark ? '#94a3b8' : '#475569',
                                font: { family: "'Inter', sans-serif", size: 11 },
                                usePointStyle: true,
                            },
                        },
                        tooltip: {
                            backgroundColor: isDark ? '#1a2035' : '#ffffff',
                            titleColor: isDark ? '#f0f4ff' : '#0f172a',
                            bodyColor: isDark ? '#94a3b8' : '#475569',
                            borderColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)',
                            borderWidth: 1,
                            cornerRadius: 10,
                            padding: 12,
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: Risk ${ctx.parsed.x.toFixed(2)}% | Return ${ctx.parsed.y.toFixed(2)}%`,
                            },
                        },
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Risk (Standard Deviation %)',
                                color: isDark ? '#cbd5e1' : '#334155',
                                font: { weight: 600 }
                            },
                            grid: { color: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.04)' },
                            ticks: { color: isDark ? '#64748b' : '#94a3b8' },
                        },
                        y: {
                            title: {
                                display: true,
                                text: `Return (${period.replace('yr', 'Y')} CAGR %)`,
                                color: isDark ? '#cbd5e1' : '#334155',
                                font: { weight: 600 }
                            },
                            grid: { color: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.04)' },
                            ticks: { color: isDark ? '#64748b' : '#94a3b8' },
                        },
                    },
                },
            });
        };

        initChart();

        return () => {
            cancelled = true;
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [funds, fundData, categoryData, colors, period]);

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: 'var(--text-muted)' }}>
                Loading Comparison Engine...
            </div>
        }>
            <CompareContent />
        </Suspense>
    );
}
