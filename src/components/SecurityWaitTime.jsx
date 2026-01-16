import React, { useState, useEffect } from 'react';
import { swedaviaService } from '../services/swedaviaApi';

export const SecurityWaitTime = ({ airportIata }) => {
    const [waitTime, setWaitTime] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!airportIata) return;

        const fetchWaitTime = async () => {
            setLoading(true);
            const time = await swedaviaService.getWaitTime(airportIata);
            setWaitTime(time);
            setLoading(false);
        };

        fetchWaitTime();
        const interval = setInterval(fetchWaitTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [airportIata]);

    if (!airportIata || (!waitTime && !loading)) return null;

    return (
        <div className="glass-card fade-in" style={{
            padding: '1rem 1.5rem',
            maxWidth: '300px',
            margin: '1rem auto',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <div style={{ color: 'var(--primary)', position: 'relative', display: 'flex' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            </div>
            <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Säkerhetskontroll
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    {loading ? '...' : (waitTime !== null ? `${waitTime} min` : 'Ingen data')}
                </div>
            </div>

            {waitTime !== null && (
                <div style={{
                    height: '4px',
                    flex: 1,
                    background: 'var(--glass-border)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginLeft: 'auto'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${Math.min(100, (waitTime / 20) * 100)}%`,
                        background: waitTime > 15 ? '#ef4444' : (waitTime > 7 ? '#f59e0b' : '#10b981'),
                        transition: 'width 0.5s ease'
                    }}></div>
                </div>
            )}
        </div>
    );
};
