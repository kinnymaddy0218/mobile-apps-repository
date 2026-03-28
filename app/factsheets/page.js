'use client';

import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, FileText, AlertCircle, Search, SearchCheck, Loader2 } from 'lucide-react';

export default function FactsheetHubPage() {
    const [amcs, setAmcs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        async function fetchAmcs() {
            try {
                const res = await fetch('/api/factsheets/amcs');
                if (!res.ok) throw new Error('Failed to fetch AMC factsheets');
                const data = await res.json();
                setAmcs(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAmcs();
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.length < 3) {
                setSearchResults([]);
                return;
            }
            setSearching(true);
            try {
                const res = await fetch(`/api/factsheets/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                setSearchResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-zinc-500 animate-pulse font-medium">Loading Consolidated Factsheets...</p>
        </div>
    );

    if (error) return (
        <div className="p-12 text-center border border-red-500/20 rounded-2xl bg-red-500/5 mt-10 max-w-2xl mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-400 mb-2">Error Loading Hub</h1>
            <p className="text-red-400/70">{error}</p>
        </div>
    );

    const availableCount = amcs.filter(a => a.hasDirectLink).length;

    return (
        <div className="animate-in fade-in duration-700 space-y-8 pb-20 max-w-7xl mx-auto px-4 mt-8">
            <div className="page-header border-b border-zinc-800 pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-600 bg-clip-text text-transparent mb-3 tracking-tight">
                            Consolidated Factsheets
                        </h1>
                        <p className="text-zinc-400 font-medium max-w-2xl leading-relaxed">
                            Official monthly portfolio disclosures from pure-play asset management companies. Access verified, unmodified PDF documents straight from the source.
                        </p>
                    </div>
                    <div className="flex gap-4 shrink-0">
                        <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center">
                            <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Available AMCs</div>
                            <div className="text-2xl font-mono text-emerald-400 font-bold">{availableCount} <span className="text-zinc-600 text-lg">/ {amcs.length}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Search Section */}
            <div className="relative z-20">
                <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl focus-within:border-emerald-500/50 transition-all duration-300">
                    <Search className={`w-5 h-5 ${searching ? 'text-emerald-500 animate-pulse' : 'text-zinc-500'}`} />
                    <input 
                        type="text" 
                        placeholder="Search for any Mutual Fund to verify Data Scraper availability..." 
                        className="bg-transparent border-none outline-none text-zinc-200 w-full font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searching && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="p-3 bg-zinc-800/50 border-b border-zinc-800">
                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Matched Scraper Targets</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {searchResults.map((res, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-emerald-500/5 group border-b border-zinc-800/50 last:border-none transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">{res.name}</span>
                                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{res.category}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-zinc-600 font-mono">{res.schemecode}</span>
                                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                            <SearchCheck className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Available</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {amcs.map((amc, i) => (
                    <div key={i} className="group relative overflow-hidden border border-zinc-800/50 rounded-2xl bg-zinc-900/30 hover:bg-zinc-800/40 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-xl">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="p-5 flex flex-col h-full relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${amc.hasDirectLink ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-white tracking-tight">{amc.name.replace('Mutual Fund', '').trim()}</h3>
                                </div>
                                {amc.hasDirectLink && (
                                    <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                        Latest
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex-grow">
                                <p className="text-xs text-zinc-500 font-medium">
                                    {amc.hasDirectLink ? 'Monthly Portfolio & Risk Parameters' : 'Factsheet processing...'}
                                </p>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-zinc-800/50">
                                {amc.hasDirectLink ? (
                                    <a 
                                        href={amc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between w-full px-4 py-2.5 bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white rounded-xl transition-all duration-300 text-sm font-semibold group/btn"
                                    >
                                        <span>View Document</span>
                                        <ExternalLink className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                    </a>
                                ) : (
                                    <button 
                                        disabled
                                        className="flex items-center justify-center w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded-xl text-sm font-medium cursor-not-allowed"
                                    >
                                        Pending Cron Sync
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mt-8">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-emerald-400 text-xs font-black uppercase tracking-[0.15em] mb-2">Automated Refresh Cycle</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                            Documents are automatically synced via background crons directly from AMC datacenters on a monthly cadence. 
                            If a link is pending, the current month's factsheet has not yet been fully published or verified by the respective Asset Management Company.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

