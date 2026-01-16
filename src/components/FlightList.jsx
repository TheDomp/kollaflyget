import React, { useState } from 'react';
import { swedaviaService } from '../services/swedaviaApi';
import { FlightDetailsModal } from './FlightDetailsModal';

const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
        const s = status.toLowerCase();
        if (s.includes('on time')) return '#10b981';
        if (s.includes('delayed')) return '#f59e0b';
        if (s.includes('boarding')) return '#3b82f6';
        if (s.includes('cancelled')) return '#ef4444';
        return 'var(--text-dim)';
    };

    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: `${getStatusColor()}20`,
            color: getStatusColor(),
            border: `1px solid ${getStatusColor()}40`
        }}>
            {status}
        </span>
    );
};

export const FlightList = ({ flights, loading, title, error }) => {
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [favorites, setFavorites] = useState(swedaviaService.getFavorites());

    const toggleFav = (e, flightId) => {
        e.stopPropagation();
        const newFavs = swedaviaService.toggleFavorite(flightId);
        setFavorites([...newFavs]);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div className="loading-spinner" style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid var(--glass-border)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '1.5rem', color: 'var(--text-dim)', fontWeight: '500' }}>Hämtar data från Swedavia...</p>
            </div>
        );
    }

    if (error || (flights.length === 0 && title !== 'Välj flygplats för att se flyg')) {
        return (
            <div className="glass-card fade-in" style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                maxWidth: '500px',
                margin: '4rem auto',
                border: '1px solid hsla(var(--primary-h), var(--primary-s), 50%, 0.2)'
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{error ? 'Kunde inte hämta data' : 'Inga flyg hittades'}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                    {error || 'Det verkar inte finnas några flyg för den valda tidpunkten eller sökningen.'}
                </p>
            </div>
        );
    }

    // Sort: Favorites first, then by time
    const sortedFlights = [...flights].sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.time.localeCompare(b.time);
    });

    return (
        <div className="flight-list-container fade-in" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>{title}</h2>

            <div style={{ display: 'grid', gap: '12px' }}>
                {sortedFlights.map((flight) => (
                    <div
                        key={flight.id}
                        className="flight-card glass-card"
                        onClick={() => setSelectedFlight(flight)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '1.2rem 1.5rem',
                            gap: '1.5rem',
                            cursor: 'pointer',
                            borderLeft: favorites.includes(flight.id) ? '4px solid #f59e0b' : '1px solid var(--glass-border)'
                        }}
                    >
                        <div style={{ minWidth: '80px', textAlign: 'left' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{flight.time}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {flight.type === 'Arrival' ? 'Ankomst' : 'Avgång'}
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{flight.destination}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                {flight.airline} • <span style={{ color: 'var(--primary)' }}>{flight.id}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    background: flight.status?.includes('Landat') ? 'hsla(150, 80%, 30%, 0.2)' : 'var(--glass-border)',
                                    color: flight.status?.includes('Landat') ? '#10b981' : 'inherit',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600'
                                }}>
                                    {flight.status}
                                </div>
                                {flight.gate && flight.gate !== '-' && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                        Gate {flight.gate}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={(e) => toggleFav(e, flight.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: favorites.includes(flight.id) ? '#f59e0b' : 'var(--text-dim)',
                                    cursor: 'pointer',
                                    padding: '5px',
                                    display: 'flex',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites.includes(flight.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedFlight && (
                <FlightDetailsModal
                    flight={selectedFlight}
                    onClose={() => setSelectedFlight(null)}
                />
            )}
        </div>
    );
};
