"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import {
  Search,
  Info,
  TrendingUp,
  Shield,
  Activity,
  PieChart,
  Users,
  ArrowRight,
  Save,
  Trash2,
  Microscope,
  Layers,
  AlertTriangle,
  Zap,
  Loader,
  X,
  MousePointer2,
  CheckCircle2,
  ChevronRight,
  Database,
  ShieldCheck,
  ShieldAlert,
  ListTree,
  RefreshCcw,
  Layout,
  Repeat,
  Compass,
  Loader2
} from "lucide-react";
import nextDynamic from "next/dynamic";
import MagicSearch from "@/components/MagicSearch";
import { useAuth } from "@/context/AuthContext";
import PricingModal from "@/components/Portfolio/PricingModal";
import { Lock } from "lucide-react";

// Institutional Recharts Bundle - Dynamic Load
const LineChart = nextDynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = nextDynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = nextDynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = nextDynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = nextDynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = nextDynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = nextDynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const AreaChart = nextDynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = nextDynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const BarChart = nextDynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = nextDynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const Cell = nextDynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });

/**
 * Venn Diagram SVG Component (Institutional v4 - High Conviction Massive Scaling)
 * Standalone to prevent closure issues and optimize React reconciliation.
 */
const VennDiagram = ({
  overlapPercentage,
  colorA = "#6366f1",
  colorB = "#8b5cf6",
}) => {
  const radius = 100;
  const overlap = isNaN(overlapPercentage) ? 0 : overlapPercentage;
  const centerOffset = (1 - Math.min(100, Math.max(0, overlap)) / 100) * (radius * 0.85);
  const svgWidth = 600;
  const svgHeight = 320;
  
  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-[var(--bg-tertiary)]/30 rounded-[4rem] border border-[var(--border-primary)] shadow-inner w-full max-w-2xl mx-auto overflow-hidden">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="drop-shadow-4xl transition-all duration-1000 hover:scale-110 will-change-transform"
      >
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
        <circle
          cx={300 - centerOffset}
          cy={160}
          r={radius}
          fill="url(#gradA)"
          stroke={colorA}
          strokeWidth="3"
          strokeDasharray="12 6"
          className="animate-pulse"
        />
        <circle
          cx={300 + centerOffset}
          cy={160}
          r={radius}
          fill="url(#gradB)"
          stroke={colorB}
          strokeWidth="3"
          strokeDasharray="12 6"
          style={{ animationDelay: "1.5s" }}
          className="animate-pulse"
        />
        {/* Dynamic Intersection Badge */}
        <g transform={`translate(${300 - 45}, ${160 - 22})`}>
          <rect
            width="90"
            height="44"
            rx="22"
            fill="var(--bg-primary)"
            filter="url(#glow)"
            stroke="var(--border-primary)"
            strokeWidth="1.5"
          />
          <text
            x="45"
            y="28"
            fontSize="18"
            fontWeight="950"
            fill="var(--text-primary)"
            textAnchor="middle"
            className="tracking-tighter font-serif"
          >
            {overlapPercentage}%
          </text>
        </g>
        {/* Labels Positioning */}
        <text
          x={300 - centerOffset}
          y={160 - radius - 25}
          fontSize="12"
          fontWeight="900"
          fill="var(--text-secondary)"
          textAnchor="middle"
          className="uppercase tracking-[0.3em] opacity-60"
        >
          Manager Alpha A
        </text>
        <text
          x={300 + centerOffset}
          y={160 - radius - 25}
          fontSize="12"
          fontWeight="900"
          fill="var(--text-secondary)"
          textAnchor="middle"
          className="uppercase tracking-[0.3em] opacity-60"
        >
          Manager Alpha B
        </text>
        <text
          x="300"
          y={160 + radius + 35}
          fontSize="10"
          fontWeight="800"
          fill="var(--accent-primary)"
          textAnchor="middle"
          className="uppercase tracking-[0.5em] opacity-40"
        >
          Forensic Intersection Architecture
        </text>
      </svg>
    </div>
  );
};

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
  const [systemStats, setSystemStats] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [syncingFunds, setSyncingFunds] = useState(new Set());
  const [readyFunds, setReadyFunds] = useState(new Set());
  const { user } = useAuth();
  const isPremium = user?.profile?.isPremium;

  // Fetch System Stats (Persistence Shield Health)
  useEffect(() => {
    fetch("/api/system/stats")
      .then((res) => res.json())
      .then(setSystemStats)
      .catch((err) => console.error("Stats fail:", err));
  }, [selectedFunds]);

  // Helpers for dynamic weight distribution
  const handleAddFund = (fund) => {
    if (selectedFunds.length >= 4) return;
    const normalized = {
      ...fund,
      name: fund.schemeName || fund.name,
      category: fund.category || "Miscellaneous",
      fundHouse: fund.fundHouse || "AMC",
    };
    const id = normalized.schemeCode?.toString() || normalized.name;
    if (selectedFunds.find((f) => (f.schemeCode?.toString() || f.name) === id))
      return;
    const newFunds = [...selectedFunds, normalized];
    const newWeight = Math.floor(100 / newFunds.length);
    const scale = (100 - newWeight) / 100;
    const nextWeights = {};
    newFunds.forEach((f) => {
      const fid = f.schemeCode?.toString() || f.name;
      if (fid === id) nextWeights[fid] = newWeight;
      else nextWeights[fid] = Math.round((weights[fid] || 0) * scale);
    });
    const total = Object.values(nextWeights).reduce((a, b) => a + b, 0);
    if (total !== 100) nextWeights[id] += 100 - total;
    setSelectedFunds(newFunds);
    setWeights(nextWeights);
    setResults(null);
    setError(null);
    setSyncingFunds((prev) => new Set(prev).add(id));
    fetch("/api/funds/warmup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: normalized.name,
        schemeCode: normalized.schemeCode,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.synced) {
          setReadyFunds((prev) => new Set(prev).add(id));
        }
      })
      .finally(() => {
        setSyncingFunds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  };

  const removeFund = (id) => {
    const remaining = selectedFunds.filter(
      (f) => (f.schemeCode?.toString() || f.name) !== id,
    );
    if (remaining.length === 0) {
      setSelectedFunds([]);
      setWeights({});
      return;
    }
    const removedW = weights[id] || 0;
    const scale = 100 / (100 - removedW);
    const nextWeights = {};
    remaining.forEach((f) => {
      const rid = f.schemeCode?.toString() || f.name;
      nextWeights[rid] = Math.round((weights[rid] || 0) * scale);
    });
    const total = Object.values(nextWeights).reduce((a, b) => a + b, 0);
    if (total !== 100)
      nextWeights[remaining[0].schemeCode?.toString() || remaining[0].name] +=
        100 - total;
    setSelectedFunds(remaining);
    setWeights(nextWeights);
    setResults(null);
  };

  const updateWeight = (id, val) => {
    const v = parseInt(val) || 0;
    const others = selectedFunds.filter(
      (f) => (f.schemeCode?.toString() || f.name) !== id,
    );
    if (others.length === 0) return setWeights({ [id]: 100 });
    const remaining = 100 - v;
    const currentOtherTotal = others.reduce(
      (s, f) => s + (weights[f.schemeCode?.toString() || f.name] || 0),
      0,
    );
    const next = { ...weights, [id]: v };
    others.forEach((f) => {
      const oid = f.schemeCode?.toString() || f.name;
      next[oid] =
        currentOtherTotal === 0
          ? Math.floor(remaining / others.length)
          : Math.round(((weights[oid] || 0) / currentOtherTotal) * remaining);
    });
    const total = Object.values(next).reduce((a, b) => a + b, 0);
    if (total !== 100)
      next[others[0].schemeCode?.toString() || others[0].name] += 100 - total;
    setWeights(next);
    setResults(null);
  };

  const [analysisStatus, setAnalysisStatus] = useState("");
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const analyzePortfolio = async (isManualRefresh = false) => {
    if (!isPremium) {
      setShowPricing(true);
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysisStatus("Parsing Portfolio DNA...");
    try {
      setAnalysisStatus("Fetching Institutional Data...");
      const quickRes = await fetch("/api/portfolio/x-ray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funds: selectedFunds,
          weights,
          omitHoldings: true,
          force: isManualRefresh,
        }),
      });
      if (!quickRes.ok) {
        const errData = await quickRes.json().catch(() => ({}));
        throw new Error(errData.error || "Simulation failed.");
      }
      const quickData = await quickRes.json();
      setResults(quickData.data);
      setAnalysisStatus("Calculating Mixture Alpha...");
      setIsLazyLoading(true);
      const deepRes = await fetch("/api/portfolio/x-ray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funds: selectedFunds,
          weights,
          omitHoldings: false,
          force: isManualRefresh,
        }),
      });
      if (deepRes.ok) {
        const deepData = await deepRes.json();
        setResults(deepData.data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setIsLazyLoading(false);
      setAnalysisStatus("");
    }
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] pb-20 pt-20 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      <div className="fixed top-20 left-0 right-0 z-50 px-4 md:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-end">
          <div className="bg-[var(--bg-tertiary)]/80 backdrop-blur-xl border border-[var(--border-primary)] rounded-full px-4 py-1.5 flex items-center gap-4 shadow-2xl pointer-events-auto transition-all hover:scale-105 active:scale-95">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">Shield: Active</span>
            </div>
            <div className="w-px h-3 bg-[var(--border-primary)]" />
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{systemStats?.shieldedFunds || 0} Funds Cached</span>
            </div>
            <div className="w-px h-3 bg-[var(--border-primary)]" />
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{systemStats?.billingPlan || "Standard"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[var(--xray-bg-glow)]"></div>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-2xl border-b border-[var(--border-primary)] py-3 px-6 h-16 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Microscope size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-[var(--text-primary)] leading-none uppercase">Institutional Data Network</h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-indigo-400 font-black mt-1">Intelligence Secured</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {results && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-tertiary)] rounded-full border border-[var(--border-primary)]">
                <Activity size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-[var(--text-primary)]">Efficiency: {results.mixtureStats?.efficiencyScore}%</span>
              </div>
            )}
            <button onClick={() => (window.location.href = "/portfolio")} className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[10px] font-black text-[var(--text-primary)] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all uppercase tracking-widest shadow-sm">Terminate Session</button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4 tracking-tighter italic">Market <span className="text-indigo-400">X-Ray</span></h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-lg leading-relaxed font-medium opacity-80">Synthesizing high-conviction strategies into a singular efficiency frontier. Our engine identifies structural redundancies and sector-level imbalances in real-time.</p>
          </div>
          {results && (
            <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 md:gap-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative w-20 h-20 md:w-28 md:h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[var(--border-primary)]" />
                  <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="264" strokeDashoffset={264 - (264 * (results.mixtureStats?.efficiencyScore || 0)) / 100} className="text-indigo-400 transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <span className="absolute text-xl md:text-3xl font-black text-[var(--text-primary)]">{results.mixtureStats?.efficiencyScore || 0}</span>
              </div>
              <div className="max-w-[140px] md:max-w-[160px]">
                <h4 className="text-[9px] md:text-[10px] uppercase tracking-widest text-indigo-400 font-black mb-1">Efficiency Score</h4>
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] leading-tight opacity-70">{results.mixtureStats?.efficiencyScore > 75 ? "Optimal structural balance." : "High redundancy detected."}</p>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12 xl:col-span-4 h-fit">
            <div className="card-glass border-[var(--border-primary)] shadow-2xl rounded-[2rem] overflow-visible sticky top-8">
              <div className="p-6 border-b border-[var(--border-primary)] bg-gradient-to-r from-indigo-500/10 to-transparent flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg"><Layers className="text-indigo-400" size={18} /></div>
                    Benchmark <span className="text-indigo-400">Dock</span>
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.3em] font-black mt-1.5 opacity-60 ml-12">Architect Capital Structure</p>
                </div>
                <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-500/20 uppercase tracking-tighter">{selectedFunds.length} / 4 Deployed</div>
              </div>
              <div className="p-0">
                <div className="p-5 bg-[var(--bg-secondary)]/50 border-b border-[var(--border-primary)]">
                  <MagicSearch onSelect={handleAddFund} placeholder="Inject deep capital source..." className="!bg-transparent border-none" />
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-5 py-4 custom-scrollbar space-y-4">
                  {selectedFunds.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20"><Microscope className="text-indigo-400 opacity-30" size={24} /></div>
                      <p className="text-[var(--text-secondary)] text-sm font-bold opacity-40 uppercase tracking-widest">No assets deployed.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedFunds.map((fund) => {
                        const fid = fund.schemeCode?.toString() || fund.name;
                        return (
                          <div key={fid} className={`group relative bg-[var(--bg-primary)] border rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${fund.unsecured ? "border-amber-500/30 bg-amber-500/5" : "border-[var(--border-primary)] hover:border-indigo-500/40"}`}>
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[var(--text-primary)] font-black text-sm leading-tight group-hover:text-indigo-500 transition-colors">{fund.name}</h4>
                                  {fund.unsecured ? (
                                    <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg text-[8px] font-black animate-pulse border border-indigo-500/20"><RefreshCw size={8} className="animate-spin-slow" />INSTITUTIONAL SYNC</div>
                                  ) : readyFunds.has(fid) ? (
                                    <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-black"><ShieldCheck size={8} /> PERSISTENCE READY</div>
                                  ) : syncingFunds.has(fid) ? (
                                    <div className="flex items-center gap-1 bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-black animate-pulse"><Database size={8} className="animate-bounce" /> CLOUD SYNCING</div>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 pl-2 border-l-2 border-indigo-500/20">
                                  <span className="text-[9px] uppercase font-black text-indigo-400 tracking-tighter">{fund.category || "Miscellaneous"}</span>
                                  <span className="text-[9px] font-black text-[var(--text-muted)] opacity-50 uppercase">• {fund.fundHouse || "AMC"}</span>
                                </div>
                              </div>
                              <button onClick={() => removeFund(fid)} className="text-[var(--text-muted)] hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all shrink-0"><X size={16} /></button>
                            </div>
                            <div className="space-y-3 pl-4">
                              <div className="flex justify-between items-center text-[10px] uppercase font-black text-indigo-400/80 tracking-widest font-mono">
                                <span>Mixture Weight</span>
                                <span className="bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-400">{weights[fid] || 0}%</span>
                              </div>
                              <div className="relative group/slider">
                                <input type="range" min="0" max="100" value={weights[fid] || 0} onChange={(e) => updateWeight(fid, e.target.value)} className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer accent-indigo-500 relative z-10" />
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-300 pointer-events-none" style={{ width: `${weights[fid] || 0}%` }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="p-6 bg-gradient-to-t from-[var(--bg-secondary)]/80 to-transparent">
                  <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between transition-all duration-500 ${totalWeight === 100 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full transform transition-all duration-500 ${totalWeight === 100 ? "bg-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-amber-500 animate-pulse"}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Syndication Pipeline</span>
                    </div>
                    <span className="text-sm font-black tracking-tighter">{totalWeight}% / 100%</span>
                  </div>
                  {error && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-[2rem] p-5 mb-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                      <div className="p-2 bg-amber-500/20 rounded-xl"><Compass size={18} className="text-amber-400 animate-spin-slow" /></div>
                      <div>
                        <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">Architecture Discovery</h4>
                        <p className="text-[10px] text-amber-400/70 font-black italic">{error}</p>
                      </div>
                    </div>
                  )}
                  {results?.partial && (
                    <div className="bg-indigo-500/10 border-2 border-indigo-500/30 rounded-[2rem] p-5 mb-4 flex items-center gap-4 border-dashed animate-pulse">
                      <div className="p-2 bg-indigo-500/20 rounded-xl"><Loader2 size={18} className="text-indigo-400 animate-spin" /></div>
                      <div>
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Partial Discovery Mode</h4>
                        <p className="text-[10px] text-indigo-400/70 font-black italic">Wait for 'Persistence Ready' to lock in full portfolio coverage.</p>
                      </div>
                    </div>
                  )}
                  {!loading && (!results || results.partial) && (
                    <button onClick={() => analyzePortfolio(false)} disabled={loading || selectedFunds.length < 2 || totalWeight !== 100} className="w-full py-8 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-shimmer hover:scale-[1.02] active:scale-[0.98] text-white font-black text-sm uppercase tracking-[0.4em] rounded-[2.5rem] shadow-[0_20px_60px_rgba(99,102,241,0.5)] transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed group flex items-center justify-center gap-4 border border-white/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative z-10 drop-shadow-2xl">Initiate Intelligence</span>
                      <Activity size={20} className="relative z-10 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                  )}
                  {loading && (
                    <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-[var(--text-primary)] tracking-tighter italic">{analysisStatus}</h4>
                        <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 animate-progress-ind"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <section className="lg:col-span-8 space-y-8">
            {loading ? (
              <div className="space-y-8 animate-pulse pt-4">
                <div className="h-48 bg-white/[0.02] rounded-[2.5rem] border border-white/10" />
                <div className="h-64 bg-white/[0.02] rounded-[2.5rem] border border-white/10" />
              </div>
            ) : results ? (
              <div className="space-y-10">
                {results.mixtureStats?.hasUnsecured && (
                  <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-[2.5rem] p-8 flex items-center gap-8 animate-pulse">
                    <div className="p-4 bg-amber-500/30 rounded-3xl"><Shield size={32} className="text-amber-500" /></div>
                    <div>
                      <h4 className="text-base font-black text-amber-600 uppercase tracking-widest leading-none mb-2">Structural Discovery Pending</h4>
                      <p className="text-xs text-amber-700/80 font-black italic">Missing deep holdings data. Engine securing data in background...</p>
                    </div>
                  </div>
                )}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="p-3.5 bg-indigo-500/20 rounded-2xl border border-indigo-500/20"><Activity size={24} className="text-indigo-500" /></div>
                        <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none">Institutional Portfolio DNA</h3>
                      </div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] ml-1 opacity-80">Institutional Intelligence Manifest</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Alpha</p>
                        <p className={`text-3xl font-black tracking-tighter ${results.mixtureStats.alpha > 0 ? "text-[var(--text-primary)]" : "text-red-400"}`}>{results.mixtureStats.alpha > 0 ? "+" : ""}{results.mixtureStats.alpha.toFixed(1)}%</p>
                      </div>
                      <div className="w-px h-12 bg-[var(--border-primary)]"></div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Efficiency Score</p>
                        <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{(100 - results.mixtureStats.expense * 10).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex h-44 w-full rounded-[2rem] overflow-hidden border-4 border-[var(--bg-tertiary)] bg-[var(--bg-tertiary)]">
                        <div className="h-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex flex-col items-center justify-center relative transition-all duration-700 hover:brightness-110" style={{ width: `${Math.max(results.mixtureStats.large, 4)}%` }}>
                          <span className="text-3xl font-black text-white tracking-tighter">{results.mixtureStats.large.toFixed(0)}%</span>
                        </div>
                        <div className="h-full bg-gradient-to-br from-violet-500 to-violet-700 flex flex-col items-center justify-center border-x-4 border-[var(--bg-tertiary)] relative transition-all duration-700 hover:brightness-110" style={{ width: `${Math.max(results.mixtureStats.mid, 4)}%` }}>
                          <span className="text-3xl font-black text-white tracking-tighter">{results.mixtureStats.mid.toFixed(0)}%</span>
                        </div>
                        <div className="h-full bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 flex flex-col items-center justify-center relative transition-all duration-700 hover:brightness-110" style={{ width: `${Math.max(results.mixtureStats.small, 4)}%` }}>
                          <span className="text-3xl font-black text-white tracking-tighter">{results.mixtureStats.small.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between hover:border-indigo-500/30 transition-colors shadow-sm">
                        <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">Mixture PE</p>
                        <p className="text-2xl font-black text-[var(--text-primary)] mt-2">{results.mixtureStats.pe.toFixed(1)}x</p>
                      </div>
                      <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between hover:border-violet-500/30 transition-colors shadow-sm">
                        <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">Mixture PB</p>
                        <p className="text-2xl font-black text-[var(--text-primary)] mt-2">{results.mixtureStats.pb.toFixed(1)}x</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-10 shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl"><ShieldCheck size={20} className="text-indigo-400" /></div>
                    <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase">Strategy Redundancy Matrix</h3>
                  </div>
                  <div className="space-y-4">
                    {results.overlapMatrix.map((pair, idx) => (
                      <div key={idx} onClick={() => setActiveDetailPair(pair)} className="p-6 bg-[var(--bg-tertiary)]/40 rounded-2xl border border-[var(--border-primary)] hover:border-indigo-500/30 transition-all cursor-pointer group flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                             <span className="text-sm font-black text-[var(--text-primary)]">{pair.fund1}</span>
                             <span className="text-[10px] text-[var(--text-muted)]">VS</span>
                             <span className="text-sm font-black text-[var(--text-primary)]">{pair.fund2}</span>
                          </div>
                          <div className="h-1.5 w-full max-w-xs bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${pair.overlap > 35 ? "bg-red-500" : "bg-indigo-500"}`} style={{ width: `${pair.overlap}%` }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-black ${pair.overlap > 35 ? "text-red-500" : "text-indigo-400"}`}>{pair.overlap}%</span>
                          <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">Overlap</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] border-2 border-dashed border-[var(--border-primary)] rounded-[3.5rem] flex flex-col items-center justify-center gap-8 group bg-[var(--bg-tertiary)]/10">
                <div className="p-10 bg-[var(--bg-card)] rounded-full border border-[var(--border-primary)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-xl"><Activity className="w-16 h-16 text-indigo-500" /></div>
                <div className="text-center space-y-4 max-w-sm px-10">
                  <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic">Awaiting Synthesis</p>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">Add at least two strategic benchmarks to the lab and initiate the Institutional Factsheet Engine to generate structural evidence.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      {activeDetailPair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setActiveDetailPair(null)} />
          <div className="relative w-full max-w-4xl bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-primary)] flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-[var(--border-primary)] flex justify-between items-center">
              <h3 className="text-2xl font-black text-[var(--text-primary)]">Correlation Dossier</h3>
              <button onClick={() => setActiveDetailPair(null)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-primary)]">
                    <p className="text-[9px] uppercase font-black text-indigo-400 mb-2">Strategy A</p>
                    <p className="text-sm font-bold">{activeDetailPair.fund1}</p>
                  </div>
                  <div className="p-6 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-primary)]">
                    <p className="text-[9px] uppercase font-black text-violet-400 mb-2">Strategy B</p>
                    <p className="text-sm font-bold">{activeDetailPair.fund2}</p>
                  </div>
               </div>
               <div className="p-8 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 italic font-medium leading-relaxed">
                 "{activeDetailPair.verdict}"
               </div>
               <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] overflow-hidden">
                 <table className="w-full text-left">
                   <thead className="bg-[var(--bg-tertiary)] text-[10px] uppercase font-black">
                     <tr>
                       <th className="p-4">Stock</th>
                       <th className="p-4">Fund A %</th>
                       <th className="p-4">Fund B %</th>
                       <th className="p-4">Overlap %</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border-primary)]">
                      {(activeDetailPair.common || []).map((s, i) => (
                        <tr key={i} className="text-sm">
                          <td className="p-4 font-bold">{s.stock}</td>
                          <td className="p-4">{s.percA.toFixed(2)}%</td>
                          <td className="p-4">{s.percB.toFixed(2)}%</td>
                          <td className="p-4 text-emerald-500 font-bold">{s.overlap.toFixed(2)}%</td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
      )}
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </div>
  );
}