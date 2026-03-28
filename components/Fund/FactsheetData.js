'use client';
import React, { useState, useEffect } from 'react';

export default function FactsheetData({ schemeCode }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFactsheet();
    }, [schemeCode]);

    async function fetchFactsheet() {
        try {
            const res = await fetch(`/api/factsheets/fund?schemeCode=${schemeCode}`);
            if (!res.ok) throw new Error('Not found');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.warn(`[Factsheet] Silent failure for ${schemeCode}:`, err.message);
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return null; // Silent loading
    if (!data || (!data.holdings?.length && !data.sectors?.length)) return null; // Silent failure

    // Helper to format percentages
    const formatPct = (val) => {
        if (val == null) return '0.00%';
        return parseFloat(val).toFixed(2) + '%';
    };

    return (
        <div className="mt-16 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            
            {/* ── Header Area ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-800/50 px-2">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                            <div className="w-2 h-8 bg-teal-500 rounded-full opacity-50 translate-y-1"></div>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Portfolio Intelligence</h2>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.1em]">Scraper Engine V4</span>
                        </div>
                        <span className="text-zinc-700 text-xs hidden md:inline">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Last Sync:</span>
                            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.1em] bg-emerald-500/5 px-2 py-1 rounded-md">
                                {new Date(data.lastChecked).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-2xl border border-zinc-800/30 backdrop-blur-lg">
                    {data.expenseRatio != null && (
                        <div className="px-5 py-2 text-center">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Expense Ratio (regular)</div>
                            <div className="text-xl text-white font-mono font-bold">{formatPct(data.expenseRatio)}</div>
                        </div>
                    )}
                    {data.marketCap?.avgMcap && (
                        <>
                            <div className="w-px h-8 bg-zinc-800/50 mx-1"></div>
                            <div className="px-5 py-2 text-center">
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Avg Market Cap</div>
                                <div className="text-xl text-emerald-400 font-mono font-bold">₹{Math.round(data.marketCap.avgMcap / 100).toLocaleString()} Cr</div>
                            </div>
                        </>
                    )}
                    {data.marketCap?.pe != null && Number(data.marketCap.pe) > 0 && (
                        <>
                            <div className="w-px h-8 bg-zinc-800/50 mx-1"></div>
                            <div className="px-5 py-2 text-center">
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">P/E Ratio</div>
                                <div className="text-xl text-indigo-400 font-mono font-bold">{Number(data.marketCap.pe).toFixed(2)}</div>
                            </div>
                        </>
                    )}
                    {data.marketCap?.pb != null && Number(data.marketCap.pb) > 0 && (
                        <>
                            <div className="w-px h-8 bg-zinc-800/50 mx-1"></div>
                            <div className="px-5 py-2 text-center">
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">P/B Ratio</div>
                                <div className="text-xl text-violet-400 font-mono font-bold">{Number(data.marketCap.pb).toFixed(2)}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* 1. TOP HOLDINGS (Glassmorphism) */}
                <div className="xl:col-span-12 group">
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-teal-500/20 bg-gradient-to-br from-zinc-900 to-black p-8 shadow-2xl transition-all duration-500 hover:border-teal-500/40 hover:shadow-teal-500/5">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 blur-[120px] -mr-48 -mt-48"></div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20">
                                        <span className="text-2xl">🏆</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">Prime Equity Holdings</h3>
                                        <p className="text-[10px] text-teal-500/60 font-black uppercase tracking-[0.2em]">Concentrated Strategic Assets</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Top 20 Concentration</div>
                                    <div className="text-2xl font-mono font-black text-teal-400">
                                        {data.holdings.slice(0, 20).reduce((acc, h) => acc + (parseFloat(h.percentage) || 0), 0).toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.holdings.slice(0, 20).map((item, idx) => {
                                    const pct = item.percentage || 0;
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-teal-500/20 transition-all group/item">
                                            <div className="flex items-center gap-4 flex-1 truncate">
                                                <span className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-[10px] font-black text-teal-400 group-hover/item:bg-teal-500 group-hover/item:text-black transition-all">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-[13px] text-zinc-200 font-bold tracking-tight truncate group-hover/item:text-white transition-colors">
                                                        {item.stock}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest opacity-60">
                                                        Equity
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 pl-4 shrink-0">
                                                <div className="h-1.5 w-20 bg-zinc-800/50 rounded-full hidden sm:block overflow-hidden">
                                                    <div 
                                                        className="h-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)] transition-all duration-1000 ease-out"
                                                        style={{ width: `${Math.min(100, pct * 10)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-mono font-black text-teal-400 w-14 text-right">
                                                    {formatPct(pct)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SECTOR ALLOCATION (Glass Emerald) */}
                <div className="xl:col-span-7 group">
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-br from-zinc-900/40 to-black p-8 shadow-2xl transition-all duration-500 hover:border-emerald-500/40">
                        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/5 blur-[100px] -ml-40 -mt-40"></div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                        <span className="text-xl">🏭</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Sector Exposure</h3>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] text-emerald-500/50 font-black uppercase tracking-[0.3em]">Industry Spread</span>
                                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest bg-zinc-800/20 px-1.5 py-0.5 rounded border border-zinc-800/30">Based on Full Portfolio</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {data.sectors.map((item, idx) => {
                                    const pct = item.percentage || 0;
                                    return (
                                        <div key={idx} className="space-y-2 group/sec">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight group-hover/sec:text-emerald-400 transition-colors">
                                                    {item.sector}
                                                </span>
                                                <span className="text-[11px] font-mono font-black text-emerald-500">
                                                    {formatPct(pct)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-in-out"
                                                    style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. ASSET ALLOCATION (Violet Glass) */}
                <div className="xl:col-span-5 space-y-8">
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-violet-500/20 bg-gradient-to-br from-zinc-900/40 to-black p-8 shadow-2xl transition-all duration-500 hover:border-violet-500/40">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/5 blur-[80px] -mr-32 -mb-32"></div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4 border-b border-violet-500/10 pb-6">
                                <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20">
                                    <span className="text-xl">🧩</span>
                                </div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Market Cap Split</h3>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { category: 'Large Cap', percentage: data.marketCap?.large },
                                    { category: 'Mid Cap', percentage: data.marketCap?.mid },
                                    { category: 'Small Cap', percentage: data.marketCap?.small }
                                ].filter(i => i.percentage != null).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl relative group/mix">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">{item.category}</span>
                                            <span className="text-xl font-mono font-black text-violet-400">{formatPct(item.percentage)}</span>
                                        </div>
                                        <div className="w-14 h-14 rounded-full border-2 border-zinc-800/50 flex items-center justify-center relative overflow-hidden backdrop-blur-sm">
                                            <div 
                                                className="absolute inset-0 bg-violet-500/30 transition-all duration-1000"
                                                style={{ height: `${item.percentage}%`, top: `${100 - item.percentage}%` }}
                                            ></div>
                                            <span className="text-[10px] text-white font-black z-10">{Math.round(item.percentage)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-zinc-800/30">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></div>
                    <span className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.2em]">Institutional-Grade Data Feed Active</span>
                </div>
                <div className="flex flex-col md:items-end text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                    <p>• Sector Exposure & industry spread represents the full equity portfolio</p>
                    <p>• Prime Equity Holdings lists the top 20 strategic assets by weight</p>
                </div>
            </div>
        </div>
    );
}
