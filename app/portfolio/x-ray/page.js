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
                                    {loading ? <Loader className="animate-spin" size={20} /> : <> <Zap size={20} className="fill-white" /> <span>Start Simulation</span> </>}
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Simulation Engine Results */}
                    <section className="lg:col-span-8 space-y-8">
                        {loading ? (
                            <div className="space-y-8 animate-pulse pt-4">
                                <div className="h-48 bg-white/[0.02] rounded-[2.5rem] border border-white/10" />
                                <div className="h-64 bg-white/[0.02] rounded-[2.5rem] border border-white/10" />
                                <div className="grid grid-cols-2 gap-4"><div className="h-40 bg-white/[0.02] rounded-[2.5rem]" /><div className="h-40 bg-white/[0.02] rounded-[2.5rem]" /></div>
                            </div>
                        ) : results ? (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                
                                {/* 1. Market Cap HEATMAP */}
                                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                            <MousePointer2 size={20} className="text-blue-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Market Cap Heatmap</h3>
                                    </div>
                                    <div className="flex h-32 w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-primary)] mb-10">
                                        <div className="h-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex flex-col items-center justify-center relative group" style={{ width: `${results.mixtureStats.large}%` }}>
                                            <span className="text-2xl font-black text-white">{results.mixtureStats.large.toFixed(0)}%</span>
                                            <span className="text-[10px] uppercase font-black text-indigo-200 tracking-widest">Large</span>
                                        </div>
                                        <div className="h-full bg-gradient-to-br from-violet-500 to-violet-700 flex flex-col items-center justify-center border-x border-[var(--border-primary)]/30" style={{ width: `${results.mixtureStats.mid}%` }}>
                                            <span className="text-2xl font-black text-white">{results.mixtureStats.mid.toFixed(0)}%</span>
                                            <span className="text-[10px] uppercase font-black text-violet-200 tracking-widest">Mid</span>
                                        </div>
                                        <div className="h-full bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 flex flex-col items-center justify-center" style={{ width: `${results.mixtureStats.small}%` }}>
                                            <span className="text-2xl font-black text-white">{results.mixtureStats.small.toFixed(0)}%</span>
                                            <span className="text-[10px] uppercase font-black text-fuchsia-200 tracking-widest">Small</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="p-5 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                            <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider mb-2">Mixture PE</p>
                                            <p className="text-2xl font-black text-[var(--text-primary)]">{results.mixtureStats.pe.toFixed(1)}x</p>
                                        </div>
                                        <div className="p-5 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                            <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider mb-2">Mixture PB</p>
                                            <p className="text-2xl font-black text-[var(--text-primary)]">{results.mixtureStats.pb.toFixed(1)}x</p>
                                        </div>
                                        <div className="p-5 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                            <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider mb-2">Expense</p>
                                            <p className="text-2xl font-black text-emerald-400">{results.mixtureStats.expense.toFixed(2)}%</p>
                                        </div>
                                        <div className="p-5 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border-primary)]">
                                            <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider mb-2">Alpha vs Nifty</p>
                                            <p className={`text-2xl font-black ${results.mixtureStats.alpha > 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                                                {results.mixtureStats.alpha > 0 ? '+' : ''}{results.mixtureStats.alpha.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Overlap & Pro Verdict Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-orange-500/10 rounded-xl">
                                            <Shield size={20} className="text-orange-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic">Structural Coverage</h3>
                                    </div>

                                    {/* Pairwise Navigator Integration */}
                                    <div className="space-y-12">
                                        {results.overlapMatrix?.length > 1 && (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-primary)]">Strategy Comparison Navigator</h3>
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)]">{activePairIndex + 1} of {results.overlapMatrix.length} Pairwise Combinations</span>
                                                </div>
                                                <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
                                                    {results.overlapMatrix.map((pair, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setActivePairIndex(idx)}
                                                            className={`flex-shrink-0 px-6 py-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                                                                activePairIndex === idx 
                                                                ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-xl shadow-indigo-500/20 scale-105" 
                                                                : "bg-[var(--bg-card)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                                                            }`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${activePairIndex === idx ? "bg-white animate-pulse" : "bg-[var(--border-primary)]"}`}></div>
                                                            <span className="text-[11px] font-black tracking-tight whitespace-nowrap uppercase">
                                                                {pair.fund1.split(' ').slice(0, 2).join(' ')} <span className="opacity-40 px-1 italic">vs</span> {pair.fund2.split(' ').slice(0, 2).join(' ')}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Focused Pair Diagnostic View */}
                                        {results.overlapMatrix?.[activePairIndex] && (() => {
                                            const pair = results.overlapMatrix[activePairIndex];
                                            return (
                                                <div key={activePairIndex} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch animate-in zoom-in-95 duration-500">
                                                    <div className="flex flex-col gap-6">
                                                        <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-primary)] p-12 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-50"></div>
                                                            <VennDiagram overlapPercentage={pair.overlap} />
                                                            <div className="mt-12 text-center relative z-10">
                                                                <p className="text-4xl font-black text-[var(--text-primary)] tracking-tighter mb-2">{pair.overlap}%</p>
                                                                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black">Structural Redundancy Score</p>
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

            {/* Overlap Evidence Modal */}
            {activeDetailPair && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" onClick={() => setActiveDetailPair(null)} />
                    <div className="relative w-full max-w-5xl bg-[var(--bg-primary)] rounded-[4rem] border border-[var(--border-primary)] shadow-3xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in duration-500">
                        {/* Modal Header */}
                        <div className="p-10 border-b border-[var(--border-primary)] flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic">Stock <span className="text-indigo-400 underline decoration-indigo-500/30">Evidence</span></h3>
                                <div className="flex items-center gap-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-tertiary)] px-4 py-1.5 rounded-full border border-[var(--border-primary)] w-fit">
                                    <span className="text-indigo-500">{activeDetailPair?.fund1 || "Strategy A"}</span>
                                    <span className="opacity-40">vs</span>
                                    <span className="text-indigo-500">{activeDetailPair?.fund2 || "Strategy B"}</span>
                                </div>
                            </div>
                            <button onClick={() => setActiveDetailPair(null)} className="p-5 bg-[var(--bg-tertiary)] rounded-full hover:bg-[var(--accent-primary)] hover:text-white text-[var(--text-muted)] transition-all shadow-inner">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                                <div className="md:col-span-1 flex flex-col items-center justify-center bg-[var(--bg-tertiary)]/40 rounded-[2.5rem] border border-[var(--border-primary)] p-8 transform hover:scale-105 transition-all duration-500 shadow-inner">
                                    <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest mb-3">Redundancy</p>
                                    <p className="text-6xl font-black text-indigo-500 tracking-tighter">{(activeDetailPair?.overlap || 0).toFixed(1)}%</p>
                                </div>
                                <div className="md:col-span-3 bg-[var(--bg-tertiary)]/20 rounded-[2.5rem] border border-[var(--border-primary)] p-10 flex items-center gap-8 shadow-sm">
                                    <div className="p-5 bg-indigo-500 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                                        <Info size={24} />
                                    </div>
                                    <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                                        Structural redundancy represents the minimum common weight shared across individual securities. A score above 45% suggests these strategies are structurally synchronized and may not provide meaningful diversification benefits.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-primary)] overflow-hidden shadow-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[var(--bg-tertiary)] text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] border-b border-[var(--border-primary)]">
                                            <th className="px-10 py-6">Security Intelligence</th>
                                            <th className="px-10 py-6 text-indigo-500">Strategy A %</th>
                                            <th className="px-10 py-6 text-violet-500">Strategy B %</th>
                                            <th className="px-10 py-6 text-emerald-500">Mutual Impact %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-primary)]">
                                        {(activeDetailPair?.common || []).map((st, si) => (
                                            <tr key={si} className="hover:bg-indigo-500/5 transition-colors group">
                                                <td className="px-10 py-6">
                                                    <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{st.stock}</p>
                                                </td>
                                                <td className="px-10 py-6 text-xs text-[var(--text-secondary)] font-medium italic">{(st.percA || 0).toFixed(2)}%</td>
                                                <td className="px-10 py-6 text-xs text-[var(--text-secondary)] font-medium italic">{(st.percB || 0).toFixed(2)}%</td>
                                                <td className="px-10 py-6">
                                                    <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                                                        {(st.overlap || 0).toFixed(2)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-10 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/20 text-center">
                            <p className="text-[11px] text-[var(--text-muted)] uppercase font-black tracking-widest italic">
                                Forensic analysis powered by Institutional Factsheet Engine v4.2 • Refinement required for high-frequency strategies
                            </p>
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
