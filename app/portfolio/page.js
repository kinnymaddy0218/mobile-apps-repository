'use client';
export const dynamic = 'force-dynamic';


import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getProposalWeights } from '@/lib/calculations';
import MagicSearch from '@/components/MagicSearch';
import nextDynamic from 'next/dynamic';

// Heavy Recharts components - Dynamic loading with SSR disabled
const ResponsiveContainer = nextDynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = nextDynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = nextDynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = nextDynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const Tooltip = nextDynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = nextDynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const AreaChart = nextDynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = nextDynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const Sector = nextDynamic(() => import('recharts').then(mod => mod.Sector), { ssr: false });



import ProfileSettings from '@/components/Portfolio/ProfileSettings';
const CasImportModal = nextDynamic(() => import('@/components/Portfolio/CasImportModal'), { ssr: false });
import { normalizeCategory, cleanSchemeName } from '@/lib/categories';
import InsightCard from '@/components/Portfolio/InsightCard';
import PortfolioLockedState from '@/components/Portfolio/PortfolioLockedState';
const FullReportModal = nextDynamic(() => import('@/components/Portfolio/FullReportModal'), { ssr: false });
import PremiumGuard from '@/components/PremiumGuard';
const PricingModal = nextDynamic(() => import('@/components/Portfolio/PricingModal'), { ssr: false });

// Module-level constant — safe to use as useState default
const SCENARIOS = [
    {
        id: 'gdp',
        name: 'India GDP Growth Data (Q3 FY25)',
        shock: -2.00,
        description: 'Macroeconomic slowdown in domestic production affecting consumer demand.',
        severity: 'Moderate'
    },
    {
        id: 'west-asia',
        name: 'West Asia Crisis (Oil & Gas Shock)',
        shock: -3.50,
        description: 'Geopolitical instability leads to crude oil price spike and supply chain disruption.',
        severity: 'High'
    },
    {
        id: 'fed-hike',
        name: 'US Fed Interest Rate Hike',
        shock: -1.50,
        description: 'Higher borrowing costs in the US lead to FII outflows from emerging markets.',
        severity: 'Medium'
    },
    {
        id: 'tech-correction',
        name: 'Global Tech Correction',
        shock: -4.00,
        description: 'Speculative bubble burst in AI and Cloud sectors impacting IT heavy portfolios.',
        severity: 'Critical'
    }
];

