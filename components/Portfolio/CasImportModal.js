'use client';

import { useState } from 'react';

export default function CasImportModal({ isOpen, onClose, onImport }) {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setError('');
        } else {
            setError('Please select a valid PDF file.');
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a CAS PDF file.');
            return;
        }
        setImporting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('password', password);

            const response = await fetch('/api/portfolio/import-cas', {
                method: 'POST',
                body: formData
            });

            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error('Server returned an unexpected format. This usually means the request timed out or the server crashed. Please try again.');
            }

            if (!response.ok) {
                // Prioritize descriptive message from API if available
                throw new Error(data.message || data.error || 'Failed to analyze CAS');
            }

            if (!data.success) {
                throw new Error(data.message || 'Failed to identify holdings in this PDF.');
            }

            if (!data.funds || data.funds.length === 0) {
                throw new Error('No mutual fund holdings could be identified in this PDF.');
            }

            // Callback to parent with actual fund data
            onImport({
                success: true,
                message: data.message,
                funds: data.funds
            });

            onClose();
        } catch (err) {
            setError(err.message || 'Failed to parse CAS statement. Ensure it is a valid CAMS/KFintech PDF.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: '#111827',
                    width: '100%',
                    maxWidth: '440px',
                    borderRadius: '20px',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    animation: 'modalSlideUp 0.3s ease-out'
                }}
            >
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(17, 24, 39, 0.5)',
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        color: '#f0f4ff',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span>📤</span> Import CAS Statement
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#94a3b8',
                            fontSize: '24px',
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <p style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            lineHeight: '1.6',
                            margin: 0
                        }}>
                            Upload your <strong style={{ color: '#f0f4ff' }}>CAMS/KFintech</strong> Consolidated Account Statement (CAS) PDF.
                            We extract your data locally to calculate risk metrics.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                            position: 'relative',
                            border: '2px dashed rgba(99, 102, 241, 0.3)',
                            borderRadius: '16px',
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(99, 102, 241, 0.03)',
                            transition: 'all 0.2s'
                        }}>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                                accept=".pdf"
                            />
                            {file ? (
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📄</span>
                                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#f0f4ff', margin: 0 }}>{file.name}</p>
                                    <span style={{ fontSize: '10px', color: '#6366f1', textDecoration: 'underline', marginTop: '4px', display: 'block' }}>Change File</span>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.5 }}>📄</span>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Click or drag CAS PDF here</p>
                                    <p style={{ fontSize: '9px', color: '#475569', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Max 10MB</p>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{
                                fontSize: '10px',
                                fontWeight: '900',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '1.5px',
                                paddingLeft: '4px'
                            }}>
                                PDF Password (if protected)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Your PAN or specific password"
                                style={{
                                    width: '100%',
                                    backgroundColor: '#0a0e1a',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    fontSize: '14px',
                                    color: '#ffffff',
                                    outline: 'none',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                                }}
                            />
                            <p style={{ fontSize: '9px', color: '#475569', fontStyle: 'italic', paddingLeft: '4px', margin: 0 }}>
                                * Your password is never stored or transmitted.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontSize: '12px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '24px',
                    backgroundColor: 'rgba(10, 14, 26, 0.4)',
                    display: 'flex',
                    gap: '16px',
                    borderTop: '1px solid rgba(148, 163, 184, 0.05)'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid #334155',
                            backgroundColor: 'transparent',
                            color: '#94a3b8',
                            fontSize: '12px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        style={{
                            flex: 2,
                            padding: '12px',
                            borderRadius: '12px',
                            backgroundColor: '#6366f1',
                            backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '800',
                            textAlign: 'center',
                            border: 'none',
                            cursor: importing ? 'not-allowed' : 'pointer',
                            opacity: importing ? 0.7 : 1,
                            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {importing ? 'Analyzing...' : 'Analyze Portfolio'}
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
