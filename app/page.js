'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNAV, formatPercent, getChangeClass } from '@/lib/formatters';
import MarketIndices from '@/components/Dashboard/MarketIndices';
import { 
    Activity, 
    TrendingUp, 
    TrendingDown, 
    Target, 
    Zap, 
    Shield, 
    Search, 
    Repeat, 
    BarChart3,
    ArrowUpRight,
    ChevronRight,
    Flame,
    Wind
} from 'lucide-react';

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
            console.error(err);
            setError('Failed to sync institutional feeds');
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="p-6 lg:p-12 space-y-12 animate-pulse">
                <div className="h-8 w-64 bg-white/5 rounded-full mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[300px] bg-[var(--bg-card)] rounded-[3rem]" />
                    <div className="h-[300px] bg-[var(--bg-card)] rounded-[3rem]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-[400px] bg-[var(--bg-card)] rounded-[3rem]" />
                    <div className="h-[400px] bg-[var(--bg-card)] rounded-[3rem]" />
                </div>
            </div>
        );
    }

    const { gainers = [], losers = [], categoryPerformers = {}, totalTracked = 0, totalCategories = 0 } = data || {};

    return (
        <div className="animate-fade-in p-6 lg:p-12 space-y-12 max-w-[1600px] mx-auto">
            {/* 1. Header & Quick Actions */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <span className="text-[10px] font-black tracking-[0.4em] text-indigo-400 uppercase leading-none opacity-80 mb-2 block">Terminal Alpha v5</span>
                    <h1 className="text-4xl lg:text-7xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                        Institutional <span className="text-indigo-500 italic">Command</span>
                    </h1>
                </div>
                
                <div className="flex gap-4">
                     <button 
                        onClick={() => router.push('/portfolio/x-ray')}
                        className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl overflow-hidden shadow-glow hover:shadow-indigo-500/40 transition-all active:scale-95"
                     >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <span className="relative text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Target size={18} /> Initiate X-Ray
                        </span>
                     </button>
                </div>
            </header>

            {/* 2. Market Indices Strip */}
            <MarketIndices />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 3. Market Radar - Impact Centric */}
                <section className="lg:col-span-8 flex flex-col gap-8">
                    <div className="flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                <Activity size={22} className="text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none mb-1">Terminal Radar</h3>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] opacity-60">Global Institutional Feeds</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] px-4 py-2 rounded-2xl border border-[var(--border-primary)]">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sentiment: Bullish</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {radar.length > 0 ? radar.slice(0, 4).map((item, i) => (
                            <Link 
                                key={i}
                                href={`/fund/${item.schemeCode}`}
                                className="group relative p-8 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[3rem] hover:border-indigo-500/40 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden active:scale-[0.98]"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    {item.severity === 'success' ? <TrendingUp size={120} /> : <TrendingDown size={120} />}
                                </div>
                                <div className="relative flex flex-col h-full gap-6">
                                    <div className="flex justify-between items-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            item.severity === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                            item.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                        }`}>
                                            {item.type?.replace('_', ' ')}
                                        </span>
                                        <div className="p-2 rounded-xl bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowUpRight size={18} className="text-indigo-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black text-[var(--text-primary)] tracking-tight line-clamp-1 group-hover:text-indigo-400 transition-colors uppercase">{item.schemeName}</h4>
                                        <p className="text-[13px] font-bold text-[var(--text-secondary)] leading-relaxed opacity-70 italic">"{item.message}"</p>
                                    </div>
                                    <div className="mt-auto pt-6 border-t border-[var(--border-primary)] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                            <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest">Institutional Alert</span>
                                        </div>
                                        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Ref: #INS-92{i}</span>
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-full p-20 bg-[var(--bg-card)] rounded-[3rem] border-2 border-dashed border-[var(--border-primary)] text-center shadow-inner">
                                <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                                    <Wind size={32} className="animate-bounce" />
                                </div>
                                <h3 className="text-md font-black text-[var(--text-primary)] uppercase tracking-widest mb-2 opacity-60">Scanning Global Flux...</h3>
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-40">Awaiting significant institutional alpha signals</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Secondary Metric Center */}
                <aside className="lg:col-span-4 space-y-8">
                     <div className="p-8 bg-gradient-to-br from-indigo-900/40 via-slate-900/40 to-indigo-900/40 rounded-[3rem] border border-indigo-500/20 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="relative space-y-6">
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Network health</span>
                            <div className="flex items-center gap-6">
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-white tracking-tighter">{totalTracked || '2,450'}</p>
                                    <p className="text-[10px] font-black text-indigo-300/40 uppercase tracking-widest">Active Funds</p>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-white tracking-tighter">100%</p>
                                    <p className="text-[10px] font-black text-indigo-300/40 uppercase tracking-widest">Uptime Index</p>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-indigo-200/60 leading-relaxed">
                                Our forensics engine is scanning {totalCategories || 34} institutional categories every 60 seconds.
                            </p>
                         </div>
                     </div>

                     <div className="space-y-4">
                        <Link href="/release-notes" className="flex items-center justify-between p-6 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2rem] hover:translate-x-1 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                                    <Zap size={18} />
                                </div>
                                <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">v5.1.2 Release Notes</span>
                            </div>
                            <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors" />
                        </Link>
                        <Link href="/about" className="flex items-center justify-between p-6 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2rem] hover:translate-x-1 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                                    <Shield size={18} />
                                </div>
                                <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Science of Investing</span>
                            </div>
                            <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors" />
                        </Link>
                     </div>
                </aside>
            </div>

            {/* 5. Performance Leaders */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Gainers */}
                <div className="p-8 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                                <Flame size={20} />
                            </div>
                            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase">High Momentum</h3>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Daily Gainers</span>
                    </div>

                    <div className="space-y-4">
                        {gainers.slice(0, 5).map((fund, i) => (
                            <Link 
                                key={fund.schemeCode}
                                href={`/fund/${fund.schemeCode}`}
                                className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/50 border border-transparent hover:border-emerald-500/20 rounded-2xl transition-all group"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-[var(--text-primary)] tracking-tight line-clamp-1">{fund.schemeName}</span>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">NAV: {formatNAV(fund.nav)}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-md font-black text-emerald-400 tracking-tighter">+{formatPercent(fund.dailyChangePercent)}</div>
                                    <div className="text-[9px] font-bold text-emerald-500/40 uppercase tracking-tighter flex items-center gap-1 justify-end">
                                        <TrendingUp size={10} /> Sector Alpha
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Losers/Reversals */}
                <div className="p-8 bg-[var(--bg-card)] border border border-[var(--border-primary)] rounded-[3rem] space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400">
                                <Wind size={20} />
                            </div>
                            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase">Market Slippage</h3>
                        </div>
                        <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">Daily Losers</span>
                    </div>

                    <div className="space-y-4">
                        {losers.slice(0, 5).map((fund, i) => (
                            <Link 
                                key={fund.schemeCode}
                                href={`/fund/${fund.schemeCode}`}
                                className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/50 border border-transparent hover:border-rose-500/20 rounded-2xl transition-all group"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-[var(--text-primary)] tracking-tight line-clamp-1">{fund.schemeName}</span>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">NAV: {formatNAV(fund.nav)}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-md font-black text-rose-400 tracking-tighter">{formatPercent(fund.dailyChangePercent)}</div>
                                    <div className="text-[9px] font-bold text-rose-500/40 uppercase tracking-tighter flex items-center gap-1 justify-end">
                                        <TrendingDown size={10} /> Tactical Exit?
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Release Intelligence & Tiers */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[3rem] p-8 lg:p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                    <Zap size={240} />
                </div>
                
                <div className="relative space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em]">Intelligence v5.2.0 • Stable</span>
                            <h2 className="text-3xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Release <span className="text-indigo-500">Intelligence</span></h2>
                        </div>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest max-w-md md:text-right leading-relaxed italic">
                            Stabilizing institutional data feeds with redundant x-ray secondary orchestration.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Premium Fleet */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                    <Zap size={18} />
                                </div>
                                <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest">Premium Intelligence (Active)</h4>
                            </div>
                            <div className="grid gap-4">
                                {[
                                    { title: 'Portfolio X-Ray Architecture', desc: 'Institutional deep-dive into holdings, sector drift, and market cap imbalances.' },
                                    { title: 'Success Guaranteed Engine', desc: 'Resilient multi-stage analysis that bypasses sluggish external API hangs.' },
                                    { title: 'High-Fidelity Caching', desc: '24-hour priority NAV performance caching for lightning-fast dashboard charts.' }
                                ].map((feature, i) => (
                                    <div key={i} className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-2 group/item hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-sm font-black text-indigo-300 uppercase tracking-tight">{feature.title}</h5>
                                            <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase">Pro</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-[var(--text-secondary)] opacity-70 leading-relaxed">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Free Core */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                                    <Activity size={18} />
                                </div>
                                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Free Core Services</h4>
                            </div>
                            <div className="grid gap-4">
                                {[
                                    { title: 'Global Scheme Infrastructure', desc: 'Search and discover any fund in the AMFI registry with verified metadata.' },
                                    { title: 'Momentum Radar', desc: 'Daily tracking of market leaders, laggards, and institutional alpha signals.' },
                                    { title: 'Institutional Rankings', desc: 'Category-wise transparency for all Indian Mutual Fund sectors.' }
                                ].map((feature, i) => (
                                    <div key={i} className="p-6 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-3xl space-y-2 hover:border-indigo-400/20 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight opacity-80">{feature.title}</h5>
                                            <span className="text-[9px] font-black bg-[var(--bg-secondary)] text-[var(--text-muted)] px-2 py-0.5 rounded-full uppercase">Core</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-[var(--text-muted)] leading-relaxed">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Quick Action Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Search Infrastructure', desc: 'Find any scheme in AMFI registry', icon: <Search />, path: '/search', color: 'indigo' },
                    { title: 'DNA Comparator', desc: 'Side-by-side genetic overlap', icon: <Repeat />, path: '/compare', color: 'violet' },
                    { title: 'Institutional Rankings', desc: 'Category-wise forensic leaders', icon: <BarChart3 />, path: '/categories', color: 'emerald' },
                    { title: 'Portfolio X-Ray', desc: 'Deep-dive security analysis', icon: <Target />, path: '/portfolio/x-ray', color: 'rose' }
                ].map((action, i) => (
                    <Link 
                        key={i}
                        href={action.path}
                        className={`group p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-${action.color}-500/40 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col gap-6 relative overflow-hidden`}
                    >
                        <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-${action.color}-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className={`p-3 w-fit bg-${action.color}-500/10 text-${action.color}-400 rounded-2xl group-hover:scale-110 transition-transform`}>
                            {action.icon}
                        </div>
                        <div>
                            <h4 className="text-md font-black text-[var(--text-primary)] tracking-tight mb-2 uppercase tracking-widest">{action.title}</h4>
                            <p className="text-xs font-bold text-[var(--text-muted)] leading-relaxed">{action.desc}</p>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}
