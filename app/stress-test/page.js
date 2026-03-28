'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatNAV, formatPercent, getChangeClass } from '@/lib/formatters';
import dynamic from 'next/dynamic';

const CrashTimeline = dynamic(() => import('@/components/CrashTimeline'), { ssr: false });

const CRASH_SCENARIOS = [
    {
        id: 'covid-2020',
        name: 'COVID-19 Crash (2020)',
        description: 'Global pandemic induced sharp market sell-off.',
        startDate: '2020-02-15',
        endDate: '2020-06-30',
        peakDate: '2020-02-15',
        troughDate: '2020-03-23'
    },
    {
        id: 'nbfc-2018',
        name: 'NBFC Crisis (2018)',
        description: 'Liquidity crunch in Indian shadow banking.',
        startDate: '2018-08-20',
        endDate: '2018-12-31',
        peakDate: '2018-08-28',
        troughDate: '2018-10-23'
    },
    {
        id: 'china-2015',
        name: 'China Meltdown (2015-16)',
        description: 'Global growth fears and US Fed rate hike jitters.',
        startDate: '2015-03-01',
        endDate: '2016-03-31',
        peakDate: '2015-03-03',
        troughDate: '2016-02-11'
    },
    {
        id: 'taper-2013',
        name: 'Taper Tantrum (2013)',
        description: 'Sudden spike in US Treasury yields causing EM sell-off.',
        startDate: '2013-05-15',
        endDate: '2013-09-30',
        peakDate: '2013-05-21',
        troughDate: '2013-08-21'
    },
    {
        id: 'euro-2011',
        name: 'Eurozone Crisis (2011)',
        description: 'Greek debt default fears and domestic inflation pain.',
        startDate: '2010-11-01',
        endDate: '2011-12-31',
        peakDate: '2010-11-05',
        troughDate: '2011-12-20'
    },
    {
        id: 'gfc-2008',
        name: 'Global Fin Crisis (2008)',
        description: 'The sharpest drawdown in Nifty history (Lehman collapse).',
        startDate: '2008-01-01',
        endDate: '2009-03-31',
        peakDate: '2008-01-08',
        troughDate: '2008-10-27'
    },
    {
        id: 'dotcom-2000',
        name: 'Dot-Com Burst (2000-01)',
        description: 'Tech bubble collapse followed by 9/11 events.',
        startDate: '2000-02-11',
        endDate: '2001-10-31',
        peakDate: '2000-02-11',
        troughDate: '2001-09-21'
    },
    {
        id: 'inflation-2022',
        name: 'Inflation / Hikes (2022)',
        description: 'Correction due to global inflation and war in Ukraine.',
        startDate: '2021-10-15',
        endDate: '2022-07-31',
        peakDate: '2021-10-18',
        troughDate: '2022-06-17'
    }
];

