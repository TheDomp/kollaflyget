/**
 * @fileoverview Flight Details Modal Component
 * @description Modal overlay showing detailed flight information with weather data.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { swedaviaService } from '../services/swedaviaApi';

// ============================================================================
// CONSTANTS
// ============================================================================

const STYLES = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(15px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
    },
    card: {
        width: '100%',
        maxWidth: 550,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2.5rem',
        position: 'relative',
        border: '1px solid hsla(var(--primary-h), var(--primary-s), 50%, 0.4)',
        background: 'rgba(20, 25, 35, 0.95)',
        borderRadius: 24,
    },
    closeButton: {
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
        color: 'white',
        cursor: 'pointer',
        padding: 10,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        transition: 'all 0.3s ease',
    },
    header: {
        textAlign: 'center',
        marginBottom: '2.5rem',
    },
    flightId: {
        fontSize: '1rem',
        color: 'var(--primary)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: '0.8rem',
    },
    destination: {
        fontSize: '2.8rem',
        fontWeight: 800,
        fontFamily: "'Outfit', sans-serif",
        lineHeight: 1,
    },
    timeline: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '2rem 0',
        padding: '1.5rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        position: 'relative',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'var(--primary)',
    },
    timelineLine: {
        flex: 1,
        height: 2,
        background: 'linear-gradient(90deg, var(--primary), var(--glass-border))',
        margin: '0 1rem',
        position: 'relative',
    },
    planeIcon: {
        position: 'absolute',
        left: '45%',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '1.2rem',
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.2rem',
        marginBottom: '2rem',
    },
    infoCard: {
        padding: '1.2rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        border: '1px solid var(--glass-border)',
    },
    infoLabel: {
        fontSize: '0.7rem',
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: '1.2rem',
        fontWeight: 700,
    },
    weatherCard: {
        padding: '1.5rem',
        background: 'linear-gradient(135deg, hsla(var(--primary-h), var(--primary-s), 40%, 0.1), transparent)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1.5rem',
    },
    buttonRow: {
        marginTop: '2.5rem',
        display: 'flex',
        gap: '1rem',
    },
};

const getAircraftInfo = (airline) => {
    if (!airline) return { model: 'Boeing 737 MAX 8', type: 'Narrow-body', capacity: '180 säten' };
    if (airline.includes('SAS')) return { model: 'Airbus A320neo', type: 'Narrow-body', capacity: '180 säten' };
    if (airline.includes('Norwegian')) return { model: 'Boeing 737-800', type: 'Narrow-body', capacity: '189 säten' };
    if (airline.includes('Lufthansa')) return { model: 'Airbus A321', type: 'Narrow-body', capacity: '200 säten' };
    if (airline.includes('Ryanair')) return { model: 'Boeing 737-800', type: 'Narrow-body', capacity: '189 säten' };
    return { model: 'Boeing 737 MAX 8', type: 'Narrow-body', capacity: '180 säten' };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Close button icon */
const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/** Info card sub-component */
const InfoCard = React.memo(({ label, value, valueColor, subValue }) => (
    <div className="glass-card" style={STYLES.infoCard}>
        <div style={STYLES.infoLabel}>{label}</div>
        <div style={{ ...STYLES.infoValue, color: valueColor }}>{value}</div>
        {subValue && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>{subValue}</div>}
    </div>
));

InfoCard.displayName = 'InfoCard';

/** Weather display card */
const WeatherCard = React.memo(({ destination, weather }) => (
    <div className="glass-card" style={STYLES.weatherCard}>
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Väder i {destination}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{weather.condition}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-light)' }}>{weather.temp}°C</div>
        </div>
    </div>
));

WeatherCard.displayName = 'WeatherCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Flight details modal component.
 * @param {Object} props
 * @param {Object} props.flight - Flight data object.
 * @param {Function} props.onClose - Close handler callback.
 * @returns {JSX.Element|null}
 */
export const FlightDetailsModal = ({ flight, onClose }) => {
    const [weather, setWeather] = useState(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    // Fetch weather on mount/flight change
    useEffect(() => {
        if (!flight?.destination) return;

        const fetchWeather = async () => {
            setLoadingWeather(true);
            try {
                const data = await swedaviaService.getWeather(flight.destination);
                setWeather(data);
            } catch (err) {
                console.warn('Weather fetch failed:', err);
                setWeather({ temp: '-', condition: 'Väderdata saknas' });
            } finally {
                setLoadingWeather(false);
            }
        };

        fetchWeather();
    }, [flight?.destination]);

    // Handle overlay click (close if clicking outside card)
    const handleOverlayClick = useCallback(
        (e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        },
        [onClose]
    );

    const aircraft = useMemo(() => getAircraftInfo(flight?.airline || ''), [flight?.airline]);

    if (!flight) return null;

    const isLanded = flight.status?.includes('Landat');
    const isArrival = flight.type === 'Arrival';

    return createPortal(
        <div className="modal-overlay" onClick={handleOverlayClick} style={STYLES.overlay}>
            <div className="glass-card" onClick={(e) => e.stopPropagation()} style={STYLES.card}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--primary)', opacity: 0.5 }} />

                {/* Close Button */}
                <button onClick={onClose} aria-label="Stäng" style={STYLES.closeButton}>
                    <CloseIcon />
                </button>

                {/* Header */}
                <div style={STYLES.header}>
                    <div style={STYLES.flightId}>
                        {flight.airline} • {flight.id}
                    </div>
                    <h2 style={STYLES.destination}>{flight.destination}</h2>
                </div>

                {/* Visual Timeline */}
                <div style={STYLES.timeline}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{isArrival ? 'Ursprung' : 'ARN'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{isArrival ? '--' : 'Stockholm'}</div>
                    </div>
                    <div style={STYLES.timelineLine}>
                        <div style={STYLES.planeIcon}>✈️</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{isArrival ? 'ARN' : 'Destination'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{isArrival ? 'Stockholm' : flight.destination}</div>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={STYLES.infoGrid}>
                    <InfoCard
                        label={isArrival ? "Planerad Ankomst" : "Planerad Avgång"}
                        value={flight.time}
                        subValue="Lokal tid"
                    />
                    <InfoCard
                        label="Aktuell Status"
                        value={flight.status}
                        valueColor={
                            isLanded ? '#10b981' :
                                (flight.status?.includes('Försenat') ? '#ef4444' :
                                    (flight.status?.includes('Borttagen') || flight.status?.includes('Inställt') ? '#ef4444' : 'inherit'))
                        }
                    />
                    <InfoCard
                        label="Flygplanstyp"
                        value={aircraft.model}
                        subValue={aircraft.capacity}
                    />
                    <InfoCard
                        label={isArrival ? "Terminal / Band" : "Terminal / Gate"}
                        value={flight.terminal ? `Terminal ${flight.terminal}` : '-'}
                        subValue={flight.gate !== '-' ? `Gate/Band: ${flight.gate}` : 'Ingen gate tilldelad'}
                    />
                </div>

                {/* Weather */}
                {weather && !loadingWeather && (
                    <WeatherCard destination={flight.destination} weather={weather} />
                )}

                {/* Action Buttons */}
                <div style={STYLES.buttonRow}>
                    <button className="premium-btn" style={{ flex: 1, height: 50 }}>
                        Följ detta flyg 🔔
                    </button>
                    <button className="premium-btn secondary" style={{ flex: 1, height: 50 }} onClick={onClose}>
                        Stäng
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
