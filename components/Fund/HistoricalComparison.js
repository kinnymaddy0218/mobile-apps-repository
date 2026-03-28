'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatNAV, formatPercent, getChangeClass } from '@/lib/formatters';

export default function HistoricalComparison({ schemeCode, fundName, categoryName }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('annual'); // 'annual' or 'quarterly'

    useEffect(() => {
        if (!schemeCode) return;
        setLoading(true);
        fetch(`/api/funds/${schemeCode}/compare`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [schemeCode]);

    if (loading) return <div className="skeleton" style={{ height: '400px', width: '100%' }}></div>;
    if (!data || !data.historical) return null;

    const chartData = data.historical[period] || [];
    const benchmarkName = data.benchmarkName || 'Category Benchmark';

    return (
        <div className="card" style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-md)', overflow: 'hidden' }}>
            <div style={{ padding: '0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Historical Performance v/s {benchmarkName} (%)
                    </h3>
                    <div className="btn-group" style={{ 
                        display: 'flex', 
                        background: 'var(--bg-secondary)', 
                        padding: '4px', 
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-primary)'
                    }}>
                        <button 
                            className={`btn btn-sm ${period === 'annual' ? 'btn-primary' : ''}`}
                            onClick={() => setPeriod('annual')}
                            style={{ padding: '8px 20px', fontSize: '0.85rem', borderRadius: 'var(--radius-md)' }}
                        >
                            Annual
                        </button>
                        <button 
                            className={`btn btn-sm ${period === 'quarterly' ? 'btn-primary' : ''}`}
                            onClick={() => setPeriod('quarterly')}
                            style={{ padding: '8px 20px', fontSize: '0.85rem', borderRadius: 'var(--radius-md)' }}
                        >
                            Quarterly
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ height: '400px', width: '100%', marginTop: 'var(--space-md)' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" />
                        <XAxis 
                            dataKey="period" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            unit="%"
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'var(--bg-card)', 
                                borderColor: 'var(--border-primary)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)'
                            }}
                            itemStyle={{ fontSize: '0.9rem' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Bar 
                            name={fundName} 
                            dataKey="fund" 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]} 
                            barSize={30}
                        />
                        <Bar 
                            name={benchmarkName} 
                            dataKey="benchmark" 
                            fill="#94a3b8" 
                            radius={[4, 4, 0, 0]} 
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Peer Comparison Table */}
            <div style={{ marginTop: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '12px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                        Peers from same category ({data.category})
                    </h4>
                    <Link 
                        href={`/compare?ids=${schemeCode},${(data.peers || []).slice(0, 3).map(p => p.schemeCode).join(',')}`}
                        className="btn btn-sm"
                        style={{ 
                            background: 'var(--accent-primary-soft)', 
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--accent-primary-soft)',
                            borderRadius: 'var(--radius-md)',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                        }}
                    >
                        ⚖️ Compare side-by-side
                    </Link>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Scheme Name</th>
                                <th style={{ textAlign: 'right' }}>1Y Return</th>
                                <th style={{ textAlign: 'right' }}>Bench ROI (1Y)</th>
                                <th style={{ textAlign: 'right' }}>vs Bench (Alpha)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.peers || []).slice(0, 10).map((peer, idx) => {
                                const benchROI = data.benchmarkTTM !== null ? parseFloat(data.benchmarkTTM) : null;
                                    
                                const diff = peer.roi1Y !== 'N/A' && benchROI !== null
                                    ? (parseFloat(peer.roi1Y) - benchROI).toFixed(2)
                                    : 'N/A';
                                
                                return (
                                    <tr key={peer.schemeCode}>
                                        <td style={{ fontWeight: 500 }}>
                                            <Link href={`/fund/${peer.schemeCode}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                                                {peer.schemeName}
                                            </Link>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            <span className={getChangeClass(peer.roi1Y)}>
                                                {peer.roi1Y}%
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                            {benchROI !== null ? `${benchROI.toFixed(2)}%` : '—'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 800 }}>
                                            <span className={getChangeClass(diff)}>
                                                {diff !== 'N/A' ? (diff > 0 ? `+${diff}%` : `${diff}%`) : '—'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
