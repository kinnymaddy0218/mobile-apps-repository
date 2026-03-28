'use client';

import React from 'react';
import Link from 'next/link';

export default function PortfolioLockedState() {
    // Bulletproof shared button styles to guarantee the "bold box" look
    const btnBase = {
        padding: '16px 32px',
        borderRadius: '14px',
        fontSize: '16px',
        fontWeight: '900', // Ultra Bold
        textDecoration: 'none',
        textAlign: 'center',
        minWidth: '180px',
        display: 'inline-block',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer'
    };

    const primaryStyle = {
        ...btnBase,
        backgroundColor: '#4f46e5', // Direct Indigo
        color: 'white',
        boxShadow: '0 8px 16px rgba(79, 70, 229, 0.4)',
    };

    const secondaryStyle = {
        ...btnBase,
        backgroundColor: '#7c3aed', // Direct Purple
        color: 'white',
        boxShadow: '0 8px 16px rgba(124, 58, 237, 0.3)',
    };

    return (
        <div className="locked-state-wrapper">
            <div className="locked-card">
                <div className="accent-line" />

                <div className="content-container">
                    <div className="hero-badge">
                        🔒 Secured Portfolio Intelligence
                    </div>

                    <h1 className="hero-title">
                        Unlock Your Full <br />
                        <span className="gradient-text">Investment Potential</span>
                    </h1>

                    <p className="hero-subtitle">
                        Join thousands of investors using AlphaEngine to analyze risk, auto-sync holdings, and receive AI-powered recommendations.
                    </p>

                    <div className="features-grid">
                        <div className="feature-item indigo">
                            <div className="feature-icon">📊</div>
                            <h3 className="feature-label">Risk Analytics</h3>
                            <p className="feature-desc">Alpha, Beta, and Volatility profiling for your holdings.</p>
                        </div>
                        <div className="feature-item purple">
                            <div className="feature-icon">🤖</div>
                            <h3 className="feature-label">AI Insights</h3>
                            <p className="feature-desc">Intelligent, data-driven advice tailored to your goals.</p>
                        </div>
                        <div className="feature-item emerald">
                            <div className="feature-icon">📂</div>
                            <h3 className="feature-label">CAS Auto-Sync</h3>
                            <p className="feature-desc">Seamlessly import your entire portfolio from a PDF.</p>
                        </div>
                    </div>

                    {/* Action Buttons - Pure Inline React Styles to bypass any CSS processing issues */}
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', width: '100%', flexWrap: 'wrap', marginTop: '10px' }}>
                        <Link href="/login" style={primaryStyle} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            Sign In to Start
                        </Link>

                        <Link href="/signup" style={secondaryStyle} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            Create Account
                        </Link>
                    </div>

                    <div className="trust-footer">
                        <span>Private & Secure</span>
                        <div className="dot" />
                        <span>SEBI Compliant</span>
                        <div className="dot" />
                        <span>No Data Sharing</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .locked-state-wrapper {
                    width: 100%;
                    min-height: 85vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    background-color: var(--bg-primary, #0a0e1a);
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                .locked-card {
                    width: 100%;
                    max-width: 900px;
                    background: var(--bg-card, rgba(17, 24, 39, 0.8));
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.1));
                    border-radius: 40px;
                    padding: 80px 40px;
                    position: relative;
                    overflow: hidden;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .accent-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                }

                .content-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 20px;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 999px;
                    color: #818cf8;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 32px;
                }

                .hero-title {
                    font-size: 56px;
                    font-weight: 800;
                    line-height: 1.1;
                    letter-spacing: -2px;
                    color: #f0f4ff;
                    margin-bottom: 24px;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .hero-subtitle {
                    font-size: 20px;
                    line-height: 1.6;
                    color: #94a3b8;
                    max-width: 600px;
                    margin: 0 auto 56px;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    width: 100%;
                    margin-bottom: 64px;
                    text-align: left;
                }

                .feature-item {
                    padding: 32px 24px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    transition: all 0.3s ease;
                }

                .feature-item:hover {
                    background: rgba(255, 255, 255, 0.06);
                    transform: translateY(-5px);
                    border-color: #6366f1;
                }

                .feature-icon {
                    font-size: 28px;
                    margin-bottom: 20px;
                }

                .feature-label {
                    font-size: 14px;
                    font-weight: 800;
                    color: #ffffff;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .feature-desc {
                    font-size: 12px;
                    line-height: 1.5;
                    color: #64748b;
                }

                .trust-footer {
                    margin-top: 80px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    font-size: 10px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 2.5px;
                }

                .dot {
                    width: 5px;
                    height: 5px;
                    background: #64748b;
                    border-radius: 50%;
                }

                @media (max-width: 850px) {
                    .features-grid { grid-template-columns: 1fr; }
                    .locked-card { padding: 60px 30px; }
                    .hero-title { font-size: 40px; }
                }
            `}</style>
        </div>
    );
}
