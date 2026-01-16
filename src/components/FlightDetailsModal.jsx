import React, { useState, useEffect } from 'react';
import { swedaviaService } from '../services/swedaviaApi';

export const FlightDetailsModal = ({ flight, onClose }) => {
    const [weather, setWeather] = useState(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    useEffect(() => {
        if (flight?.destination) {
            setLoadingWeather(true);
            // Simulate/Fetch weather for destination
            swedaviaService.getWeather(flight.destination).then(data => {
                setWeather(data);
                setLoadingWeather(false);
            });
        }
    }, [flight]);

    if (!flight) return null;

    return (
        <div className="modal-overlay fade-in" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div className="glass-card" onClick={e => e.stopPropagation()} style={{
                width: '100%',
                maxWidth: '500px',
                padding: '2rem',
                position: 'relative',
                border: '1px solid hsla(var(--primary-h), var(--primary-s), 50%, 0.3)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '5px'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--primary)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '0.5rem'
                    }}>
                        {flight.airline} • {flight.id}
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>{flight.destination}</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Avgång/Ankomst</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{flight.time}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Status</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: flight.status?.includes('Landat') ? '#10b981' : 'inherit' }}>
                            {flight.status}
                        </div>
                    </div>
                </div>

                {weather && (
                    <div className="glass-card" style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, hsla(var(--primary-h), var(--primary-s), 40%, 0.1), transparent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Väder i {flight.destination}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{weather.condition}</div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                            {weather.temp}°C
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className="premium-btn" style={{ flex: 1 }}>Bevaka Flyg</button>
                    <button className="premium-btn secondary" style={{ flex: 1 }} onClick={onClose}>Stäng</button>
                </div>
            </div>
        </div>
    );
};