export default function PortfolioPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [portfolio, setPortfolio] = useState([]);
    const [inputMode, setInputMode] = useState('weight'); // 'amount' or 'weight'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [authTimedOut, setAuthTimedOut] = useState(false);
    const [chartView, setChartView] = useState('category'); // 'category' or 'house'

    // Unified Normalization Utilities removed - now imported from @/lib/categories
    const [message, setMessage] = useState('');
    const [isCasModalOpen, setIsCasModalOpen] = useState(false);
    const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [marketEvents, setMarketEvents] = useState([]);
    const [activeHoverIndex, setActiveHoverIndex] = useState(null);
    const [benchmarks, setBenchmarks] = useState(null);

    const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);

    // Derived values
    const totalValuation = portfolio.reduce((sum, f) => sum + (f.valuation || 0), 0);
    const totalWeight = portfolio.reduce((sum, f) => sum + (f.weight || 0), 0);

    useEffect(() => {
        const handleOpenPricing = () => setIsPricingModalOpen(true);
        window.addEventListener('open-pricing-modal', handleOpenPricing);
        return () => window.removeEventListener('open-pricing-modal', handleOpenPricing);
    }, []);

    // Timeout guard: if Firebase auth hangs for > 6s, stop showing the blank loading screen
    useEffect(() => {
        if (!authLoading) return;
        const timer = setTimeout(() => {
            console.warn('[Portfolio] Auth loading timed out after 6s — forcing resolution.');
            setAuthTimedOut(true);
            setLoading(false);
        }, 6000);
        return () => clearTimeout(timer);
    }, [authLoading]);

    // Load user portfolio from Firestore
    useEffect(() => {
        const loadPortfolio = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // Fetch market news for context
                const newsRes = await fetch('/api/news');
                const newsData = await newsRes.json();
                if (newsData.articles) {
                    // Filter for significantly "market moving" keywords
                    const keywords = ['inflation', 'fed', 'rate', 'war', 'oil', 'geopolitical', 'crash', 'rally', 'gdp', 'sensex', 'nifty'];
                    const relevant = newsData.articles.filter(a =>
                        keywords.some(k => a.title.toLowerCase().includes(k))
                    );
                    setMarketEvents(relevant.slice(0, 3));
                    
                    // AUTO-SELECT RELEVANT SCENARIO: Match news keywords to predefined stress tests
                    if (relevant.length > 0) {
                        const topTitle = relevant[0].title.toLowerCase();
                        if (topTitle.includes('war') || topTitle.includes('geopolitical') || topTitle.includes('oil')) {
                            setActiveScenario(SCENARIOS.find(s => s.id === 'west-asia'));
                        } else if (topTitle.includes('gdp') || topTitle.includes('growth')) {
                            setActiveScenario(SCENARIOS.find(s => s.id === 'gdp'));
                        } else if (topTitle.includes('fed') || topTitle.includes('rate')) {
                            setActiveScenario(SCENARIOS.find(s => s.id === 'fed-hike'));
                        } else if (topTitle.includes('tech') || topTitle.includes('ai') || topTitle.includes('nasdaq')) {
                            setActiveScenario(SCENARIOS.find(s => s.id === 'tech-correction'));
                        }
                    }
                }

                const docRef = doc(db, 'user_portfolios', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const funds = docSnap.data().funds || [];
                    setPortfolio(funds);
                    // Background enrich to get latest NAV and 1M Variance
                    enrichPortfolio(funds);
                }

                // Fetch benchmarks once for the whole page
                const benchRes = await fetch('/api/portfolio/benchmarks');
                if (benchRes.ok) {
                    const benchData = await benchRes.json();
                    setBenchmarks(benchData);
                }
            } catch (err) {
                console.error('Error loading portfolio:', err);
            } finally {
                setLoading(false);
            }
        };
        loadPortfolio();
    }, [user]);

    const enrichPortfolio = async (fundsToEnrich) => {
        if (!fundsToEnrich.length) return;

        try {
            const enriched = await Promise.all(fundsToEnrich.map(async (f) => {
                try {
                    const res = await fetch(`/api/funds/${f.schemeCode}`);
                    const data = await res.json();
                    if (data && !data.error) {
                        // Calculate 1M Variance from navHistory
                        let variance1m = 0;
                        if (data.navHistory && data.navHistory.length >= 2) {
                            const latest = data.nav;
                            // Fallback to nearest available if 22 days isn't there
                            const lookbackIndex = Math.min(22, data.navHistory.length - 1);
                            const past = parseFloat(data.navHistory[lookbackIndex].nav);
                            variance1m = ((latest - past) / past) * 100;
                        }
                        return {
                            ...f,
                            fundHouse: data.fundHouse || f.fundHouse || 'Unknown',
                            category: (data.schemeCategory && data.schemeCategory !== 'Other') ? data.schemeCategory : (f.category || 'Other'),
                            // PRIORITIZE OFFICIAL METRICS: If AMC factsheet data exists, use it for portfolio analytics
                            alpha: data.factsheet?.risk_adjusted_metrics?.alpha != null && !isNaN(parseFloat(data.factsheet.risk_adjusted_metrics.alpha))
                                ? parseFloat(data.factsheet.risk_adjusted_metrics.alpha)
                                : (data.risk?.alpha || f.alpha || 0),
                            beta: data.factsheet?.risk_adjusted_metrics?.beta != null && !isNaN(parseFloat(data.factsheet.risk_adjusted_metrics.beta))
                                ? parseFloat(data.factsheet.risk_adjusted_metrics.beta)
                                : (data.risk?.beta || f.beta || 0),
                            officialSource: data.factsheet?.risk_adjusted_metrics?.alpha != null ? 'AMC' : 'Calculated',
                            oneYearReturn: data.cagr?.['1yr'] || data.oneYearReturn || 0,
                            threeYearReturn: data.cagr?.['3yr'] || 0,
                            fiveYearReturn: data.cagr?.['5yr'] || 0,
                            sevenYearReturn: data.cagr?.['7yr'] || 0,
                            tenYearReturn: data.cagr?.['10yr'] || 0,
                            variance1m: variance1m
                        };
                    }
                    return f;
                } catch (e) {
                    return f;
                }
            }));
            setPortfolio(enriched);
        } catch (err) {
            console.error('Error enriching portfolio:', err);
        }
    };

    const updateProfileSetting = async (field, value) => {
        if (!user) return;
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { [field]: value }, { merge: true });
        } catch (err) {
            console.error('Error updating profile setting:', err);
        }
    };

    const savePortfolio = async (updatedPortfolio) => {
        if (!user) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'user_portfolios', user.uid);
            await setDoc(docRef, {
                funds: updatedPortfolio,
                lastUpdated: serverTimestamp()
            });
            setMessage('Portfolio saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Error saving portfolio:', err);
            setMessage('Failed to save portfolio.');
        } finally {
            setSaving(false);
        }
    };

    const addFund = (fund) => {
        // Prevent duplicates
        if (portfolio.find(f => f.schemeCode === fund.schemeCode)) return;

        // Calculate available weight
        const currentTotalWeight = portfolio.reduce((sum, f) => sum + (f.weight || 0), 0);
        const availableWeight = Math.max(0, 100 - currentTotalWeight);

        const updated = [...portfolio, {
            schemeCode: fund.schemeCode,
            schemeName: fund.schemeName,
            category: fund.category,
            alpha: fund.alpha || 0,
            beta: fund.beta || 0,
            oneYearReturn: fund.cagr?.['1yr'] || fund.oneYearReturn || 0,
            threeYearReturn: fund.cagr?.['3yr'] || 0,
            fiveYearReturn: fund.cagr?.['5yr'] || 0,
            sevenYearReturn: fund.cagr?.['7yr'] || 0,
            tenYearReturn: fund.cagr?.['10yr'] || 0,
            weight: 0
        }];
        setPortfolio(updated);
        savePortfolio(updated);
        // Enrich the newly added fund immediately
        enrichPortfolio(updated);
    };

    const removeFund = (schemeCode) => {
        const updated = portfolio.filter(f => f.schemeCode !== schemeCode);
        setPortfolio(updated);
        savePortfolio(updated);
    };

    const clearPortfolio = () => {
        setPortfolio([]);
        savePortfolio([]);
        setIsConfirmingClear(false);
    };

    const updateWeight = (schemeCode, value) => {
        const numValue = value === '' ? 0 : parseFloat(value);
        let newPortfolio = portfolio.map(f => {
            if (f.schemeCode === schemeCode) {
                if (inputMode === 'amount') {
                    return { ...f, valuation: numValue };
                }
                return { ...f, weight: numValue };
            }
            return f;
        });

        const currentTotalValuation = newPortfolio.reduce((sum, f) => sum + (f.valuation || 0), 0);

        // AUTO-NORMALIZATION: If total weights exceed 100, we help the customer by scaling them back
        if (inputMode === 'weight') {
            const currentTotalWeight = newPortfolio.reduce((sum, f) => sum + (f.weight || 0), 0);
            if (currentTotalWeight > 100) {
                // If the single fund itself is >= 100, clamp it to 100
                if (numValue >= 100) {
                    newPortfolio = newPortfolio.map(f => ({
                        ...f,
                        weight: f.schemeCode === schemeCode ? 100 : 0
                    }));
                } else {
                    // Reduce other funds proportionally to make space for the new weight
                    const remainingWeightToDeduct = currentTotalWeight - 100;
                    const totalWeightOfOthers = currentTotalWeight - numValue;

                    newPortfolio = newPortfolio.map(f => {
                        if (f.schemeCode === schemeCode) return f;
                        const reduction = totalWeightOfOthers > 0 ? (f.weight / totalWeightOfOthers) * remainingWeightToDeduct : 0;
                        return { ...f, weight: Math.max(0, f.weight - reduction) };
                    });
                }
            }

            // SYNC VALUATIONS: Since weight changed, update valuations to keep ratio consistent
            // We use the existing totalValuation to scale the new weights
            newPortfolio = newPortfolio.map(f => ({
                ...f,
                valuation: (f.weight / 100) * totalValuation
            }));
            setPortfolio(newPortfolio);
        } else {
            // If in amount mode, recalculate weights based on NEW valuations
            const newTotalValuation = newPortfolio.reduce((sum, f) => sum + (f.valuation || 0), 0);
            const recalculatedPortfolio = newPortfolio.map(f => ({
                ...f,
                weight: newTotalValuation > 0 ? (f.valuation / newTotalValuation) * 100 : 0
            }));
            setPortfolio(recalculatedPortfolio);
        }
    };

    // Calculate Portfolio Metrics
    const { weightedAlpha, weightedBeta, weightedReturn, weightedVariance } = useMemo(() => {
        if (totalWeight <= 0) return { weightedAlpha: 0, weightedBeta: 0, weightedReturn: 0, weightedVariance: 0 };

        const horizon = user?.profile?.investmentHorizon || 1;
        const periodKey = horizon >= 10 ? '10yr' : (horizon >= 5 ? '5yr' : (horizon >= 3 ? '3yr' : '1yr'));

        return {
            weightedAlpha: portfolio.reduce((sum, f) => sum + (f.alpha * (f.weight / totalWeight)), 0),
            weightedBeta: portfolio.reduce((sum, f) => sum + (f.beta * (f.weight / totalWeight)), 0),
            weightedReturn: portfolio.reduce((sum, f) => {
                let fundReturn = 0;
                
                // DATA GROUNDING: Strictly match horizon. Do not fall back to 1Y momentum for 10Y projections.
                if (horizon >= 10) fundReturn = f.tenYearReturn;
                else if (horizon >= 5) fundReturn = f.fiveYearReturn;
                else if (horizon >= 3) fundReturn = f.threeYearReturn;
                else fundReturn = f.oneYearReturn;

                // If fund lacks specific history for this horizon, use category benchmark
                if (!fundReturn && benchmarks) {
                    const cat = f.category?.toLowerCase() || '';
                    if (cat.includes('equity') || cat.includes('cap') || cat.includes('elss') || cat.includes('index') || cat.includes('etf')) {
                        fundReturn = benchmarks.equity[periodKey] || benchmarks.equity['5yr'] || 12;
                    } else if (cat.includes('gold') || cat.includes('commodity')) {
                        fundReturn = benchmarks.gold[periodKey] || benchmarks.gold['1yr'] || 8;
                    } else {
                        fundReturn = benchmarks.debt[periodKey] || benchmarks.debt['1yr'] || 6;
                    }
                } else if (!fundReturn) {
                    // Final fallback if benchmarks haven't loaded
                    fundReturn = f.oneYearReturn || 0;
                }
                
                return sum + (fundReturn * (f.weight / totalWeight));
            }, 0),
            weightedVariance: portfolio.reduce((sum, f) => sum + ((f.variance1m || 0) * (f.weight / totalWeight)), 0)
        };
    }, [portfolio, totalWeight, user?.profile?.investmentHorizon, benchmarks]);

    // Group by category for chart
    const categoryData = useMemo(() => {
        const data = portfolio.reduce((acc, f) => {
            const cat = normalizeCategory(f.category, f.schemeName);

            const existing = acc.find(i => i.name === cat);
            if (existing) {
                existing.value += f.weight;
            } else {
                acc.push({ name: cat, value: f.weight });
            }
            return acc;
        }, []);

        return data.map(item => ({
            ...item,
            value: Number(item.value.toFixed(2))
        })).sort((a, b) => b.value - a.value);
    }, [portfolio]);

    const houseData = useMemo(() => {
        const data = portfolio.reduce((acc, f) => {
            // Case-insensitive normalization for consistent grouping (e.g., SBI vs sbi)
            const rawHouse = f.fundHouse || 'Other';
            const house = rawHouse.trim().toUpperCase();
            
            const existing = acc.find(i => i.name.toUpperCase() === house);
            if (existing) {
                existing.value += f.weight;
            } else {
                // Store with original casing for display, but subsequent matches will found it via toUpperCase()
                acc.push({ name: rawHouse.trim(), value: f.weight });
            }
            return acc;
        }, []);

        return data.map(item => ({
            ...item,
            value: Number(item.value.toFixed(2))
        })).sort((a, b) => b.value - a.value);
    }, [portfolio]);

    const activeChartData = useMemo(() => {
        const sourceData = chartView === 'category' ? categoryData : houseData;
        if (totalWeight <= 0 && portfolio.length > 0) {
            // Equal weights if no weights specified
            const reduced = portfolio.reduce((acc, f) => {
                const key = chartView === 'category' ? (f.category || 'Other') : (f.fundHouse || 'Other');
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            return Object.entries(reduced).map(([name, value]) => ({ 
                name, 
                value: (value / portfolio.length) * 100 
            })).sort((a, b) => b.value - a.value);
        }
        return sourceData;
    }, [chartView, categoryData, houseData, totalWeight, portfolio]);

    const COLORS = [
        '#6366f1', // Indigo (Institutional Primary)
        '#10b981', // Emerald (Positive Momentum)
        '#f59e0b', // Amber (Tactical/Warning)
        '#3b82f6', // Bright Blue (Growth)
        '#8b5cf6', // Violet (Alpha/Innovation)
        '#06b6d4', // Cyan (Liquid/Stability)
        '#ec4899', // Pink (High Beta)
        '#f97316', // Orange (Concentration)
        '#14b8a6', // Teal (Defensive)
        '#ef4444'  // Red (Correction/Negative)
    ];

    // Pre-calculate allocation data for the Growth Forecast Pie Chart
    const forecastAllocationData = useMemo(() => {
        if (!portfolio || portfolio.length === 0) return [];
        
        // Check if any funds have weight/valuation; if not, use equal distribution for the fallback visual
        const hasWeight = portfolio.some(f => (f.weight || 0) > 0 || (f.valuation || 0) > 0);
        
        const reduced = portfolio.reduce((acc, f) => {
            const cat = normalizeCategory(f.category, f.schemeName);
            if (hasWeight) {
                // Defensive check: use weight if available and positive, else fallback to valuation
                const weightVal = typeof f.weight === 'number' && !isNaN(f.weight) && f.weight > 0 ? f.weight : 0;
                const valuationVal = typeof f.valuation === 'number' && !isNaN(f.valuation) && f.valuation > 0 ? f.valuation : 0;
                
                // If weight is missing but valuation exists, uses valuation as a proxy for the mix
                const val = weightVal > 0 ? weightVal : (valuationVal > 0 ? valuationVal : 0);
                acc[cat] = (acc[cat] || 0) + val;
            } else {
                acc[cat] = (acc[cat] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.entries(reduced)
            .map(([name, value]) => ({
                name,
                value: Number(Number(value).toFixed(2))
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [portfolio]);

    const handleCasImport = (result) => {
        if (result.success && result.funds) {
            const casFunds = result.funds;
            
            // Create a merged portfolio
            const updatedPortfolio = [...portfolio];
            
            casFunds.forEach(casF => {
                const existingIdx = updatedPortfolio.findIndex(p => p.schemeCode === casF.schemeCode);
                if (existingIdx !== -1) {
                    // SUM valuations for the same scheme (handles multiple folios or reports)
                    updatedPortfolio[existingIdx] = {
                        ...updatedPortfolio[existingIdx],
                        valuation: (updatedPortfolio[existingIdx].valuation || 0) + casF.valuation,
                    };
                } else {
                    // Add new fund from CAS
                    updatedPortfolio.push({
                        schemeCode: casF.schemeCode,
                        schemeName: casF.schemeName,
                        casName: casF.casName,
                        category: casF.category,
                        valuation: casF.valuation,
                        weight: 0,
                        alpha: 0,
                        beta: 0,
                        oneYearReturn: 0
                    });
                }
            });

            // Recalculate weights for the entire merged portfolio based on new valuations
            const newTotalValuation = updatedPortfolio.reduce((sum, f) => sum + (f.valuation || 0), 0);
            const normalizedPortfolio = updatedPortfolio.map(f => ({
                ...f,
                weight: newTotalValuation > 0 ? (f.valuation / newTotalValuation) * 100 : 0
            }));

            setPortfolio(normalizedPortfolio);

            // Enrich details from database immediately
            enrichPortfolio(normalizedPortfolio);

            // Persistence
            savePortfolio(normalizedPortfolio);

            setMessage(`${result.message} (Merged with existing funds)`);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    if ((authLoading && !authTimedOut) || loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-primary)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Loading your portfolio...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
    if (!user || authTimedOut) return <PortfolioLockedState />;

    return (
        <div className="portfolio-container">
            <CasImportModal
                isOpen={isCasModalOpen}
                onClose={() => setIsCasModalOpen(false)}
                onImport={handleCasImport}
            />
            <FullReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                metrics={{
                    alpha: weightedAlpha,
                    beta: weightedBeta,
                    returns: weightedReturn,
                    variance1m: weightedVariance,
                    totalValuation: totalValuation,
                    funds: portfolio,
                    profile: user?.profile || {},
                    benchmarks
                }}
            />
            <header className="page-header mb-8 bg-[var(--bg-secondary)]/50 p-6 rounded-[2rem] border border-[var(--border-primary)] shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">Portfolio Intelligence</h1>
                            {user.profile?.isPremium && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">PREMIUM ACTIVE</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm font-medium opacity-70">Analyze and optimize your mutual fund holdings using real-world risk metrics and AI insights.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-[var(--bg-tertiary)] p-2 rounded-2xl border border-[var(--border-secondary)] shadow-inner">
                        <div className="flex flex-col items-end px-3">
                            <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Cloud Syncing</span>
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight flex items-center gap-1">
                                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
                                Institutional Node: Active
                            </span>
                        </div>
                        <div className="w-px h-8 bg-[var(--border-secondary)]"></div>
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
                             </svg>
                        </div>
                    </div>
                </div>
            </header>

            {/* NEW: Entry Method Choice Section - Forced Vertical */}
            <section className="mb-12 flex flex-col gap-10">
                <div className="flex flex-col gap-8">
                    {/* Path A: Automatic CAS Import (UNLOCKED FOR TESTING) */}
                    <div className="card entry-card cas-card" onClick={() => setIsCasModalOpen(true)}>
                        <div className="entry-content">
                            <div className="entry-icon">📤</div>
                            <div className="entry-text">
                                <h3 className="entry-title">Import CAS Statement</h3>
                                <p className="entry-description">
                                    Securely upload your NSDL/CDSL CAS PDF to automatically analyze your entire portfolio in seconds.
                                </p>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-sm px-8 upload-btn shadow-glow">
                            Upload PDF
                        </button>
                    </div>

                    {/* Stylized "OR" Separator */}
                    <div className="or-divider">
                        <div className="or-line-internal"></div>
                        <div className="or-badge-container">
                            <div className="or-badge-internal">OR</div>
                        </div>
                    </div>

                    {/* Path B: Manual Build / Write-up */}
                    <div 
                        className="card entry-card manual-card" 
                        onClick={() => document.querySelector('.search-input')?.focus()}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="entry-content">
                            <div className="entry-icon">✍️</div>
                            <div className="entry-text">
                                <h3 className="entry-title">Manual Portfolio Entry</h3>
                                <p className="entry-description">
                                    Manually search and write up your fund list to analyze hypothetical mixes or unlinked holdings.
                                </p>
                            </div>
                        </div>
                        <div className="entry-search" onClick={(e) => e.stopPropagation()}>
                            <MagicSearch onSelect={addFund} />
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex flex-col gap-12 w-full" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* Main Content Area - Forced Vertical */}
                <div className="flex flex-col gap-12 w-full">
                    <section className="card overflow-hidden">
                        <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30">
                            {/* Header Section */}
                            <div className="mb-6">
                                <div className="flex items-center gap-4 text-[var(--text-primary)] mb-1">
                                    <span className="w-8 h-8 rounded-lg bg-[var(--accent-primary-soft)] flex items-center justify-center text-[var(--accent-primary)] border border-[var(--border-primary)] shadow-inner">📋</span> 
                                    <h1 className="text-sm font-black uppercase tracking-[0.2em] m-0">Fund Inventory</h1>
                                </div>
                                <div className="pl-12">
                                    <p className="text-[7px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] opacity-60">Active Portfolio Management</p>
                                </div>
                            </div>
                            
                             {/* Actions Row - Forced Vertical Stack */}
                            <div className="flex flex-col items-start gap-6 w-full">
                                <div className="flex flex-row items-center gap-3">
                                    <button
                                        onClick={() => setInputMode('amount')}
                                        style={{
                                            backgroundColor: inputMode === 'amount' ? 'var(--accent-primary)' : 'var(--accent-primary-soft)',
                                            color: inputMode === 'amount' ? 'var(--text-inverse)' : 'var(--accent-primary)',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            border: '1px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: inputMode === 'amount' ? '0 4px 12px rgba(var(--accent-rgb, 99, 102, 241), 0.3)' : 'none',
                                            transform: inputMode === 'amount' ? 'scale(1.02)' : 'scale(1)'
                                        }}
                                    >
                                        <span style={{ fontSize: '13px' }}>₹</span>
                                        <span className="tracking-widest capitalize">Amount</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => setInputMode('weight')}
                                        style={{
                                            backgroundColor: inputMode === 'weight' ? 'var(--accent-primary)' : 'var(--accent-primary-soft)',
                                            color: inputMode === 'weight' ? 'var(--text-inverse)' : 'var(--accent-primary)',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            border: '1px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: inputMode === 'weight' ? '0 4px 12px rgba(var(--accent-rgb, 99, 102, 241), 0.3)' : 'none',
                                            transform: inputMode === 'weight' ? 'scale(1.02)' : 'scale(1)'
                                        }}
                                    >
                                        <span style={{ fontSize: '13px' }}>%</span>
                                        <span className="tracking-widest capitalize">Weight</span>
                                    </button>
                                </div>

                                {user && portfolio.length > 0 && (
                                    <div className="flex items-center gap-3" style={{ marginLeft: 'auto' }}>
                                        {isConfirmingClear ? (
                                            <div className="flex items-center gap-2 animate-fade-in relative-layer-10">
                                                <button
                                                    onClick={clearPortfolio}
                                                    className="btn btn-danger btn-sm"
                                                    style={{ letterSpacing: '0.05em' }}
                                                >
                                                    CONFIRM CLEAR
                                                </button>
                                                <button
                                                    onClick={() => setIsConfirmingClear(false)}
                                                    className="btn btn-outline btn-sm"
                                                    style={{ letterSpacing: '0.05em' }}
                                                >
                                                    CANCEL
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsConfirmingClear(true)}
                                                className="btn btn-danger btn-sm flex items-center gap-2 group relative-layer-5"
                                            >
                                                <span>🗑️</span>
                                                <span>Clear All</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => savePortfolio(portfolio)}
                                            disabled={saving}
                                            style={{
                                                background: 'var(--gradient-primary)',
                                                color: 'var(--text-inverse)',
                                                padding: '7px 16px',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.15em',
                                                border: '1px solid var(--mask-heavy)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: 'var(--shadow-md)',
                                                whiteSpace: 'nowrap'
                                            }}
                                            className="hover:shadow-lg hover:scale-[1.02] active:scale-95"
                                        >
                                            <span style={{ fontSize: '14px' }}>💾</span>
                                            <span>{saving ? 'Saving...' : 'Save Portfolio'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4">
                            {message && (
                                <div className="mb-6 p-4 rounded-xl text-xs font-bold text-center animate-fade-in"
                                     style={{
                                         backgroundColor: message.toLowerCase().includes('success') ? 'var(--color-positive-soft)' : 'var(--color-negative-soft)',
                                         color: message.toLowerCase().includes('success') ? 'var(--color-positive)' : 'var(--color-negative)',
                                         border: `1px solid ${message.toLowerCase().includes('success') ? 'var(--color-positive-soft)' : 'var(--color-negative-soft)'}`
                                     }}>
                                    {message}
                                </div>
                            )}

                            <div className="overflow-x-auto pb-6">
                                <div className="min-w-[1000px]">
                                    {/* RIGID GRID HEADER */}
                                    <div 
                                        className="px-8 pb-3 border-b border-[var(--border-secondary)] text-[13px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em]"
                                        style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '42% 21% 25% 12%', 
                                            alignItems: 'center' 
                                        }}
                                    >
                                        <div style={{ textAlign: 'left' }}>Scheme Name</div>
                                        <div style={{ textAlign: 'center' }}>Category</div>
                                        <div style={{ textAlign: 'center', color: '#60A5FA' }}>
                                            {inputMode === 'amount' ? 'Amount (₹)' : 'Weight %'}
                                        </div>
                                        <div style={{ textAlign: 'right', paddingRight: '8px' }}>Action</div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        {portfolio.map(fund => (
                                            <div 
                                                key={fund.schemeCode} 
                                                className="py-3 px-8 bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)] transition-all rounded-xl border border-[var(--border-secondary)] shadow-sm group clickable-row"
                                                onClick={() => router.push(`/fund/${fund.schemeCode}`)}
                                                style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: '42% 21% 25% 12%', 
                                                    alignItems: 'center' 
                                                }}
                                            >
                                                {/* Scheme Name Column */}
                                                <div style={{ paddingRight: '20px' }}>
                                                    <div style={{ 
                                                        fontWeight: '800', 
                                                        color: 'var(--text-primary)', 
                                                        fontSize: '12px', 
                                                        marginBottom: '4px',
                                                        lineHeight: '1.2',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.01em'
                                                    }} className="group-hover:text-[var(--accent-primary)] transition-colors">
                                                        {cleanSchemeName(fund.schemeName)}
                                                    </div>
                                                    <div className="flex flex-col" style={{ gap: '2px' }}>
                                                        <div style={{ 
                                                            fontSize: '8px', 
                                                            fontWeight: '700',
                                                            color: 'var(--text-muted)',
                                                            letterSpacing: '0.05em'
                                                        }}>CODE: {fund.schemeCode}</div>
                                                        {fund.casName && fund.casName !== fund.schemeName && (
                                                            <div style={{ 
                                                                fontSize: '7.5px', 
                                                                fontWeight: '600',
                                                                color: 'var(--accent-primary)',
                                                                opacity: '0.6',
                                                                textTransform: 'uppercase',
                                                                fontStyle: 'italic'
                                                            }}>Statement: {fund.casName}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Category Column */}
                                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                    <div style={{ 
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        backgroundColor: 'var(--bg-tertiary)',
                                                        border: '1px solid var(--border-secondary)',
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '10px',
                                                        fontWeight: '900',
                                                        letterSpacing: '0.15em',
                                                        textTransform: 'uppercase',
                                                        textAlign: 'center',
                                                        maxWidth: '140px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {normalizeCategory(fund.category, fund.schemeName)}
                                                    </div>
                                                </div>

                                                {/* Input Column */}
                                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                    <div className="flex flex-col items-center gap-1 w-full" style={{ maxWidth: '140px' }}>
                                                        {inputMode === 'weight' ? (
                                                            <div className="relative w-full flex items-center">
                                                                <input
                                                                    type="number"
                                                                    value={!fund.weight ? '' : Number(fund.weight.toFixed(2))}
                                                                    placeholder="0.00"
                                                                    onChange={(e) => updateWeight(fund.schemeCode, e.target.value)}
                                                                    onBlur={() => savePortfolio(portfolio)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    style={{
                                                                        backgroundColor: 'var(--bg-tertiary)',
                                                                        border: '1px solid var(--border-focus)',
                                                                        borderRadius: '6px',
                                                                        padding: '6px 8px',
                                                                        paddingRight: '28px',
                                                                        fontSize: '13px',
                                                                        fontWeight: '800',
                                                                        color: 'var(--text-primary)',
                                                                        textAlign: 'center',
                                                                        width: '100%',
                                                                        outline: 'none',
                                                                        boxShadow: 'var(--shadow-sm)'
                                                                    }}
                                                                />
                                                                <span className="absolute right-3.5 z-10 text-[12px] text-[var(--accent-primary)] font-black pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)' }}>%</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="relative w-full flex items-center">
                                                                    <span className="absolute left-3.5 z-10 text-[12px] text-[var(--color-positive)] font-black pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)' }}>₹</span>
                                                                    <input
                                                                        type="number"
                                                                        value={fund.valuation === 0 ? '' : fund.valuation}
                                                                        placeholder="0"
                                                                        onChange={(e) => updateWeight(fund.schemeCode, e.target.value)}
                                                                    onBlur={() => savePortfolio(portfolio)}
                                                                        onFocus={(e) => e.target.select()}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        style={{
                                                                            backgroundColor: 'var(--bg-tertiary)',
                                                                            border: '1px solid var(--color-positive)',
                                                                            borderRadius: '6px',
                                                                            padding: '6px 8px',
                                                                            paddingLeft: '28px',
                                                                            fontSize: '13px',
                                                                            fontWeight: '800',
                                                                            color: 'var(--text-primary)',
                                                                            textAlign: 'center',
                                                                            width: '100%',
                                                                            outline: 'none',
                                                                            boxShadow: 'var(--shadow-sm)'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span style={{ 
                                                                    fontSize: '11px', 
                                                                    color: 'var(--accent-primary)', 
                                                                    fontWeight: '900', 
                                                                    letterSpacing: '0.05em',
                                                                    textTransform: 'uppercase',
                                                                    opacity: '0.8'
                                                                }}>
                                                                    {(fund.weight || 0).toFixed(2)}% MIX
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Column */}
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFund(fund.schemeCode);
                                                        }}
                                                        className="group/del transition-all"
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '6px',
                                                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                                            border: '1px solid rgba(239, 68, 68, 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#EF4444',
                                                            cursor: 'pointer',
                                                            marginRight: '2px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.1)';
                                                        }}
                                                        title="Remove from portfolio"
                                                    >
                                                        <span className="group-hover/del:scale-110 transition-transform" style={{ fontSize: '14px' }}>🗑️</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {portfolio.length === 0 && (
                                        <div className="py-32 text-center opacity-30">
                                            <div className="text-6xl mb-6 grayscale">📊</div>
                                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Portfolio Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Category Mix - High Fidelity UI */}
                    <div id="category-mix-card" style={{ maxWidth: '900px', margin: '24px auto', width: '100%' }}>
                        <section style={{ 
                            background: 'var(--bg-secondary)', 
                            borderRadius: '24px', 
                            border: '1px solid var(--border-primary)', 
                            padding: '32px',
                            backdropFilter: 'var(--glass-blur)',
                            boxShadow: 'var(--shadow-lg)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ 
                                position: 'absolute', 
                                top: '0', 
                                right: '0', 
                                padding: '32px', 
                                opacity: '0.03', 
                                fontSize: '80px', 
                                fontWeight: '900', 
                                pointerEvents: 'none',
                                color: 'white'
                            }}>MIX</div>
                            
                            <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                alignItems: 'center', 
                                justifyContent: 'between', 
                                gap: '16px', 
                                marginBottom: '40px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                paddingBottom: '24px'
                            }}>
                                <div style={{ flex: '1' }}>
                                    <h2 style={{ 
                                        fontSize: '12px', 
                                        fontWeight: '900', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        color: 'var(--text-primary)', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.3em',
                                        margin: 0
                                    }}>
                                        <span style={{ 
                                            width: '10px', 
                                            height: '10px', 
                                            borderRadius: '50%', 
                                            backgroundColor: '#6366f1', 
                                            boxShadow: '0 0 12px rgba(99, 102, 241, 0.8)' 
                                        }}></span>
                                        Category Mix
                                    </h2>
                                    <p style={{ 
                                        fontSize: '10px', 
                                        color: '#64748b', 
                                        fontWeight: '700', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.2em', 
                                        marginTop: '4px', 
                                        opacity: '0.8' 
                                    }}>Asset Allocation Strategy</p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    {/* Slider Toggle - Refined Switch Design */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px',
                                        background: 'var(--bg-tertiary)',
                                        padding: '4px 16px',
                                        borderRadius: '99px',
                                        border: '1px solid var(--border-secondary)'
                                    }}>
                                        <span style={{ fontSize: '9px', fontWeight: '900', color: chartView === 'category' ? 'var(--text-primary)' : 'var(--text-muted)', letterSpacing: '0.1em' }}>CATEGORY</span>
                                        <div 
                                            onClick={() => setChartView(chartView === 'category' ? 'house' : 'category')}
                                            style={{ 
                                                width: '44px', 
                                                height: '24px', 
                                                backgroundColor: 'rgba(99, 102, 241, 0.2)', 
                                                borderRadius: '12px', 
                                                position: 'relative', 
                                                cursor: 'pointer',
                                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <div style={{ 
                                                position: 'absolute', 
                                                top: '2px', 
                                                left: chartView === 'category' ? '2px' : '22px', 
                                                width: '18px', 
                                                height: '18px', 
                                                backgroundColor: 'var(--accent-primary)', 
                                                borderRadius: '50%', 
                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                boxShadow: 'var(--shadow-glow)'
                                            }}></div>
                                        </div>
                                        <span style={{ fontSize: '9px', fontWeight: '900', color: chartView === 'house' ? 'var(--text-primary)' : 'var(--text-muted)', letterSpacing: '0.1em' }}>HOUSE</span>
                                    </div>

                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        padding: '6px 14px', 
                                        borderRadius: '99px', 
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                                        border: '1px solid rgba(16, 185, 129, 0.2)' 
                                    }}>
                                        <div style={{ 
                                            width: '6px', 
                                            height: '6px', 
                                            borderRadius: '50%', 
                                            backgroundColor: '#34d399', 
                                            boxShadow: '0 0 10px rgba(52, 211, 153, 0.8)' 
                                        }}></div>
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.2em' }}>REAL-TIME</span>
                                    </div>
                                </div>
                            </div>

                            {portfolio.length > 0 ? (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '48px',
                                    flexWrap: 'wrap'
                                }}>
                                    {/* 3D CHART AREA */}
                                    <div style={{ 
                                        position: 'relative', 
                                        width: '320px', 
                                        height: '320px', 
                                        display: 'grid', 
                                        placeItems: 'center' 
                                    }}>
                                        {/* 3D Pie Chart without central obstruction */}

                                        <div style={{ width: '100%', height: '100%', zIndex: 20 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <defs>
                                                        <filter id="pieOuterShadow" x="-20%" y="-20%" width="140%" height="140%">
                                                            <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                                                            <feOffset dx="0" dy="6" result="offsetblur" />
                                                            <feFlood floodColor="#000" floodOpacity="0.5" />
                                                            <feComposite in2="offsetblur" operator="in" />
                                                            <feMerge>
                                                                <feMergeNode />
                                                                <feMergeNode in="SourceGraphic" />
                                                            </feMerge>
                                                        </filter>
                                                        {activeChartData.map((_, index) => (
                                                            <radialGradient key={`grad-${index}`} id={`grad-${index}`} cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                                                                <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity="1" />
                                                                <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity="0.7" />
                                                            </radialGradient>
                                                        ))}
                                                    </defs>
                                                    <Pie
                                                        data={activeChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={0}
                                                        outerRadius="100%"
                                                        paddingAngle={1}
                                                        dataKey="value"
                                                        stroke="rgba(15, 23, 42, 0.5)"
                                                        strokeWidth={2}
                                                        animationDuration={400}
                                                        animationBegin={0}
                                                        filter="url(#pieOuterShadow)"
                                                        activeIndex={activeHoverIndex}
                                                        activeShape={(props) => {
                                                            const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                                                            const RADIAN = Math.PI / 180;
                                                            const offset = 10;
                                                            const sin = Math.sin(-RADIAN * midAngle);
                                                            const cos = Math.cos(-RADIAN * midAngle);
                                                            const nx = cx + offset * cos;
                                                            const ny = cy + offset * sin;
                                                            return (
                                                                <Sector
                                                                    cx={nx}
                                                                    cy={ny}
                                                                    innerRadius={innerRadius}
                                                                    outerRadius={outerRadius + 6}
                                                                    startAngle={startAngle}
                                                                    endAngle={endAngle}
                                                                    fill={fill}
                                                                    stroke="rgba(255,255,255,0.9)"
                                                                    strokeWidth={2}
                                                                />
                                                            );
                                                        }}
                                                        onMouseEnter={(_, index) => setActiveHoverIndex(index)}
                                                        onMouseLeave={() => setActiveHoverIndex(null)}
                                                    >
                                                        {activeChartData.map((entry, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={`url(#grad-${index})`}
                                                                style={{ cursor: 'pointer', outline: 'none' }}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div style={{ 
                                                                        background: 'var(--bg-secondary)', 
                                                                        backdropFilter: 'var(--glass-blur)', 
                                                                        border: '1px solid var(--border-primary)', 
                                                                        padding: '16px', 
                                                                        borderRadius: '12px', 
                                                                        boxShadow: 'var(--shadow-lg)'
                                                                    }}>
                                                                        <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>{payload[0].name}</p>
                                                                        <div style={{ height: '2px', width: '24px', backgroundColor: 'var(--accent-primary)', marginBottom: '12px' }}></div>
                                                                        <p style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>
                                                                            {totalWeight > 0 ? ((payload[0].value * 100 / totalWeight).toFixed(1)) : payload[0].value.toFixed(1)}%
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* PROFESSIONAL VERTICAL LEGEND */}
                                    <div style={{ 
                                        flex: '1', 
                                        minWidth: '280px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '12px' 
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 8px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Allocation Structure</span>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Weight</span>
                                        </div>
                                        {activeChartData.slice(0, 8).map((item, idx) => (
                                            <div key={item.name} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'space-between', 
                                                padding: '10px 16px', 
                                                borderRadius: '12px', 
                                                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                                                border: '1px solid rgba(255, 255, 255, 0.03)',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                                                    <div style={{ 
                                                        width: '8px', 
                                                        height: '8px', 
                                                        borderRadius: '50%', 
                                                        backgroundColor: COLORS[idx % COLORS.length],
                                                        boxShadow: `0 0 10px ${COLORS[idx % COLORS.length]}60`
                                                    }}></div>
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        fontWeight: '700', 
                                                        color: 'var(--text-primary)', 
                                                        textTransform: 'uppercase', 
                                                        letterSpacing: '0.05em',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {item.name || 'Other'}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                                    {totalWeight > 0 ? `${(item.value * 100 / totalWeight).toFixed(1)}%` : `${item.value.toFixed(1)}%`}
                                                </span>
                                            </div>
                                        ))}
                                        {activeChartData.length > 8 && (
                                            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                                                <span style={{ fontSize: '9px', fontWeight: '800', color: '#475569', fontStyle: 'italic' }}>+ {activeChartData.length - 8} more segments</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ py: '60px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '24px', opacity: '0.3' }}>📡</div>
                                    <p style={{ fontSize: '12px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4em' }}>Initializing Analytics Engine...</p>
                                </div>
                            )}
                        </section>
                    </div>

                <div className="flex flex-col gap-6 mt-6">
                    {/* Personalized Profile - THE ACTUAL CORE COMPONENT */}
                    <div className="card-glass rounded-[1.5rem] shadow-xl p-3 bg-blue-500/5 border border-blue-500/10">
                         <ProfileSettings user={user} sharedBenchmarks={benchmarks} />
                    </div>

                    {/* Health Score Section - Restored & Premium */}
                    <section className="card card-glass border-[var(--border-primary)] shadow-2xl p-6 rounded-[2rem] bg-[var(--bg-card)] relative overflow-hidden group">
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="text-xl text-[var(--accent-primary)]">✨</span> 
                                    Strategic Risk Style 
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider transition-all duration-500 shadow-sm ${
                                    weightedBeta < 0.7 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                        : weightedBeta > 1.1 
                                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}>
                                    DNA: {weightedBeta < 0.7 ? 'Conservative' : weightedBeta > 1.1 ? 'Aggressive' : 'Moderate'}
                                </span>
                            </div>
                            
                            <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-secondary)] shadow-lg gap-1 self-start lg:self-auto">
                                {['Conservative', 'Moderate', 'Aggressive'].map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => updateProfileSetting('riskAppetite', style)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all duration-200 ${
                                            (user.profile?.riskAppetite || 'Moderate') === style
                                                ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-indigo-500/20'
                                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                        }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 w-full">
                            <div className="flex-1 bg-[var(--bg-tertiary)]/50 border border-[var(--border-secondary)] p-5 rounded-2xl text-center shadow-inner relative overflow-hidden group/metric">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.1] text-5xl font-black group-hover/metric:scale-110 transition-transform" style={{ color: 'var(--text-muted)' }}>ALPHA</div>
                                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-[0.3em] mb-2">Alpha {portfolio.some(f => f.officialSource === 'AMC') ? '(Weighted AMC)' : '(Calculated)'}</div>
                                <div className={`text-4xl font-black tracking-tighter drop-shadow-sm ${weightedAlpha >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {weightedAlpha.toFixed(2)}
                                </div>
                            </div>
                            <div className="flex-1 bg-[var(--bg-tertiary)]/50 border border-[var(--border-secondary)] p-5 rounded-2xl text-center shadow-inner relative overflow-hidden group/metric">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.1] text-5xl font-black group-hover/metric:scale-110 transition-transform" style={{ color: 'var(--text-muted)' }}>BETA</div>
                                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-[0.3em] mb-2">Beta {portfolio.some(f => f.officialSource === 'AMC') ? '(Weighted AMC)' : '(Calculated)'}</div>
                                <div className={`text-4xl font-black tracking-tighter drop-shadow-sm ${
                                    (user.profile?.riskAppetite === 'Conservative' && weightedBeta > 0.85) || 
                                    (user.profile?.riskAppetite === 'Aggressive' && weightedBeta < 1.1)
                                        ? 'text-amber-400'
                                        : 'text-[var(--color-info)]'
                                }`}>
                                    {weightedBeta.toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <InsightCard
                                type={
                                    (user.profile?.riskAppetite === 'Aggressive' && weightedBeta < 1.05) || 
                                    (user.profile?.riskAppetite === 'Conservative' && weightedBeta > 0.7) || 
                                    (user.profile?.riskAppetite === 'Moderate' && (weightedBeta > 1.1 || weightedBeta < 0.6))
                                        ? 'risk' : 'success'
                                }
                                title={(user.profile?.riskAppetite || 'Moderate') + " Philosophy Alignment"}
                                description={(() => {
                                    const risk = user.profile?.riskAppetite || 'Moderate';
                                    const source = portfolio.some(f => f.officialSource === 'AMC') ? 'AMC-Verified' : 'NAV-Calculated';
                                    
                                    if (risk === 'Aggressive') {
                                        return weightedBeta < 1.1
                                            ? `Engine vs Speed Gap (${source}): You've selected an 'Aggressive' growth mandate, but your current fund selection is too cautious (Beta ${weightedBeta.toFixed(2)}). To maximize returns during market rallies, consider funds with higher sensitivity to catch the full momentum.`
                                            : `High-Performance DNA (${source}): Your portfolio is perfectly geared for aggressive growth. You have a high-sensitivity engine that captures maximum upside properly aligned with your strategy.`;
                                    } else if (risk === 'Conservative') {
                                        return weightedBeta > 0.7
                                            ? `Overspeed Warning (${source}): You've chosen a 'Conservative' mandate, but your specific funds are driving too fast for your safety zone (Beta ${weightedBeta.toFixed(2)}). Consider shifting some weight to lower-sensitivity assets to reduce market-dip impact.`
                                            : `Stable Fortress Engine (${source}): Your portfolio is exceptionally well-insulated. Your capital is geared for steady preservation while capturing inflation-beating returns with minimal volatility.`;
                                    } else {
                                        // Moderate logic
                                        if (weightedAlpha > 2 && (weightedBeta >= 0.7 && weightedBeta <= 1.1)) {
                                            return `Elite Balanced Strategy (${source}): Your 'Moderate' engine is in the sweet spot. You are generating superior returns (Alpha) without over-revving your risk (Beta ${weightedBeta.toFixed(2)}). This is a highly efficient custom strategy.`;
                                        } else if (weightedBeta > 1.1) {
                                            return `Aggressive Drift (${source}): Your 'Moderate' engine is currently driving at 'Aggressive' speeds (Beta ${weightedBeta.toFixed(2)}). While great for growth, expect larger fluctuations than a standard Moderate benchmark during dips.`;
                                        } else if (weightedBeta < 0.7) {
                                            return `Defensive Drift (${source}): Your 'Moderate' engine is currently idling at 'Conservative' speeds (Beta ${weightedBeta.toFixed(2)}). You are safe, but you might need more growth sensitivity to reach your long-term wealth goals.`;
                                        } else {
                                            return `Optimal Moderate Alignment (${source}): Your diversification is solid. Your engine size and driving speed are perfectly matched for balanced wealth creation.`;
                                        }
                                    }
                                })()}
                                actionText="Target Allocation Map"
                                onAction={() => {
                                    if (!user.profile?.isPremium) {
                                        setIsPricingModalOpen(true);
                                        return;
                                    }
                                    setIsReportModalOpen(true);
                                }}
                                isLocked={!user.profile?.isPremium}
                            />
                        </div>
                    </section>

                    {/* Strategic Alignment / Rebalancing Card */}
                    <section className="card card-glass border-[var(--border-primary)] shadow-2xl p-6 rounded-[2rem] bg-[var(--bg-card)] relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em] flex items-center gap-3">
                                <span className="text-xl text-[var(--color-info)]">⚖️</span> Strategic Alignment
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{(user.profile?.investmentHorizon || 5)}Y Horizon</span>
                                <div className="h-1 w-8 bg-[var(--accent-primary)] rounded-full"></div>
                            </div>
                        </div>

                        {(() => {
                            const horizon = user.profile?.investmentHorizon || 5;
                            const risk = user.profile?.riskAppetite || 'Moderate';
                            const proposal = getProposalWeights(risk, horizon);
                            
                            // Map existing portfolio to Equity/Debt/Gold/Other buckets using normalized categories
                            const actualGroups = { Equity: 0, Debt: 0, Gold: 0, Other: 0 };
                            portfolio.forEach(f => {
                                const weight = f.weight || 0;
                                const normalized = normalizeCategory(f.category, f.schemeName).toLowerCase();
                                
                                // Precise hierarchy mapping
                                if (normalized.startsWith('equity') || normalized.startsWith('hybrid')) {
                                    actualGroups.Equity += weight;
                                } else if (normalized.startsWith('debt')) {
                                    actualGroups.Debt += weight;
                                } else if (normalized.startsWith('metals')) {
                                    actualGroups.Gold += weight;
                                } else {
                                    actualGroups.Other += weight;
                                }
                            });

                            const metrics = [
                                { label: 'Equity', actual: actualGroups.Equity, target: proposal.equity, color: 'var(--accent-primary)' },
                                { label: 'Debt', actual: actualGroups.Debt, target: proposal.debt, color: 'var(--accent-secondary)' },
                                { label: 'Gold', actual: actualGroups.Gold, target: proposal.gold, color: '#f59e0b' }
                            ];

                            return (
                                <div className="space-y-6">
                                    {metrics.map((m) => {
                                        const diff = m.actual - m.target;
                                        return (
                                            <div key={m.label} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">{m.label}</span>
                                                        <span className="text-[9px] text-[var(--text-muted)] uppercase">Gap: {diff > 0 ? '+' : ''}{diff.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-lg font-black text-[var(--text-primary)]">{m.actual.toFixed(0)}%</span>
                                                        <span className="text-[10px] text-[var(--text-muted)] ml-2">vs {m.target}% target</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden flex relative">
                                                    {/* Target Marker */}
                                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10" style={{ left: `${m.target}%` }}></div>
                                                    
                                                    {/* Actual Progress */}
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                                                        style={{ 
                                                            width: `${Math.min(m.actual, 100)}%`, 
                                                            background: m.color,
                                                            boxShadow: `0 0 15px ${m.color}33`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="pt-4 mt-2 border-t border-[var(--border-secondary)]">
                                        <div className="bg-[var(--accent-primary-soft)]/20 p-4 rounded-xl border border-[var(--accent-primary-soft)]/30">
                                            <div className="flex items-start gap-3">
                                                <span className="text-lg">🎯</span>
                                                <div>
                                                    <div className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest mb-1">Rebalancing Action</div>
                                                    <p className="text-[11px] leading-relaxed text-[var(--text-primary)] font-medium">
                                                        {actualGroups.Other > 5 ? (
                                                            `Audit Required: You have ${actualGroups.Other.toFixed(0)}% in unclassified assets. Classify these to see an accurate ${risk} alignment.`
                                                        ) : (
                                                            Math.abs(actualGroups.Equity - proposal.equity) > 8 ? 
                                                            `Strategic Shift: Your Equity is ${(actualGroups.Equity > proposal.equity ? 'over' : 'under')}-allocated by ${Math.abs(actualGroups.Equity - proposal.equity).toFixed(0)}%. Rebalance to hit your ${proposal.equity}% Moderate target for this ${horizon}Y horizon.` :
                                                            actualGroups.Gold < proposal.gold - 5 ?
                                                            `Gold Gap: You are under-allocated in Gold. Consider increasing Metals - Gold to the recommended ${proposal.gold}% levels for inflation hedging.` :
                                                            "Portfolio Health: Your asset clusters are perfectly aligned with your long-term strategic targets."
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </section>

                    {/* Market Pulse Section - Restored Premium News Feed */}
                    <section className="card card-glass border-[var(--border-primary)] p-6 relative overflow-hidden group hover:bg-[var(--bg-card-hover)] transition-all shadow-2xl rounded-[2rem] bg-[var(--bg-card)]">
                        <div className="absolute -right-24 -top-24 w-64 h-64 bg-[var(--accent-primary-soft)] rounded-full blur-[100px] pointer-events-none group-hover:bg-[var(--accent-primary-soft)] transition-colors"></div>
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-4 mb-5 w-full">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl text-[var(--accent-primary)]">📡</span>
                                    <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">
                                        Real-Time Intelligence
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary-soft)] border border-[var(--accent-primary-soft)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>
                                    <span className="text-[9px] font-black text-[var(--accent-primary)] uppercase tracking-widest leading-none">LIVE FEED</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[300px] no-scrollbar">
                                {marketEvents && Array.isArray(marketEvents) && marketEvents.length > 0 ? (
                                    marketEvents.slice(0, 3).map((event, idx) => {
                                        if (!event || !event.url) return null;
                                        return (
                                            <a href={event.url} target="_blank" rel="noopener noreferrer" key={idx} className="flex gap-4 p-4 rounded-2xl cursor-pointer hover:bg-[var(--accent-primary-soft)] transition-all border border-transparent hover:border-[var(--border-secondary)] group/news hover:scale-[1.01] active:scale-95">
                                            <div className="w-0.5 h-auto self-stretch bg-[var(--accent-primary-soft)] rounded-full group-hover/news:bg-[var(--accent-primary)] transition-colors"></div>
                                            <div className="flex flex-col gap-1.5 text-left flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-[var(--accent-primary)] uppercase tracking-[0.15em] shrink-0">{event.source?.name || 'MARKET'}</span>
                                                    <span className="text-[9px] text-[var(--text-muted)]">•</span>
                                                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider shrink-0">
                                                        {event.publishedAt ? new Date(event.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'RECENT'}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] font-bold text-[var(--text-primary)] leading-snug group-hover/news:text-[var(--accent-primary)] transition-colors truncate">
                                                    {event.title}
                                                </p>
                                            </div>
                                        </a>
                                        )
                                    })
                                ) : (
                                    <div className="py-12 text-center relative overflow-hidden rounded-2xl border border-dashed border-white/10">
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/10 animate-spin flex items-center justify-center">
                                                 <span className="text-lg opacity-20">📡</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Scanning Global Markets...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* MODERN: Market Impact Intelligence Card - BENTO STYLE REFINED & COMPACT */}
                    <section className="relative overflow-hidden group mb-8">
                        {/* SUBTLE BACKGROUND DECORATION */}
                        <div className="absolute top-0 left-1/4 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none opacity-40"></div>
                        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none opacity-40"></div>
                        
                        <div className="card card-glass border-[var(--border-primary)] p-4 rounded-[1.5rem] bg-[var(--bg-card)]/80 backdrop-blur-xl relative z-10 transition-all hover:bg-[var(--bg-card)] shadow-xl overflow-hidden">
                            <div className="flex flex-row items-center gap-6 overflow-x-auto no-scrollbar py-2">
                                
                                {/* TRIGGER BOX (BENTO SLOT 1) */}
                                <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5 pr-6 shrink-0 min-w-[220px]">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-[0_4px_15px_rgba(99,102,241,0.3)] shrink-0">
                                        <div className="w-full h-full rounded-xl bg-[#0a0f1e] flex items-center justify-center">
                                            <span className="text-2xl">⚡</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] leading-none">
                                            Impact <span className="text-indigo-400">Analysis</span>
                                        </h3>
                                        <button 
                                            onClick={() => {
                                                setIsImpactModalOpen(true);
                                            }}
                                            style={{ background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)' }}
                                            className="px-4 py-2 rounded-lg transition-all text-[10px] font-black text-white uppercase tracking-widest shadow-lg flex items-center gap-2 group/btn active:scale-95 hover:brightness-110"
                                        >
                                            <span>Simulate</span>
                                            <span className="text-xs group-hover/btn:translate-x-1 transition-transform">→</span>
                                        </button>
                                    </div>
                                </div>

                                {/* METRICS GRID (BENTO SLOT 2) */}
                                <div className="flex-1 flex flex-row gap-4 min-w-max">
                                    <div className="px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-center min-w-[150px] group/metric hover:bg-white/[0.04] transition-all">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/metric:text-indigo-400">Target Event</span>
                                        <span className="text-[11px] font-black text-white uppercase truncate" title={activeScenario.name}>{activeScenario.name}</span>
                                    </div>
                                    
                                    <div className="px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-center min-w-[120px] group/metric hover:bg-white/[0.04] transition-all">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/metric:text-indigo-400">Sensitivity</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black text-white">{weightedBeta.toFixed(2)}x</span>
                                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">BETA</span>
                                        </div>
                                    </div>

                                    <div className="px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-center min-w-[120px] group/metric hover:bg-white/[0.04] transition-all">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover/metric:text-indigo-400">Proj. Impact</span>
                                        <span className={`text-base font-black tracking-tighter ${(activeScenario.shock * weightedBeta) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {(activeScenario.shock * weightedBeta).toFixed(2)}%
                                        </span>
                                    </div>

                                    <div className="px-5 py-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-center min-w-[140px] group/metric hover:bg-indigo-500/10 transition-all">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Live Engine</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">Scanning News...</span>
                                    </div>
                                </div>

                                {/* AI INSIGHT MINI (BENTO SLOT 3) */}
                                <div className="flex items-center gap-4 bg-white/[0.01] p-5 rounded-2xl border border-white/[0.05] min-w-[280px] shrink-0">
                                    <div className="text-[18px] opacity-40 shrink-0">🤖</div>
                                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic line-clamp-2">
                                        {weightedBeta > 1.1 ? "Market rallies will amplify your gains." : weightedBeta < 0.9 ? "Defensive core protecting your portfolio." : "Moving in lock-step with the broader economy."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>



            {/* NEW: Market Impact Analysis Modal */}
            {isImpactModalOpen && (
                <div className="modal-overlay" onClick={() => setIsImpactModalOpen(false)}>
                    <div className="modal-content !max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl font-black text-white flex items-center gap-2">
                                    <span className="text-accent-primary">⚡</span> Impact Analysis
                                </h2>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{chartView === 'category' ? 'Category Allocation Strategy' : 'AMC House Concentration'}</p>
                            </div>
                            <button onClick={() => setIsImpactModalOpen(false)} className="w-8 h-8 flex-center rounded-full hover:bg-white/10 transition-colors text-xl">×</button>
                        </div>

                        <div className="modal-body space-y-6 pt-2">
                            {/* PREMIUM TOGGLE SECTION */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Simulation Scenario</span>
                                    </div>
                                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                                        <button 
                                            onClick={() => setChartView('category')}
                                            className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${chartView === 'category' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                            title="View portfolio by Category Breakdown"
                                        >
                                            CAT
                                        </button>
                                        <button 
                                            onClick={() => setChartView('house')}
                                            className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${chartView === 'house' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                            title="View portfolio by Fund House"
                                        >
                                            AMC
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {SCENARIOS.map(s => {
                                        const isActive = activeScenario.id === s.id;
                                        const emoji = s.id === 'west-asia' ? '🔥' : s.id === 'gdp' ? '📊' : s.id === 'fed-hike' ? '🏦' : '💻';
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setActiveScenario(s)}
                                                style={{
                                                    position: 'relative',
                                                    padding: '10px 18px',
                                                    borderRadius: '12px',
                                                    fontSize: '10px',
                                                    fontWeight: '900',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.1s ease',
                                                    outline: 'none',
                                                    color: isActive ? '#fff' : '#94a3b8',
                                                    background: isActive
                                                        ? 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)'
                                                        : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                                                    border: isActive
                                                        ? '1px solid rgba(99,102,241,0.8)'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                    boxShadow: isActive
                                                        ? '0 5px 0 0 #312e81, 0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                                                        : '0 5px 0 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                                                }}
                                                onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isActive ? '0 5px 0 0 #312e81, 0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 5px 0 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isActive ? '0 5px 0 0 #312e81, 0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 5px 0 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'; }}
                                            >
                                                {/* Top glass reflection line */}
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px 12px 0 0' }} />
                                                <span style={{ fontSize: '13px', marginRight: '6px' }}>{emoji}</span>
                                                <span>{s.name.split(' ')[0]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-deep border-white-faint shadow-inner">
                                <h3 className="text-2xs font-black text-accent-primary mb-4 uppercase tracking-widest border-b pb-2 flex items-center justify-between" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                                    <span>Mathematical Determination</span>
                                    <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${activeScenario.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : activeScenario.severity === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                        {activeScenario.severity} Risk
                                    </span>
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-secondary font-bold uppercase">Target Event</span>
                                            <span className="text-[8px] text-slate-500 font-medium max-w-[180px] leading-tight">{activeScenario.description}</span>
                                        </div>
                                        <span className="text-xs font-bold text-white text-right max-w-[120px] leading-tight">{activeScenario.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-secondary font-bold uppercase">Shock Magnitude (Projected)</span>
                                        <span className="text-xs font-mono font-bold" style={{ color: activeScenario.shock < 0 ? '#f87171' : '#34d399' }}>{activeScenario.shock.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-secondary font-bold uppercase">Portfolio Beta (True Sensitivity)</span>
                                        <span className="text-xs font-mono font-bold text-accent-primary" style={{ color: '#818cf8' }}>{weightedBeta.toFixed(2)}x</span>
                                    </div>
                                    <div className="pt-4 flex justify-between items-end" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <div className="flex flex-col">
                                            <span className="text-3xs text-muted font-black uppercase tracking-widest">Net Impact</span>
                                            <span className="text-[10px] text-muted font-medium italic">(Simulation Result)</span>
                                        </div>
                                        <span className="text-3xl font-black tracking-tighter" style={{ color: (activeScenario.shock * weightedBeta) < 0 ? '#f87171' : '#34d399' }}>
                                            {(activeScenario.shock * weightedBeta).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-2xs font-black text-accent-primary uppercase tracking-widest">Strategic Guidance</h3>
                                <div className="space-y-3">
                                    <p className="text-xs text-secondary leading-relaxed">
                                        In the event of a <strong>{activeScenario.name}</strong>, a projected <strong>{(activeScenario.shock * weightedBeta).toFixed(2)}% drawdown</strong> is estimated based on your <strong>Portfolio Beta ({weightedBeta.toFixed(2)}x)</strong>.
                                    </p>
                                    <p className="text-xs text-muted leading-relaxed italic">
                                        "This simulation uses real-time beta correlations recorded over the last 3 years. Since your portfolio is {weightedBeta > 1 ? 'more' : 'less'} sensitive than the market, you will absorb approximately <strong>{Math.abs(weightedBeta * 100).toFixed(0)}%</strong> of the macroeconomic shock."
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl flex gap-3 shadow-inner" style={{ background: 'rgba(129, 140, 248, 0.05)', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                                    <span className="text-lg">🎯</span>
                                    <p className="text-xs font-medium leading-normal text-indigo-300">
                                        <strong>ADVISORY:</strong> {weightedBeta > 1.2 ? "Consider shifting 12-15% into Liquid funds to minimize delta during this specific event." : "Your defensive positioning is optimal for this scenario. No immediate action required."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer pt-2">
                            <button
                                onClick={() => setIsImpactModalOpen(false)}
                                className="w-full py-4 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl active:scale-[0.98] border border-white/10 group/ack"
                                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}
                            >
                                <span className="group-hover/ack:tracking-[0.4em] transition-all">ACKNOWLEDGE SIMULATION</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="mt-4 py-8 border-t border-primary text-center">
                <p className="text-xs text-muted max-w-2xl mx-auto leading-relaxed uppercase tracking-widest font-medium opacity-60">
                    DISCLAIMER: We are not SEBI registered investment advisors. All data, metrics (Alpha/Beta), and AI-generated insights are for educational & research purposes only. Mutual fund investments are subject to market risks. Please consult a certified professional before making any financial decisions.
                </p>
            </footer>
            <PricingModal 
                isOpen={isPricingModalOpen} 
                onClose={() => setIsPricingModalOpen(false)} 
            />
            {/* Close main content containers */}
            </div>
        </div>
    );
}
