'use client';

import { useState, useEffect } from 'react';
import { 
    Search, Info, TrendingUp, Shield, Activity, PieChart, Users, 
    ArrowRight, Save, Trash2, Microscope, Layers, AlertTriangle, 
    Zap, Loader, X, MousePointer2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import MagicSearch from '@/components/MagicSearch';

/**
 * Portfolio Architect (Performance & Risk Engineering)
 */
export default function PortfolioArchitectPage() {
    const [selectedFunds, setSelectedFunds] = useState([]);
    const [weights, setWeights] = useState({});
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeDetailPair, setActiveDetailPair] = useState(null);
    const [activePairIndex, setActivePairIndex] = useState(0);

    // Helpers for dynamic weight distribution
    const handleAddFund = (fund) => {
        if (selectedFunds.length >= 4) return;
        const normalized = { ...fund, name: fund.name || fund.schemeName };
        const id = normalized.schemeCode?.toString() || normalized.name;
        if (selectedFunds.find(f => (f.schemeCode?.toString() || f.name) === id)) return;
        
        const newFunds = [...selectedFunds, normalized];
        const newWeight = Math.floor(100 / newFunds.length);
        const scale = (100 - newWeight) / 100;
        
        const nextWeights = {};
        newFunds.forEach(f => {
            const fid = f.schemeCode?.toString() || f.name;
            if (fid === id) nextWeights[fid] = newWeight;
            else nextWeights[fid] = Math.round((weights[fid] || 0) * scale);
        });

        // 100% Correction
        const total = Object.values(nextWeights).reduce((a, b) => a + b, 0);
        if (total !== 100) nextWeights[id] += (100 - total);

        setSelectedFunds(newFunds);
        setWeights(nextWeights);
    };

    const removeFund = (id) => {
        const remaining = selectedFunds.filter(f => (f.schemeCode?.toString() || f.name) !== id);
        if (remaining.length === 0) {
            setSelectedFunds([]);
            setWeights({});
            return;
        }
        const removedW = weights[id] || 0;
        const scale = 100 / (100 - removedW);
        const nextWeights = {};
        remaining.forEach(f => {
            const rid = f.schemeCode?.toString() || f.name;
            nextWeights[rid] = Math.round((weights[rid] || 0) * scale);
        });
        const total = Object.values(nextWeights).reduce((a, b) => a + b, 0);
        if (total !== 100) nextWeights[remaining[0].schemeCode?.toString() || remaining[0].name] += (100 - total);
        
        setSelectedFunds(remaining);
        setWeights(nextWeights);
    };

    const updateWeight = (id, val) => {
        const v = parseInt(val) || 0;
        const others = selectedFunds.filter(f => (f.schemeCode?.toString() || f.name) !== id);
        if (others.length === 0) return setWeights({ [id]: 100 });

        const remaining = 100 - v;
        const currentOtherTotal = others.reduce((s, f) => s + (weights[f.schemeCode?.toString() || f.name] || 0), 0);
        
        const next = { ...weights, [id]: v };
        others.forEach(f => {
            const oid = f.schemeCode?.toString() || f.name;
            next[oid] = currentOtherTotal === 0 ? Math.floor(remaining / others.length) : Math.round(((weights[oid] || 0) / currentOtherTotal) * remaining);
        });

        const total = Object.values(next).reduce((a, b) => a + b, 0);
        if (total !== 100) next[others[0].schemeCode?.toString() || others[0].name] += (100 - total);
        setWeights(next);
    };

    const analyzePortfolio = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/portfolio/x-ray', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    funds: selectedFunds, 
                    weights 
                })
            });
            if (!res.ok) throw new Error("Simulation failed. Server unreachable.");
            const data = await res.json();
            setResults(data.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    // Venn Diagram SVG Component (Institutional v4 - High Conviction Massive Scaling)
    const VennDiagram = ({ overlapPercentage, colorA = "#6366f1", colorB = "#8b5cf6" }) => {
        const radius = 100;
        const centerOffset = (1 - (overlapPercentage / 100)) * (radius * 0.85);
        const svgWidth = 600;
        const svgHeight = 320;
        
        return (
            <div className="relative flex flex-col items-center justify-center p-6 bg-[var(--bg-tertiary)]/30 rounded-[4rem] border border-[var(--border-primary)] shadow-inner w-full max-w-2xl mx-auto overflow-hidden">
                <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="drop-shadow-4xl transition-all duration-1000 hover:scale-110 will-change-transform">
                    <defs>
                        <linearGradient id="gradA" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colorA} stopOpacity="0.6" />
                            <stop offset="100%" stopColor={colorA} stopOpacity="0.2" />
                        </linearGradient>
                        <linearGradient id="gradB" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colorB} stopOpacity="0.6" />
                            <stop offset="100%" stopColor={colorB} stopOpacity="0.2" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    
                    {/* Strategy Circles */}
                    <circle cx={300 - centerOffset} cy={160} r={radius} fill="url(#gradA)" stroke={colorA} strokeWidth="3" strokeDasharray="12 6" className="animate-pulse" />
                    <circle cx={300 + centerOffset} cy={160} r={radius} fill="url(#gradB)" stroke={colorB} strokeWidth="3" strokeDasharray="12 6" style={{ animationDelay: '1.5s' }} className="animate-pulse" />
                    
                    {/* Dynamic Intersection Badge */}
                    <g transform={`translate(${300 - 45}, ${160 - 22})`}>
                        <rect width="90" height="44" rx="22" fill="var(--bg-primary)" filter="url(#glow)" stroke="var(--border-primary)" strokeWidth="1.5" />
                        <text x="45" y="28" fontSize="18" fontWeight="950" fill="var(--text-primary)" textAnchor="middle" className="tracking-tighter font-serif">
                            {overlapPercentage}%
                        </text>
                    </g>
                    
                    {/* Labels Positioning */}
                    <text x={300 - centerOffset} y={160 - radius - 25} fontSize="12" fontWeight="900" fill="var(--text-secondary)" textAnchor="middle" className="uppercase tracking-[0.3em] opacity-60">Manager Alpha A</text>
                    <text x={300 + centerOffset} y={160 - radius - 25} fontSize="12" fontWeight="900" fill="var(--text-secondary)" textAnchor="middle" className="uppercase tracking-[0.3em] opacity-60">Manager Alpha B</text>
                    <text x="300" y={160 + radius + 35} fontSize="10" fontWeight="800" fill="var(--accent-primary)" textAnchor="middle" className="uppercase tracking-[0.5em] opacity-40">Forensic Intersection Architecture</text>
                </svg>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] pb-20 pt-20 font-sans selection:bg-indigo-500/30">
            {/* Glass Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-2xl border-b border-[var(--border-primary)] py-3 px-6 h-16 flex items-center">
                <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Microscope size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter text-[var(--text-primary)] leading-none">Portfolio Architect</h1>
                            <p className="text-[9px] uppercase tracking-[0.3em] text-indigo-400 font-black mt-1">Institutional Factsheet Engine</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {results && (
                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-tertiary)] rounded-full border border-[var(--border-primary)]">
                                <Activity size={12} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-[var(--text-primary)]">Efficiency: {results.mixtureStats?.efficiencyScore}%</span>
                            </div>
                        )}
                        <button onClick={() => window.location.href = '/portfolio'} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">Close Lab</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Dashboard Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <h2 className="text-5xl font-black text-[var(--text-primary)] mb-4 tracking-tighter italic">Portfolio <span className="text-indigo-500">Architect</span></h2>
                        <p className="text-[var(--text-muted)] text-lg leading-relaxed font-medium">
                            Synthesizing high-conviction strategies into a singular efficiency frontier. Our engine identifies structural redundancies and sector-level imbalances in real-time.
                        </p>
                    </div>

                    {results && (
                        <div className="bg-gradient-to-br from-[var(--bg-card)] to-transparent border border-[var(--border-primary)] rounded-[2.5rem] p-8 flex items-center gap-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative w-28 h-28 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[var(--border-primary)]/30" />
                                    <circle 
                                        cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                        strokeDasharray={301.5}
                                        strokeDashoffset={301.5 - (301.5 * (results.mixtureStats?.efficiencyScore || 0) / 100)}
                                        className="text-indigo-500 transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute text-3xl font-black text-[var(--text-primary)]">{results.mixtureStats?.efficiencyScore || 0}</span>
                            </div>
                            <div className="max-w-[160px]">
                                <h4 className="text-[10px] uppercase tracking-widest text-indigo-400 font-black mb-1">Efficiency Score</h4>
                                <p className="text-xs text-[var(--text-muted)] leading-tight">
                                    {results.mixtureStats?.efficiencyScore > 75 ? 'Optimal structural balance.' : 'High redundancy detected.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Control Bench */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 shadow-2xl sticky top-24">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                    <Layers size={20} className="text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Active Bench</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {selectedFunds.map(fund => {
                                        const key = fund.schemeCode?.toString() || fund.name;
                                        return (
                                            <div key={key} className="p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30 hover:bg-[var(--bg-tertiary)]/50 transition-all group">
                                                <div className="flex justify-between items-start gap-4 mb-4">
                                                    <span className="text-xs font-bold text-[var(--text-primary)] leading-tight flex-1">{fund.name}</span>
                                                    <button onClick={() => removeFund(key)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="range" min="0" max="100" 
                                                        value={weights[key] || 0}
                                                        onChange={(e) => updateWeight(key, e.target.value)}
                                                        className="flex-1 h-1 bg-[var(--border-primary)] rounded-full appearance-none cursor-pointer accent-indigo-500"
                                                    />
                                                    <span className="text-xs font-black text-indigo-500 w-8">{weights[key] || 0}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedFunds.length < 4 && (
                                    <div className="pt-2">
                                        <MagicSearch 
                                            onSelect={handleAddFund} 
                                            placeholder="Add fund to bench..."
                                            className="bg-black/40 border-white/5 rounded-2xl p-4 text-sm"
                                        />
                                    </div>
                                )}

                                <div className={`p-5 rounded-2xl border border-dashed transition-all ${
                                    totalWeight === 100 ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-amber-500/30 bg-amber-500/5 text-amber-400'
                                }`}>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span>Allocated Budget</span>
                                        <span>{totalWeight}% / 100%</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={analyzePortfolio}
                                    disabled={loading || totalWeight !== 100 || selectedFunds.length < 2}
                                    className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-[2rem] font-black transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 group"
                                >
                                    {loading ? <Loader className="animate-spin" size={20} /> : <> <Zap size={20} className="fill-white" /> <span>Execute Portfolio X-Ray</span> </>}
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Institutional Intelligence Engine Results */}
                    <section className="lg:col-span-8 space-y-8">
                        {loading ? (
                            <div className="space-y-8 animate-pulse pt-4">
                                <div className="h-48 bg-white/[0.02] rounded-[2.5rem] border border-white/10" />
                                <div className="h-64 bg-white/[0.02] rounded-[2.5rem] border border-white/10" />
                                <div className="grid grid-cols-2 gap-4"><div className="h-40 bg-white/[0.02] rounded-[2.5rem]" /><div className="h-40 bg-white/[0.02] rounded-[2.5rem]" /></div>
                            </div>
                        ) : results ? (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                
                                {/* 1. Institutional Portfolio DNA (Heatmap + Stats) */}
                                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-1 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 pointer-events-none"></div>
                                    <div className="p-10">
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                                        <Activity size={20} className="text-indigo-400" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">Institutional Portfolio DNA</h3>
                                                </div>
                                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Aggregate Mixture Intelligence</p>
                                            </div>
                                            
                                            <div className="flex gap-4">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Alpha</p>
                                                    <p className={`text-3xl font-black tracking-tighter ${results.mixtureStats.alpha > 0 ? 'text-[var(--text-primary)]' : 'text-red-400'}`}>
                                                        {results.mixtureStats.alpha > 0 ? '+' : ''}{results.mixtureStats.alpha.toFixed(1)}%
                                                    </p>
                                                </div>
                                                <div className="w-px h-12 bg-[var(--border-primary)]"></div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Efficiency Score</p>
                                                    <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{(100 - results.mixtureStats.expense * 10).toFixed(0)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                            {/* Visual Heatmap Column */}
                                            <div className="lg:col-span-2 space-y-6">
                                                <div className="flex h-44 w-full rounded-[2rem] overflow-hidden shadow-inner border-4 border-[var(--bg-tertiary)] bg-[var(--bg-tertiary)]">
                                                    <div className="h-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex flex-col items-center justify-center relative group transition-all duration-700 hover:brightness-110" style={{ width: `${results.mixtureStats.large}%` }}>
                                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <span className="text-3xl font-black text-white tracking-tighter">{results.mixtureStats.large.toFixed(0)}%</span>
                                                        <span className="text-[9px] uppercase font-black text-indigo-200 tracking-[0.3em] mt-1">Large Cap</span>
                                                    </div>
                                                    <div className="h-full bg-gradient-to-br from-violet-500 to-violet-700 flex flex-col items-center justify-center border-x-4 border-[var(--bg-tertiary)] relative group transition-all duration-700 hover:brightness-110" style={{ width: `${results.mixtureStats.mid}%` }}>
                                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <span className="text-3xl font-black text-white tracking-tighter">{results.mixtureStats.mid.toFixed(0)}%</span>
                                                        <span className="text-[9px] uppercase font-black text-violet-200 tracking-[0.3em] mt-1">Mid Cap</span>
                                                    </div>
                                                    <div className="h-full bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 flex flex-col items-center justify-center relative group transition-all duration-700 hover:brightness-110" style={{ width: `${results.mixtureStats.small}%` }}>
                                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <span className="text-3xl font-black text-white tracking-tighter">{results.mixtureStats.small.toFixed(0)}%</span>
                                                        <span className="text-[9px] uppercase font-black text-fuchsia-200 tracking-[0.3em] mt-1">Small Cap</span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] italic text-center uppercase tracking-[0.4em] opacity-60">Interactive Market Exposure Architecture</p>
                                            </div>

                                            {/* Core Metrics Column */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between group hover:border-indigo-500/30 transition-colors shadow-sm">
                                                    <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">Mixture PE</p>
                                                    <p className="text-2xl font-black text-[var(--text-primary)] mt-2">{results.mixtureStats.pe.toFixed(1)}<span className="text-xs ml-1 opacity-40">x</span></p>
                                                </div>
                                                <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between group hover:border-violet-500/30 transition-colors shadow-sm">
                                                    <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">Mixture PB</p>
                                                    <p className="text-2xl font-black text-[var(--text-primary)] mt-2">{results.mixtureStats.pb.toFixed(1)}<span className="text-xs ml-1 opacity-40">x</span></p>
                                                </div>
                                                <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between group hover:border-emerald-500/30 transition-colors shadow-sm">
                                                    <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">Op. Expense</p>
                                                    <p className="text-2xl font-black text-emerald-500 mt-2">{results.mixtureStats.expense.toFixed(2)}<span className="text-xs ml-1 opacity-40">%</span></p>
                                                </div>
                                                <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between group hover:border-blue-500/30 transition-colors shadow-sm">
                                                    <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">Risk Alpha</p>
                                                    <p className={`text-2xl font-black mt-2 ${results.mixtureStats.alpha > 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                                                        {results.mixtureStats.alpha > 0 ? '+' : ''}{results.mixtureStats.alpha.toFixed(1)}<span className="text-xs ml-1 opacity-40">%</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                 {/* 2. Overlap & Pro Verdict Section */}
                                <div className="space-y-8">
                                    {/* Pairwise Navigator Integration */}
                                    <div className="bg-[var(--bg-tertiary)]/30 p-2 rounded-[2.5rem] border border-[var(--border-primary)] shadow-sm">
                                        <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-primary)]/50 mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--text-primary)]">Strategy Comparison Matrix</h3>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-4 py-1.5 rounded-full uppercase tracking-widest">{activePairIndex + 1} / {results.overlapMatrix.length} PAIRS</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 overflow-x-auto p-3 no-scrollbar">
                                            {results.overlapMatrix.map((pair, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => setActivePairIndex(idx)}
                                                    className={`flex-shrink-0 px-10 py-5 rounded-3xl border transition-all duration-500 flex flex-col items-center justify-center gap-1.5 group relative overflow-hidden ${
                                                        activePairIndex === idx 
                                                        ? "bg-[var(--bg-card)] border-indigo-500/50 text-[var(--text-primary)] shadow-2xl scale-[1.02]" 
                                                        : "bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-card)]/50 hover:border-[var(--border-primary)]"
                                                    }`}
                                                >
                                                    {activePairIndex === idx && (
                                                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                                                    )}
                                                    <span className="text-[11px] font-black tracking-tight whitespace-nowrap uppercase">
                                                        {pair.fund1.split(' ').slice(0, 2).join(' ')}
                                                    </span>
                                                    <span className="text-[9px] font-black opacity-20 uppercase tracking-[0.3em]">vs</span>
                                                    <span className="text-[11px] font-black tracking-tight whitespace-nowrap uppercase">
                                                        {pair.fund2.split(' ').slice(0, 2).join(' ')}
                                                    </span>
                                                    {activePairIndex === idx && (
                                                        <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Focused Pair Diagnostic View */}
                                    {results.overlapMatrix?.[activePairIndex] && (() => {
                                        const pair = results.overlapMatrix[activePairIndex];
                                        return (
                                            <div key={activePairIndex} className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch animate-in zoom-in-95 duration-700">
                                                <div className="flex flex-col gap-6">
                                                    <div className="bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-primary)] p-16 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl transition-all hover:border-indigo-500/20">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
                                                        <VennDiagram overlapPercentage={pair.overlap} />
                                                        <div className="mt-16 text-center space-y-3">
                                                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
                                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Structural Analysis</span>
                                                            </div>
                                                            <p className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">{pair.overlap}%</p>
                                                            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-muted)] font-black">Strategic Redundancy Index</p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-primary)] p-8 shadow-xl">
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center gap-3">
                                                                <Activity size={18} className="text-indigo-400" />
                                                                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Exposure Proof</h4>
                                                            </div>
                                                            <button 
                                                                onClick={() => setActiveDetailPair(pair)}
                                                                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                                            >
                                                                View Documentation
                                                            </button>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {(pair.common || []).slice(0, 3).map((st, sIdx) => (
                                                                <div key={sIdx} className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/50 rounded-2xl border border-[var(--border-primary)]">
                                                                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tighter">{st.stock}</span>
                                                                    <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md">{(st.overlap || 0).toFixed(2)}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-primary)] p-10 shadow-2xl flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-8">
                                                            <Shield size={20} className="text-emerald-400" />
                                                            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Algorithm Verdict</h4>
                                                        </div>
                                                        <div className="p-8 rounded-[2rem] bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] italic font-semibold text-lg text-[var(--text-primary)] leading-relaxed mb-6">
                                                            "{pair.verdict}"
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className={`p-5 rounded-2xl border ${pair.overlap > 55 ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${pair.overlap > 55 ? 'text-red-400' : 'text-emerald-400'}`}>Strategic Implication</p>
                                                                <p className="text-sm text-[var(--text-primary)] font-medium">
                                                                    {pair.overlap > 55 
                                                                        ? "Critical concentration detected. This setup leads to massive manager overlap without significant alpha differentiation."
                                                                        : "Strong diversification balance. Funds maintain unique alpha-generation corridors with manageable commonality."}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="pt-8 border-t border-[var(--border-primary)] flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                        <span>Institutional Agent v4.2</span>
                                                        <div className="flex -space-x-3">
                                                            <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-card)] bg-indigo-500 flex items-center justify-center text-white">A</div>
                                                            <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-card)] bg-violet-600 flex items-center justify-center text-white">B</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* 3. Risk Concentration & Sector Architecture */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Sector View */}
                                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2.5rem] p-10 shadow-2xl">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                                <PieChart size={20} className="text-indigo-400" />
                                            </div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Sector Architecture</h3>
                                        </div>
                                        <div className="space-y-6">
                                            {results.mixtureStats.sectors.slice(0, 6).map((sec, i) => (
                                                <div key={i} className="group">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-xs font-bold text-[var(--text-muted)] tracking-tight">{sec.sector}</span>
                                                        <span className="text-xs font-black text-[var(--text-primary)]">{sec.percentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-[var(--border-primary)]/20 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${sec.percentage > 25 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                                            style={{ width: `${sec.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Risks & Benchmarks */}
                                    <div className="space-y-8">
                                        {results.mixtureStats.risks.length > 0 ? (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-8 backdrop-blur-3xl">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <AlertTriangle size={24} className="text-red-500" />
                                                    <h3 className="text-xl font-black text-red-500 tracking-tight">Concentration Risks</h3>
                                                </div>
                                                <div className="space-y-4">
                                                    {results.mixtureStats.risks.map((risk, idx) => (
                                                        <div key={idx} className="bg-black/30 p-5 rounded-2xl border border-red-500/10 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black text-red-400 tracking-widest mb-1">Extreme Exposure</p>
                                                                <p className="text-sm font-bold text-white">{risk.sector}</p>
                                                            </div>
                                                            <span className="text-2xl font-black text-red-500">{risk.percentage.toFixed(0)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-8 h-full flex flex-col items-center justify-center text-center">
                                                <CheckCircle2 size={48} className="text-emerald-500 mb-4 opacity-50" />
                                                <p className="text-lg font-black text-emerald-500 uppercase tracking-widest mb-2">Portfolio Healthy</p>
                                                <p className="text-xs text-emerald-400/60 font-medium">No extreme concentration flags detected in this mixture.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[600px] border-2 border-dashed border-[var(--border-primary)] rounded-[3.5rem] flex flex-col items-center justify-center gap-8 group bg-[var(--bg-tertiary)]/10">
                                <div className="p-10 bg-[var(--bg-card)] rounded-full border border-[var(--border-primary)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-xl">
                                    <Activity className="w-16 h-16 text-indigo-500" />
                                </div>
                                <div className="text-center space-y-4 max-w-sm px-10">
                                    <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic">Awaiting Synthesis</p>
                                    <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">Add at least two strategic benchmarks to the lab and initiate the Institutional Factsheet Engine to generate structural evidence.</p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Forensic Detail Dossier Modal */}
            {activeDetailPair && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setActiveDetailPair(null)} />
                    <div className="relative w-full max-w-6xl bg-[var(--bg-primary)] rounded-[4.5rem] border border-[var(--border-primary)] shadow-3xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                        
                        {/* Dossier Header */}
                        <div className="p-12 border-b border-[var(--border-primary)]/50 flex justify-between items-center bg-gradient-to-b from-[var(--bg-tertiary)]/30 to-transparent">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                        <Database size={24} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic">Forensic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Intersection Dossier</span></h3>
                                </div>
                                <div className="flex items-center gap-2 overflow-hidden px-4 py-2 rounded-2xl bg-black/20 border border-[var(--border-primary)] w-fit backdrop-blur-xl">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">{activeDetailPair?.fund1 || "Strategy Alpha"}</span>
                                    <span className="text-[9px] text-[var(--text-muted)] font-black uppercase opacity-30 px-1">⬌</span>
                                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest leading-none">{activeDetailPair?.fund2 || "Strategy Beta"}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveDetailPair(null)} 
                                className="w-16 h-16 bg-[var(--bg-tertiary)] hover:bg-black rounded-3xl border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all shadow-xl group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>

                        {/* Dossier Body */}
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                                <div className="md:col-span-1 bg-gradient-to-br from-indigo-600/10 to-transparent rounded-[3rem] border border-indigo-500/20 p-10 flex flex-col items-center justify-center shadow-inner relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-[2s]"></div>
                                    <p className="text-[10px] uppercase font-black text-indigo-400 tracking-[0.3em] mb-4 relative z-10">Redundancy</p>
                                    <p className="text-7xl font-black text-[var(--text-primary)] tracking-[-0.05em] relative z-10">{(activeDetailPair?.overlap || 0).toFixed(1)}<span className="text-xl text-indigo-500/50 -ml-1">%</span></p>
                                </div>
                                <div className="md:col-span-3 bg-[var(--bg-tertiary)]/20 rounded-[3rem] border border-[var(--border-primary)] p-12 flex items-center gap-10 relative overflow-hidden backdrop-blur-3xl group">
                                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                                    <div className="w-16 h-16 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center border border-[var(--border-primary)] shadow-2xl relative z-10 shrink-0">
                                        <ShieldCheck size={32} className="text-indigo-400" />
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-2">Structural Intelligence Insight</h4>
                                        <p className="text-sm text-[var(--text-muted)] font-medium leading-loose max-w-2xl italic tracking-wide">
                                            The Structural Redundancy Index for this pair indicates a minimum common investment of <span className="text-indigo-400 font-bold">{(activeDetailPair?.overlap || 0).toFixed(1)}%</span> across all underlying tickers. Portfolios exceeding 45% overlap typically signify internal cannibalization, diminishing the potential for risk-adjusted alpha generation.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <ListTree size={16} className="text-emerald-400" />
                                        </div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Security Intersection Breakdown</h4>
                                    </div>
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Showing Top {activeDetailPair?.common?.length || 0} Holdings</span>
                                </div>
                                
                                <div className="bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-primary)] overflow-hidden shadow-3xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-tertiary)]/50 text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.3em] border-b border-[var(--border-primary)]/50">
                                                <th className="px-12 py-8">Ticker Intelligence</th>
                                                <th className="px-12 py-8 text-indigo-400/80">Strategy Alpha %</th>
                                                <th className="px-12 py-8 text-violet-400/80">Strategy Beta %</th>
                                                <th className="px-12 py-8 text-emerald-400">Net Redundancy %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)]/30">
                                            {(activeDetailPair?.common || []).map((st, si) => (
                                                <tr key={si} className="hover:bg-indigo-500/[0.03] transition-all duration-300 group">
                                                    <td className="px-12 py-7">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[13px] font-black text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{st.stock}</span>
                                                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic opacity-40">Verified Institutional Security</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-7 text-xs text-[var(--text-secondary)] font-black tracking-tight italic opacity-60">{(st.percA || 0).toFixed(2)}%</td>
                                                    <td className="px-12 py-7 text-xs text-[var(--text-secondary)] font-black tracking-tight italic opacity-60">{(st.percB || 0).toFixed(2)}%</td>
                                                    <td className="px-12 py-7">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-24 h-1.5 bg-[var(--border-primary)]/20 rounded-full overflow-hidden shrink-0">
                                                                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${(st.overlap || 0) * 10}%` }}></div>
                                                            </div>
                                                            <span className="text-[11px] font-black text-emerald-400 tracking-widest">
                                                                {(st.overlap || 0).toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Dossier Footer */}
                        <div className="p-10 border-t border-[var(--border-primary)]/50 bg-[var(--bg-tertiary)]/40 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.2em] italic">
                                    Verified Data Stream • Factsheet Hub Engine v5.1.2 • <span className="text-indigo-400">Institutional Access</span>
                                </p>
                            </div>
                            <button onClick={() => window.print()} className="px-8 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-black transition-all shadow-xl flex items-center gap-2">
                                <Activity size={14} /> Export Technical Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;700;900&display=swap');
                body { font-family: 'Outfit', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 10px; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: var(--bg-primary); }
                ::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 3px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
