'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { formatNAV, formatPercent, getChangeClass } from '@/lib/formatters';

export default function WatchlistPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrichedFunds, setEnrichedFunds] = useState({});
    const [toast, setToast] = useState(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Load watchlist from Firestore
    useEffect(() => {
        if (!user) return;

        const loadWatchlist = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'users', user.uid, 'watchlist'));
                const funds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setWatchlist(funds);
                setLoading(false);

                // Enrich with live data
                for (const fund of funds) {
                    try {
                        const res = await fetch(`/api/funds/${fund.schemeCode}`);
                        if (res.ok) {
                            const data = await res.json();
                            setEnrichedFunds(prev => ({ ...prev, [fund.schemeCode]: data }));
                        }
                    } catch { }
                }
            } catch (err) {
                setLoading(false);
            }
        };

        loadWatchlist();
    }, [user]);

    const removeFund = async (schemeCode) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'watchlist', schemeCode));
            setWatchlist(prev => prev.filter(f => f.schemeCode !== schemeCode && f.id !== schemeCode));
            setToast({ type: 'success', message: 'Removed from watchlist' });
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast({ type: 'error', message: 'Failed to remove' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    if (authLoading || (!user && !authLoading)) {
        return (
            <div>
                <div className="page-header"><h1>Watchlist</h1></div>
                <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div className="skeleton skeleton-title" style={{ margin: '0 auto', width: '200px' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {toast && (
                <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    {toast.message}
                </div>
            )}

            <div className="page-header">
                <h1>My Watchlist</h1>
                <p>Your privately saved mutual funds</p>
            </div>

            {loading ? (
                <div className="card">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton skeleton-text" style={{ width: `${80 - i * 10}%`, marginBottom: '16px' }}></div>
                    ))}
                </div>
            ) : watchlist.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">⭐</div>
                    <h3>Your watchlist is empty</h3>
                    <p>Search for funds and add them to your watchlist to track them here.</p>
                    <Link href="/search" className="btn btn-primary" style={{ marginTop: '16px' }}>
                        Search Funds
                    </Link>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fund Name</th>
                                    <th style={{ textAlign: 'right' }}>NAV</th>
                                    <th style={{ textAlign: 'right' }}>Daily Change</th>
                                    <th style={{ textAlign: 'right' }}>1Y Return</th>
                                    <th>Category</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {watchlist.map(fund => {
                                    const enriched = enrichedFunds[fund.schemeCode];
                                    return (
                                        <tr 
                                            key={fund.schemeCode || fund.id}
                                            className="clickable-row"
                                            onClick={() => router.push(`/fund/${fund.schemeCode}`)}
                                        >
                                            <td>
                                                <Link
                                                    href={`/fund/${fund.schemeCode}`}
                                                    style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}
                                                >
                                                    {fund.schemeName || `Scheme ${fund.schemeCode}`}
                                                </Link>
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                                                {enriched ? formatNAV(enriched.nav) : '...'}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {enriched ? (
                                                    <span className={getChangeClass(enriched.dailyChangePercent)}>
                                                        {formatPercent(enriched.dailyChangePercent)}
                                                    </span>
                                                ) : '...'}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {enriched ? (
                                                    <span className={getChangeClass(enriched.cagr?.['1yr'])}>
                                                        {enriched.cagr?.['1yr'] != null ? formatPercent(enriched.cagr['1yr']) : '—'}
                                                    </span>
                                                ) : '...'}
                                            </td>
                                            <td>
                                                <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
                                                    {fund.schemeCategory || enriched?.schemeCategory || '—'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFund(fund.schemeCode || fund.id);
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