export default function StressTestPage() {
    const [selectedFunds, setSelectedFunds] = useState([]);
    const [weights, setWeights] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [allFunds, setAllFunds] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [fundData, setFundData] = useState({});
    const [activeScenario, setActiveScenario] = useState(CRASH_SCENARIOS[0]);
    const [loading, setLoading] = useState(false);

    // Preload fund list for search
    useEffect(() => {
        fetch('https://api.mfapi.in/mf')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAllFunds(data);
            })
            .catch(() => { });
    }, []);

    // Search logic
    useEffect(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q || q.length < 2) {
            setSearchResults([]);
            return;
        }
        const words = q.split(/\s+/);
        const results = allFunds.filter(fund => {
            const name = (fund.schemeName || '').toLowerCase();
            return words.every(w => name.includes(w));
        }).slice(0, 10);
        setSearchResults(results);
    }, [searchQuery, allFunds]);

    const addFund = async (fund) => {
        if (selectedFunds.length >= 5) return;
        if (selectedFunds.find(f => f.schemeCode === fund.schemeCode)) return;

        const newFunds = [...selectedFunds, fund];
        setSelectedFunds(newFunds);
        setSearchQuery('');
        setSearchResults([]);

        // Default weight: equal distribution
        const newWeight = Math.floor(100 / newFunds.length);
        const updatedWeights = {};
        newFunds.forEach(f => {
            updatedWeights[f.schemeCode] = newWeight;
        });
        // Adjust last one to sum to 100
        const currentSum = Object.values(updatedWeights).reduce((a, b) => a + b, 0);
        if (currentSum !== 100) {
            updatedWeights[newFunds[newFunds.length - 1].schemeCode] += (100 - currentSum);
        }
        setWeights(updatedWeights);

        // Fetch historical data
        setLoading(true);
        try {
            const res = await fetch(`/api/funds/${fund.schemeCode}`);
            if (res.ok) {
                const data = await res.json();
                setFundData(prev => ({ ...prev, [fund.schemeCode]: data }));
            }
        } catch (e) {
            console.error("Failed to fetch fund data", e);
        }
        setLoading(false);
    };

    const removeFund = (code) => {
        const newFunds = selectedFunds.filter(f => f.schemeCode !== code);
        setSelectedFunds(newFunds);
        const nextWeights = { ...weights };
        delete nextWeights[code];
        setWeights(nextWeights);
        setFundData(prev => {
            const n = { ...prev };
            delete n[code];
            return n;
        });
    };

    const handleWeightChange = (code, val) => {
        setWeights(prev => ({ ...prev, [code]: parseInt(val) || 0 }));
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Portfolio Stress Tester</h1>
                <p>See how your fund mix would have survived historical market crashes</p>
            </div>

            <div className="grid grid-3" style={{ alignItems: 'start', gap: 'var(--space-xl)' }}>
                {/* LEFT: Configuration */}
                <div style={{ gridColumn: 'span 1' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>1. Build Your Portfolio</h3>

                        <div className="search-container" style={{ marginBottom: 'var(--space-md)' }}>
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search fund to add..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="search-results-mini card" style={{ padding: 0, marginBottom: 'var(--space-md)', maxHeight: '200px', overflowY: 'auto' }}>
                                {searchResults.map(f => (
                                    <button
                                        key={f.schemeCode}
                                        onClick={() => addFund(f)}
                                        className="search-item-btn"
                                        style={{ width: '100%', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-secondary)', fontSize: '0.85rem' }}
                                    >
                                        {f.schemeName}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="selected-funds-list">
                            {selectedFunds.map((fund, i) => (
                                <div key={fund.schemeCode} className="card" style={{ padding: '12px', marginBottom: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                                            {fund.schemeName}
                                        </span>
                                        <button onClick={() => removeFund(fund.schemeCode)} style={{ color: 'var(--color-negative)', fontSize: '0.8rem' }}>Remove</button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={weights[fund.schemeCode] || 0}
                                            onChange={(e) => handleWeightChange(fund.schemeCode, e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                        <span style={{ fontSize: '0.85rem', width: '40px', textAlign: 'right', fontWeight: 600 }}>{weights[fund.schemeCode]}%</span>
                                    </div>
                                </div>
                            ))}

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px', borderTop: '1px solid var(--border-primary)', marginTop: '8px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Total Weight</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: totalWeight === 100 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                                    {totalWeight}%
                                </span>
                            </div>
                            {totalWeight !== 100 && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-negative)', marginTop: '4px' }}>Total must be exactly 100%</p>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Choose Crash Period</h3>
                            <span className="badge-verified" title="Verified Historical NAVs">TRUE DATA</span>
                        </div>
                        <div className="scenarios-grid">
                            {CRASH_SCENARIOS.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveScenario(s)}
                                    className={`scenario-btn ${activeScenario.id === s.id ? 'active' : ''}`}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        textAlign: 'left',
                                        borderRadius: 'var(--radius-md)',
                                        border: activeScenario.id === s.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-secondary)',
                                        background: activeScenario.id === s.id ? 'var(--accent-primary-soft)' : 'var(--bg-secondary)',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: activeScenario.id === s.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{s.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.2' }}>{s.description}</div>
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-md)', padding: '8px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px dashed var(--border-secondary)' }}>
                            ℹ️ <strong>Reliability Check:</strong> All data is fetched from official historical NAV records via <code>mfapi.in</code>. No simulations or generic models are used.
                        </p>
                    </div>
                </div>

                {/* RIGHT: Display Results */}
                <div style={{ gridColumn: 'span 2' }}>
                    {selectedFunds.length === 0 ? (
                        <div className="card empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
                            <h3>Ready to Stress Test?</h3>
                            <p>Add some funds to your portfolio on the left to see how they would have weathered the {activeScenario.name}.</p>
                        </div>
                    ) : (
                        <div className="animate-slide-up">
                            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{activeScenario.name} Performance</h2>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Simulation from {activeScenario.startDate} to {activeScenario.endDate}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {loading && <span className="animate-pulse" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>Loading historical data...</span>}
                                    </div>
                                </div>

                                <div style={{ height: '400px', marginBottom: 'var(--space-xl)' }}>
                                    <CrashTimeline
                                        funds={selectedFunds}
                                        fundData={fundData}
                                        weights={weights}
                                        scenario={activeScenario}
                                    />
                                </div>

                                <div className="grid grid-3">
                                    <div className="metric-box card" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
                                        <span className="metric-label">Max Portfolio Drawdown</span>
                                        <span className="metric-value color-negative" id="portfolio-max-dd">—</span>
                                    </div>
                                    <div className="metric-box card" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
                                        <span className="metric-label">Estimated Recovery</span>
                                        <span className="metric-value" id="portfolio-recovery">—</span>
                                    </div>
                                    <div className="metric-box card" style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
                                        <span className="metric-label">Volatility (Daily)</span>
                                        <span className="metric-value accent" id="portfolio-vol">—</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Component Analysis</h3>
                                <div className="table-responsive">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Fund Name</th>
                                                <th>Weight</th>
                                                <th style={{ textAlign: 'right' }}>Period Return</th>
                                                <th style={{ textAlign: 'right' }}>Drawdown</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedFunds.map(f => {
                                                const data = fundData[f.schemeCode];
                                                return (
                                                    <tr key={f.schemeCode}>
                                                        <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{f.schemeName}</td>
                                                        <td style={{ fontSize: '0.85rem' }}>{weights[f.schemeCode]}%</td>
                                                        <td style={{ textAlign: 'right', fontSize: '0.85rem' }} className="calc-period-return" data-code={f.schemeCode}>Calculating...</td>
                                                        <td style={{ textAlign: 'right', fontSize: '0.85rem' }} className="calc-period-dd" data-code={f.schemeCode}>Calculating...</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .scenario-btn:hover {
                    border-color: var(--accent-primary) !important;
                }
                .metric-box {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .metric-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    font-weight: 600;
                }
                .metric-value {
                    font-size: 1.4rem;
                    font-weight: 800;
                    font-family: 'Outfit', sans-serif;
                }
                .color-negative { color: var(--color-negative); }
                .accent { color: var(--accent-primary); }
                .scenarios-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding-right: 4px;
                }
                .scenarios-grid::-webkit-scrollbar {
                    width: 4px;
                }
                .scenarios-grid::-webkit-scrollbar-thumb {
                    background: var(--border-primary);
                    border-radius: 10px;
                }
                .badge-verified {
                    font-size: 0.65rem;
                    background: #10b981;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }
            `}</style>
        </div>
    );
}
