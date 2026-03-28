'use client';

import { useState, useEffect } from 'react';
import { formatNAV, formatPercent, getChangeClass } from '@/lib/formatters';

export default function MarketIndices() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/market-indices')
            .then(res => res.json())
            .then(d => {
                if (d.error) throw new Error(d.error);
                setData(d);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load market indices:', err);
                setError(true);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'var(--bg-card)', padding: 'var(--space-md)', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '8px 0' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ width: '150px', height: '80px', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) return null;

    const coreIndices = data.core || [];
    const asOfDate = coreIndices[0]?.asOfDate || 'Today';

    return (
        <div className="market-pulse-wrapper" style={{ marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🇮🇳</span>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: 0 }}>
                        Market Pulse
                    </h3>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
                    As of: {asOfDate}
                </div>
            </div>
            
            <div className="indices-scroll-container" style={{ 
                display: 'flex', 
                gap: '12px', 
                overflowX: 'auto', 
                paddingBottom: '12px',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
            }}>
                {data.all?.filter(idx => idx.currentLevel > 0).map(index => {
                    const isPositive = index.dailyChangePoints >= 0;
                    const changeClass = getChangeClass(index.dailyChangePercent);
                    
                    return (
                        <div key={index.id} className="index-card" style={{ 
                            minWidth: '180px', 
                            padding: '14px', 
                            background: 'var(--bg-card)', 
                            borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--border-primary)',
                            flexShrink: 0,
                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                            cursor: 'default'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{index.shortName}</span>
                                <span style={{ opacity: 0.6 }}>1Y: {formatPercent(index.roi1Y)}</span>
                            </div>
                            
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                                {index.currentLevel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: 700, 
                                    padding: '2px 6px', 
                                    borderRadius: '6px',
                                    background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: isPositive ? '#10b981' : '#ef4444'
                                }}>
                                    {isPositive ? '▲' : '▼'} {Math.abs(index.dailyChangePoints).toFixed(2)}
                                </span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }} className={changeClass}>
                                    ({isPositive ? '+' : ''}{index.dailyChangePercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .indices-scroll-container::-webkit-scrollbar {
                    display: none;
                }
                .index-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--accent-primary);
                }
            `}</style>
        </div>
    );
}
