"use client";

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
  ListTree,
} from "lucide-react";
import dynamic from "next/dynamic";
import MagicSearch from "@/components/MagicSearch";

// Institutional Recharts Bundle - Dynamic Load
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false },
);
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false },
);
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);
const AreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false },
);
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), {
  ssr: false,
});
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), {
  ssr: false,
});

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
  const centerOffset =
    (1 - Math.min(100, Math.max(0, overlap)) / 100) * (radius * 0.85);
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
  const [syncingFunds, setSyncingFunds] = useState(new Set());
  const [readyFunds, setReadyFunds] = useState(new Set());
  const [systemStats, setSystemStats] = useState(null);

  // Fetch System Stats (Persistence Shield Health)
  useEffect(() => {
    fetch("/api/system/stats")
      .then((res) => res.json())
      .then(setSystemStats)
      .catch((err) => console.error("Stats fail:", err));
  }, [selectedFunds]); // Refresh stats when portoflio changes to show sync progress

  // Helpers for dynamic weight distribution
  const handleAddFund = (fund) => {
    if (selectedFunds.length >= 4) return;

    // Ensure consistent data structure from Search API
    const normalized = {
      ...fund,
      name: fund.schemeName || fund.name,
      category: fund.category || "Miscellaneous",
      fundHouse: fund.fundHouse || "AMC",
    };

    // ALWAYS prefer schemeCode as the primary identifier if available
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

    // 100% Correction
    const total = Object.values(nextWeights).reduce((a, b) => a + b, 0);
    if (total !== 100) nextWeights[id] += 100 - total;

    setSelectedFunds(newFunds);
    setWeights(nextWeights);
    setResults(null); // Clear stale research data on strategy expansion
    setError(null); // Clear previous errors on new fund

    // Persistence Shield: Start background sync
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
    setResults(null); // Clear stale research data on decommissioning
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
    setResults(null); // Clear stale research on DNA recalibration
  };

  const [analysisStatus, setAnalysisStatus] = useState("");
  const [isLazyLoading, setIsLazyLoading] = useState(false);

  const analyzePortfolio = async (isManualRefresh = false) => {
    setLoading(true);
    setError(null);
    setAnalysisStatus("🧬 Parsing Portfolio DNA...");

    try {
      // Stage 1: Quick Mixture Synthesis (No Holdings)
      setAnalysisStatus("🌐 Fetching Institutional Data...");
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
        throw new Error(
          errData.error || "Simulation failed. Server unreachable.",
        );
      }
      const quickData = await quickRes.json();
      setResults(quickData.data);

      // UI is now "Active" with core metrics.
      // Stage 2: Deep Holdings Synthesis (Background / Lazy)
      setAnalysisStatus("⚡ Calculating Mixture Alpha...");
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
      {/* Persistence Shield: Intelligence Ribbon */}
      <div className="fixed top-20 left-0 right-0 z-50 px-4 md:px-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-end">
          <div className="bg-[var(--bg-tertiary)]/80 backdrop-blur-xl border border-[var(--border-primary)] rounded-full px-4 py-1.5 flex items-center gap-4 shadow-2xl pointer-events-auto transform transition-all hover:scale-105 active:scale-95">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Shield: Active
              </span>
            </div>
            <div className="w-px h-3 bg-[var(--border-primary)]" />
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {systemStats?.shieldedFunds || 0} Funds Cached
              </span>
            </div>
            <div className="w-px h-3 bg-[var(--border-primary)]" />
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {systemStats?.billingPlan || "Standard"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Backdrop Glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{ background: "var(--xray-bg-glow)" }}
      ></div>

      {/* Glass Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-2xl border-b border-[var(--border-primary)] py-3 px-6 h-16 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Microscope size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-[var(--text-primary)] leading-none">
                Portfolio Architect
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-indigo-400 font-black mt-1">
                Institutional Factsheet Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {results && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-tertiary)] rounded-full border border-[var(--border-primary)]">
                <Activity size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-[var(--text-primary)]">
                  Efficiency: {results.mixtureStats?.efficiencyScore}%
                </span>
              </div>
            )}
            <button
              onClick={() => (window.location.href = "/portfolio")}
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[10px] font-black text-[var(--text-primary)] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all uppercase tracking-widest shadow-sm"
            >
              Terminate Session
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4 tracking-tighter italic">
              Portfolio <span className="text-indigo-400">Architect</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-lg leading-relaxed font-medium opacity-80">
              Synthesizing high-conviction strategies into a singular efficiency
              frontier. Our engine identifies structural redundancies and
              sector-level imbalances in real-time.
            </p>
          </div>

          {results && (
            <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] p-6 md:p-8 flex items-center gap-6 md:gap-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative w-20 h-20 md:w-28 md:h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-[var(--border-primary)]"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="100%"
                    strokeDashoffset={`${100 - (results.mixtureStats?.efficiencyScore || 0)}%`}
                    className="text-indigo-400 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: "264",
                      strokeDashoffset: `${264 - (264 * (results.mixtureStats?.efficiencyScore || 0)) / 100}`,
                    }}
                  />
                </svg>
                <span className="absolute text-xl md:text-3xl font-black text-[var(--text-primary)]">
                  {results.mixtureStats?.efficiencyScore || 0}
                </span>
              </div>
              <div className="max-w-[140px] md:max-w-[160px]">
                <h4 className="text-[9px] md:text-[10px] uppercase tracking-widest text-indigo-400 font-black mb-1">
                  Efficiency Score
                </h4>
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] leading-tight opacity-70">
                  {results.mixtureStats?.efficiencyScore > 75
                    ? "Optimal structural balance."
                    : "High redundancy detected."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Control Bench */}
          {/* Active Bench / Benchmark Dock */}
          <div className="lg:col-span-12 xl:col-span-4 h-fit">
            <div className="card-glass border-[var(--border-primary)] shadow-2xl rounded-[2rem] overflow-visible sticky top-8">
              <div className="p-6 border-b border-[var(--border-primary)] bg-gradient-to-r from-indigo-500/10 to-transparent flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Layers className="text-indigo-400" size={18} />
                    </div>
                    Benchmark <span className="text-indigo-400">Dock</span>
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.3em] font-black mt-1.5 opacity-60 ml-12">
                    Architect Capital Structure
                  </p>
                </div>
                <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-500/20 uppercase tracking-tighter">
                  {selectedFunds.length} / 4 Deployed
                </div>
              </div>

              <div className="p-0">
                <div className="p-5 bg-[var(--bg-secondary)]/50 border-b border-[var(--border-primary)]">
                  <MagicSearch
                    onSelect={handleAddFund}
                    placeholder="Inject deep capital source..."
                    className="!bg-transparent border-none"
                  />
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-5 py-4 custom-scrollbar space-y-4">
                  {selectedFunds.length === 0 ? (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                        <Microscope
                          className="text-indigo-400 opacity-30"
                          size={24}
                        />
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm font-bold opacity-40 uppercase tracking-widest">
                        No assets deployed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedFunds.map((fund) => {
                        const fid = fund.schemeCode?.toString() || fund.name;
                        return (
                          <div
                            key={fid}
                            className={`group relative bg-[var(--bg-primary)] border rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${fund.unsecured ? "border-amber-500/30 bg-amber-500/5" : "border-[var(--border-primary)] hover:border-indigo-500/40"}`}
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[var(--text-primary)] font-black text-sm leading-tight group-hover:text-indigo-500 transition-colors">
                                    {fund.name}
                                  </h4>
                                  {fund.unsecured ? (
                                    <div className="flex items-center gap-1 bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[8px] font-black animate-pulse">
                                      <Loader
                                        size={8}
                                        className="animate-spin"
                                      />{" "}
                                      DISCOVERY PENDING
                                    </div>
                                  ) : readyFunds.has(fid) ? (
                                    <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-black">
                                      <ShieldCheck size={8} /> PERSISTENCE READY
                                    </div>
                                  ) : syncingFunds.has(fid) ? (
                                    <div className="flex items-center gap-1 bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-black animate-pulse">
                                      <Database
                                        size={8}
                                        className="animate-bounce"
                                      />{" "}
                                      CLOUD SYNCING
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 pl-2 border-l-2 border-indigo-500/20">
                                  <span className="text-[9px] uppercase font-black text-indigo-400 tracking-tighter">
                                    {fund.category || "Miscellaneous"}
                                  </span>
                                  <span className="text-[9px] font-black text-[var(--text-muted)] opacity-50 uppercase">
                                    • {fund.fundHouse || "AMC"}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFund(fid)}
                                className="text-[var(--text-muted)] hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="space-y-3 pl-[var(--space-nested)]">
                              <div className="flex justify-between items-center text-[10px] uppercase font-black text-indigo-400/80 tracking-widest font-mono">
                                <span>Mixture Weight</span>
                                <span className="bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-400">
                                  {weights[fid] || 0}%
                                </span>
                              </div>
                              <div className="relative group/slider">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={weights[fid] || 0}
                                  onChange={(e) =>
                                    updateWeight(fid, e.target.value)
                                  }
                                  className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer accent-indigo-500 relative z-10"
                                />
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-300 pointer-events-none"
                                  style={{ width: `${weights[fid] || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-gradient-to-t from-[var(--bg-secondary)]/80 to-transparent">
                  <div
                    className={`mb-6 p-4 rounded-2xl border flex items-center justify-between transition-all duration-500 ${
                      totalWeight === 100
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full transform transition-all duration-500 ${totalWeight === 100 ? "bg-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-amber-500 animate-pulse"}`}
                      ></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Syndication Pipeline
                      </span>
                    </div>
                    <span className="text-sm font-black tracking-tighter">
                      {totalWeight}% / 100%
                    </span>
                  </div>

                  {error && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-[2rem] p-5 mb-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                      <div className="p-2 bg-amber-500/20 rounded-xl">
                        <Compass
                          size={18}
                          className="text-amber-400 animate-spin-slow"
                        />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">
                          Architecture Discovery
                        </h4>
                        <p className="text-[10px] text-amber-400/70 font-black italic">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}

                  {results?.partial && (
                    <div className="bg-indigo-500/10 border-2 border-indigo-500/30 rounded-[2rem] p-5 mb-4 flex items-center gap-4 border-dashed animate-pulse">
                      <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Loader2
                          size={18}
                          className="text-indigo-400 animate-spin"
                        />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">
                          Partial Discovery Mode
                        </h4>
                        <p className="text-[10px] text-indigo-400/70 font-black italic">
                          Wait for 'Persistence Ready' to lock in full portfolio
                          coverage.
                        </p>
                      </div>
                    </div>
                  )}

                  {!loading && (!results || results.partial) && (
                    <button
                      onClick={() => analyzePortfolio(false)}
                      disabled={loading || selectedFunds.length === 0}
                      className="w-full py-7 btn-premium-animated institutional-pulse hover:scale-[1.02] active:scale-[0.98] text-white font-black text-sm uppercase tracking-[0.4em] rounded-[2rem] shadow-[0_20px_50px_rgba(99,102,241,0.4)] transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed group flex items-center justify-center gap-4 border border-white/30 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative z-10 drop-shadow-xl">
                        Initiate Intelligence Hub
                      </span>
                      <Zap
                        size={20}
                        className="relative z-10 group-hover:fill-current group-hover:scale-125 transition-all animate-bounce"
                      />
                    </button>
                  )}

                  {loading && (
                    <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-[var(--text-primary)] tracking-tighter italic">
                          {analysisStatus}
                        </h4>
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

          {/* Institutional Intelligence Engine Results */}
          <section className="lg:col-span-8 space-y-8">
            {loading ? (
              <div className="space-y-8 animate-pulse pt-4">
                <div className="h-48 bg-white/[0.02] rounded-[2.5rem] border border-white/10" />
                <div className="h-64 bg-white/[0.02] rounded-[2.5rem] border border-white/10" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-40 bg-white/[0.02] rounded-[2.5rem]" />
                  <div className="h-40 bg-white/[0.02] rounded-[2.5rem]" />
                </div>
              </div>
            ) : results ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Global Unsecured Warning */}
                {results.mixtureStats?.hasUnsecured && (
                  <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-[2.5rem] p-8 mb-10 flex items-center gap-8 institutional-pulse">
                    <div className="p-4 bg-amber-500/30 rounded-3xl shadow-inner">
                      <Shield size={32} className="text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest leading-none mb-2">
                        Structural Discovery Pending
                      </h4>
                      <p className="text-xs text-amber-700/80 dark:text-amber-500/70 font-black italic">
                        Missing deep holdings data. Our engine is securing this
                        data from institutional network nodes in the background.
                        Complete analytics manifest within 4 hours.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. Institutional Portfolio DNA (Heatmap + Stats) */}
                <div className="bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border-primary)] rounded-[3.5rem] p-1 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 pointer-events-none"></div>
                  <div className="p-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="p-3.5 bg-indigo-500/20 rounded-2xl shadow-lg border border-indigo-500/20">
                            <Activity size={24} className="text-indigo-500" />
                          </div>
                          <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                            Institutional Portfolio DNA
                          </h3>
                        </div>
                        <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.4em] ml-1 opacity-80">
                          Aggregate Mixture Intelligence
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                            Total Alpha
                          </p>
                          <p
                            className={`text-3xl font-black tracking-tighter ${results.mixtureStats.alpha > 0 ? "text-[var(--text-primary)]" : "text-red-400"}`}
                          >
                            {results.mixtureStats.alpha > 0 ? "+" : ""}
                            {results.mixtureStats.alpha.toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-px h-12 bg-[var(--border-primary)]"></div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                            Efficiency Score
                          </p>
                          <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">
                            {(100 - results.mixtureStats.expense * 10).toFixed(
                              0,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      {/* Visual Heatmap Column */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="flex h-44 w-full rounded-[2rem] overflow-hidden shadow-inner border-4 border-[var(--bg-tertiary)] bg-[var(--bg-tertiary)]">
                          <div
                            className="h-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex flex-col items-center justify-center relative group transition-all duration-700 hover:brightness-110 min-w-[2rem]"
                            style={{
                              width: `${Math.max(results.mixtureStats.large, 4)}%`,
                            }}
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-3xl font-black text-white tracking-tighter">
                              {results.mixtureStats.large.toFixed(0)}%
                            </span>
                            {results.mixtureStats.large >= 15 && (
                              <span className="text-[9px] uppercase font-black text-indigo-200 tracking-[0.3em] mt-1 pulse-subtle">
                                Large Cap
                              </span>
                            )}
                          </div>
                          <div
                            className="h-full bg-gradient-to-br from-violet-500 to-violet-700 flex flex-col items-center justify-center border-x-4 border-[var(--bg-tertiary)] relative group transition-all duration-700 hover:brightness-110 min-w-[2rem]"
                            style={{
                              width: `${Math.max(results.mixtureStats.mid, 4)}%`,
                            }}
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-3xl font-black text-white tracking-tighter">
                              {results.mixtureStats.mid.toFixed(0)}%
                            </span>
                            {results.mixtureStats.mid >= 15 && (
                              <span className="text-[9px] uppercase font-black text-violet-200 tracking-[0.3em] mt-1 pulse-subtle">
                                Mid Cap
                              </span>
                            )}
                          </div>
                          <div
                            className="h-full bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 flex flex-col items-center justify-center relative group transition-all duration-700 hover:brightness-110 min-w-[2rem]"
                            style={{
                              width: `${Math.max(results.mixtureStats.small, 4)}%`,
                            }}
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-3xl font-black text-white tracking-tighter">
                              {results.mixtureStats.small.toFixed(0)}%
                            </span>
                            {results.mixtureStats.small >= 15 && (
                              <span className="text-[9px] uppercase font-black text-fuchsia-200 tracking-[0.3em] mt-1 pulse-subtle">
                                Small Cap
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] italic text-center uppercase tracking-[0.4em] opacity-60">
                          Interactive Market Exposure Architecture
                        </p>
                      </div>

                      {/* Core Metrics Column */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between group hover:border-indigo-500/30 transition-colors shadow-sm">
                          <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">
                            Mixture PE
                          </p>
                          <p className="text-2xl font-black text-[var(--text-primary)] mt-2">
                            {results.mixtureStats.pe.toFixed(1)}
                            <span className="text-xs ml-1 opacity-40">x</span>
                          </p>
                        </div>
                        <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between group hover:border-violet-500/30 transition-colors shadow-sm">
                          <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">
                            Mixture PB
                          </p>
                          <p className="text-2xl font-black text-[var(--text-primary)] mt-2">
                            {results.mixtureStats.pb > 0 ? (
                              results.mixtureStats.pb.toFixed(1)
                            ) : (
                              <span className="text-xs text-indigo-400 animate-pulse">
                                SYNCING
                              </span>
                            )}
                            {results.mixtureStats.pb > 0 && (
                              <span className="text-xs ml-1 opacity-40">x</span>
                            )}
                          </p>
                        </div>
                        <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between group hover:border-emerald-500/30 transition-colors shadow-sm">
                          <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">
                            Op. Expense
                          </p>
                          <p className="text-2xl font-black text-emerald-500 mt-2">
                            {results.mixtureStats.expense > 0 ? (
                              results.mixtureStats.expense.toFixed(2)
                            ) : (
                              <span className="text-xs animate-pulse">
                                0.00
                              </span>
                            )}
                            <span className="text-xs ml-1 opacity-40">%</span>
                          </p>
                        </div>
                        <div className="p-6 bg-[var(--bg-tertiary)]/40 rounded-3xl border border-[var(--border-primary)] flex flex-col justify-between group hover:border-blue-500/30 transition-colors shadow-sm">
                          <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest">
                            Risk Alpha
                          </p>
                          <p
                            className={`text-2xl font-black mt-2 ${results.mixtureStats.alpha > 0 ? "text-indigo-400" : "text-red-400"}`}
                          >
                            {results.mixtureStats.alpha > 0 ? "+" : ""}
                            {results.mixtureStats.alpha.toFixed(1)}
                            <span className="text-xs ml-1 opacity-40">%</span>
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
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--text-primary)]">
                          Strategy Comparison Matrix
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-4 py-1.5 rounded-full uppercase tracking-widest">
                          {activePairIndex + 1} / {results.overlapMatrix.length}{" "}
                          PAIRS
                        </span>
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
                            {(pair.fund1 || "Fund A")
                              .split(" ")
                              .slice(0, 2)
                              .join(" ")}
                          </span>
                          <span className="text-[9px] font-black opacity-20 uppercase tracking-[0.3em]">
                            vs
                          </span>
                          <span className="text-[11px] font-black tracking-tight whitespace-nowrap uppercase">
                            {(pair.fund2 || "Fund B")
                              .split(" ")
                              .slice(0, 2)
                              .join(" ")}
                          </span>
                          {activePairIndex === idx && (
                            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Focused Pair Diagnostic View */}
                  {results.overlapMatrix?.[activePairIndex] &&
                    (() => {
                      const pair = results.overlapMatrix[activePairIndex];
                      return (
                        <div
                          key={activePairIndex}
                          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch animate-in zoom-in-95 duration-700"
                        >
                          <div className="flex flex-col gap-6">
                            <div className="bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-primary)] p-16 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl transition-all hover:border-indigo-500/20">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
                              <VennDiagram overlapPercentage={pair.overlap} />
                              <div className="mt-16 text-center space-y-3">
                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                    Structural Analysis
                                  </span>
                                </div>
                                <p className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">
                                  {pair.overlap}%
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-muted)] font-black mb-4">
                                  Strategic Redundancy Index
                                </p>

                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-violet-500/5 border border-violet-500/10">
                                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                                    Sector Alignment: {pair.sectorOverlap}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-primary)] p-8 shadow-xl">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                    <Activity
                                      size={16}
                                      className="text-indigo-400"
                                    />
                                  </div>
                                  <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                                    Exposure Analytics
                                  </h4>
                                </div>
                              </div>
                              <div className="space-y-4 pl-[var(--space-nested)]">
                                {(pair.common || [])
                                  .slice(0, 3)
                                  .map((st, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/50 rounded-2xl border border-[var(--border-primary)] group hover:border-indigo-500/30 transition-all"
                                    >
                                      <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tighter opacity-80 group-hover:opacity-100">
                                        {st.stock}
                                      </span>
                                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md">
                                        {(st.overlap || 0).toFixed(2)}%
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>

                          <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-primary)] p-10 shadow-2xl flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-8">
                                <Shield
                                  size={20}
                                  className="text-emerald-400"
                                />
                                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                                  Algorithm Verdict
                                </h4>
                              </div>
                              <div className="p-8 rounded-[2rem] bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] italic font-semibold text-lg text-[var(--text-primary)] leading-relaxed mb-6">
                                "{pair.verdict}"
                              </div>
                              <div className="space-y-4">
                                <div
                                  className={`p-5 rounded-2xl border ${pair.overlap > 55 ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}
                                >
                                  <p
                                    className={`text-[10px] font-black uppercase tracking-widest mb-1 ${pair.overlap > 55 ? "text-red-400" : "text-emerald-400"}`}
                                  >
                                    Strategic Implication
                                  </p>
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
                                <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-card)] bg-indigo-500 flex items-center justify-center text-white">
                                  A
                                </div>
                                <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-card)] bg-violet-600 flex items-center justify-center text-white">
                                  B
                                </div>
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
                      <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                        Sector Architecture
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {results.mixtureStats.sectors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40 animate-pulse">
                          <Activity size={32} className="mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                            Synchronizing Forensic Data...
                          </p>
                        </div>
                      ) : (
                        results.mixtureStats.sectors
                          .slice(0, 6)
                          .map((sec, i) => (
                            <div key={i} className="group">
                              <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-[var(--text-muted)] tracking-tight">
                                  {sec.sector}
                                </span>
                                <span className="text-xs font-black text-[var(--text-primary)]">
                                  {sec.percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-[var(--border-primary)]/20 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-1000 ${sec.percentage > 25 ? "bg-red-500" : "bg-indigo-500"}`}
                                  style={{ width: `${sec.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Risks & Benchmarks */}
                  <div className="space-y-8">
                    {results.mixtureStats.risks.length > 0 ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-8 backdrop-blur-3xl">
                        <div className="flex items-center gap-3 mb-6">
                          <AlertTriangle size={24} className="text-red-500" />
                          <h3 className="text-xl font-black text-red-500 tracking-tight">
                            Concentration Risks
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {results.mixtureStats.risks.map((risk, idx) => (
                            <div
                              key={idx}
                              className="bg-black/30 p-5 rounded-2xl border border-red-500/10 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-[10px] uppercase font-black text-red-400 tracking-widest mb-1">
                                  Extreme Exposure
                                </p>
                                <p className="text-sm font-bold text-white">
                                  {risk.sector}
                                </p>
                              </div>
                              <span className="text-2xl font-black text-red-500">
                                {risk.percentage.toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-8 h-full flex flex-col items-center justify-center text-center">
                        <CheckCircle2
                          size={48}
                          className="text-emerald-500 mb-4 opacity-50"
                        />
                        <p className="text-lg font-black text-emerald-500 uppercase tracking-widest mb-2">
                          Portfolio Healthy
                        </p>
                        <p className="text-xs text-emerald-400/60 font-medium">
                          No extreme concentration flags detected in this
                          mixture.
                        </p>
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
                  <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic">
                    Awaiting Synthesis
                  </p>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                    Add at least two strategic benchmarks to the lab and
                    initiate the Institutional Factsheet Engine to generate
                    structural evidence.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Forensic Detail Dossier Modal */}
      {activeDetailPair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-500"
            onClick={() => setActiveDetailPair(null)}
          />
          <div className="relative w-full max-w-6xl bg-[var(--bg-primary)] rounded-[4.5rem] border border-[var(--border-primary)] shadow-3xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>

            {/* Dossier Header */}
            <div className="p-12 border-b border-[var(--border-primary)]/50 flex justify-between items-center bg-gradient-to-b from-[var(--bg-tertiary)]/30 to-transparent">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <Database size={24} className="text-indigo-400" />
                  </div>
                  <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic">
                    Forensic{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                      Intersection Dossier
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-2 overflow-hidden px-4 py-2 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] w-fit backdrop-blur-xl">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                    {activeDetailPair?.fund1 || "Strategy Alpha"}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] font-black uppercase opacity-30 px-1">
                    ⬌
                  </span>
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest leading-none">
                    {activeDetailPair?.fund2 || "Strategy Beta"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveDetailPair(null)}
                className="w-16 h-16 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)] rounded-3xl border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shadow-xl group"
              >
                <X
                  size={24}
                  className="group-hover:rotate-90 transition-transform duration-500"
                />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                <div className="md:col-span-1 bg-gradient-to-br from-indigo-600/10 to-transparent rounded-[3rem] border border-indigo-500/20 p-10 flex flex-col items-center justify-center shadow-inner relative group overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-[2s]"></div>
                  <p className="text-[10px] uppercase font-black text-indigo-400 tracking-[0.3em] mb-4 relative z-10">
                    Redundancy
                  </p>
                  <p className="text-7xl font-black text-[var(--text-primary)] tracking-[-0.05em] relative z-10">
                    {(activeDetailPair?.overlap || 0).toFixed(1)}
                    <span className="text-xl text-indigo-500/50 -ml-1">%</span>
                  </p>
                </div>
                <div className="md:col-span-3 bg-[var(--bg-tertiary)]/20 rounded-[3rem] border border-[var(--border-primary)] p-12 flex items-center gap-10 relative overflow-hidden backdrop-blur-3xl group">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                  <div className="w-16 h-16 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center border border-[var(--border-primary)] shadow-2xl relative z-10 shrink-0">
                    <ShieldCheck size={32} className="text-indigo-400" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-2">
                      Structural Intelligence Insight
                    </h4>
                    <p className="text-sm text-[var(--text-muted)] font-medium leading-loose max-w-2xl italic tracking-wide">
                      The Structural Redundancy Index for this pair indicates a
                      minimum common investment of{" "}
                      <span className="text-indigo-400 font-bold">
                        {(activeDetailPair?.overlap || 0).toFixed(1)}%
                      </span>{" "}
                      across all underlying tickers. Portfolios exceeding 45%
                      overlap typically signify internal cannibalization,
                      diminishing the potential for risk-adjusted alpha
                      generation.
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
                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                      Security Intersection Breakdown
                    </h4>
                  </div>
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    Showing Top {activeDetailPair?.common?.length || 0} Holdings
                  </span>
                </div>

                <div className="bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-primary)] overflow-hidden shadow-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-tertiary)]/50 text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.3em] border-b border-[var(--border-primary)]/50">
                        <th className="px-12 py-8">Ticker Intelligence</th>
                        <th className="px-12 py-8 text-indigo-400/80">
                          Strategy Alpha %
                        </th>
                        <th className="px-12 py-8 text-violet-400/80">
                          Strategy Beta %
                        </th>
                        <th className="px-12 py-8 text-emerald-400">
                          Net Redundancy %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                      {(activeDetailPair?.common || []).map((st, si) => (
                        <tr
                          key={si}
                          className="hover:bg-indigo-500/[0.04] transition-all duration-300 group"
                        >
                          <td className="px-12 py-7">
                            <div className="flex flex-col gap-1">
                              <span className="text-[13px] font-black text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors uppercase tracking-tight italic">
                                {st.stock}
                              </span>
                              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest italic opacity-60">
                                Verified Institutional Security
                              </span>
                            </div>
                          </td>
                          <td className="px-12 py-7 text-xs text-[var(--text-secondary)] font-black tracking-tight italic opacity-80">
                            {(st.percA || 0).toFixed(2)}%
                          </td>
                          <td className="px-12 py-7 text-xs text-[var(--text-secondary)] font-black tracking-tight italic opacity-80">
                            {(st.percB || 0).toFixed(2)}%
                          </td>
                          <td className="px-12 py-7">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden shrink-0 border border-[var(--border-primary)]">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                                  style={{
                                    width: `${Math.min((st.overlap || 0) * 10, 100)}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-[11px] font-black text-emerald-500 tracking-widest font-mono">
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
                  Verified Data Stream • Factsheet Hub Engine v5.1.2 •{" "}
                  <span className="text-indigo-400">Institutional Access</span>
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-8 py-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-black transition-all shadow-xl flex items-center gap-2"
              >
                <Activity size={14} /> Export Technical Dossier
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Sticky Action Bar - Enhanced Premium Appeal */}
      {selectedFunds.length >= 1 && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-[var(--bg-secondary)]/90 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[2.5rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4">
            <div className="flex-1 px-4">
              <p className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-widest mb-0.5 opacity-60">
                Mix Integrity Portfolio
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${totalWeight === 100 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-110" : "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]"}`}
                ></div>
                <span
                  className={`text-lg font-black tracking-tighter ${totalWeight === 100 ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {totalWeight}%
                </span>
              </div>
            </div>
            <button
              onClick={analyzePortfolio}
              disabled={
                loading || totalWeight !== 100 || selectedFunds.length < 2
              }
              className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 bg-[length:200%_auto] animate-gradient-slow px-10 py-5 rounded-[2rem] text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/30 active:scale-95 disabled:opacity-20 disabled:grayscale transition-all flex items-center gap-3 border border-white/20"
            >
              {loading ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Zap size={18} className="fill-white animate-pulse" />
              )}
              <span className="shrink-0">
                {totalWeight === 100
                  ? selectedFunds.length < 2
                    ? "Add Benchmarks"
                    : "Run Intelligence"
                  : "Balance Allocation"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
