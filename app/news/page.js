'use client';

import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/lib/formatters';

export default function NewsPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                setArticles(data.articles || []);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load news');
                setLoading(false);
            });
    }, []);

    const refresh = () => {
        setLoading(true);
        setError(null);
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                setArticles(data.articles || []);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load news');
                setLoading(false);
            });
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>MF News</h1>
                    <p>Latest Indian mutual fund news and updates</p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={refresh} disabled={loading}>
                    🔄 Refresh
                </button>
            </div>

            {loading ? (
                <div className="grid grid-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="card skeleton skeleton-card" style={{ height: '120px' }}></div>
                    ))}
                </div>
            ) : error ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">📰</div>
                    <h3>{error}</h3>
                    <button className="btn btn-primary" onClick={refresh} style={{ marginTop: '16px' }}>
                        Try Again
                    </button>
                </div>
            ) : articles.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">📰</div>
                    <h3>No news available</h3>
                    <p>Check back later for the latest mutual fund news.</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {articles.map((article, i) => (
                        <a
                            key={i}
                            href={article.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card animate-fade-in"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                animationDelay: `${i * 0.05}s`,
                            }}
                        >
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                                {article.title}
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                                    {article.source?.name || 'Google News'}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {article.publishedAt ? formatRelativeTime(article.publishedAt) : ''}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
