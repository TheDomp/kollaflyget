/**
 * @fileoverview Flight Details Modal Component
 * @description Modal overlay showing detailed flight information with weather data.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
    },
    card: {
        width: '100%',
        maxWidth: 500,
        padding: '2rem',
        position: 'relative',
        border: '1px solid hsla(var(--primary-h), var(--primary-s), 50%, 0.3)',
    },
    closeButton: {
        position: 'absolute',
        top: '1.2rem',
        right: '1.2rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
        color: 'white',
        cursor: 'pointer',
        padding: 8,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        transition: 'all 0.2s ease',
    },
    header: {
        textAlign: 'center',
        marginBottom: '2rem',
    },
    flightId: {
        fontSize: '0.9rem',
        color: 'var(--primary)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: '0.5rem',
    },
    destination: {
        fontSize: '2rem',
        fontWeight: 700,
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem',
    },
    infoCard: {
        padding: '1rem',
        background: 'rgba(255,255,255,0.03)',
    },
    infoLabel: {
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
    },
    infoValue: {
        fontSize: '1.5rem',
        fontWeight: 700,
    },
    weatherCard: {
        padding: '1.5rem',
        background: 'linear-gradient(135deg, hsla(var(--primary-h), var(--primary-s), 40%, 0.1), transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    buttonRow: {
        marginTop: '2rem',
        display: 'flex',
        gap: '1rem',
    },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Close button icon */
const CloseIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/** Info card sub-component */
const InfoCard = React.memo(({ label, value, valueColor }) => (
    <div className="glass-card" style={STYLES.infoCard}>
        <div style={STYLES.infoLabel}>{label}</div>
        <div style={{ ...STYLES.infoValue, color: valueColor }}>{value}</div>
    </div>
));

InfoCard.displayName = 'InfoCard';

/** Weather display card */
const WeatherCard = React.memo(({ destination, weather }) => (
    <div className="glass-card" style={STYLES.weatherCard}>
        <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Väder i {destination}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{weather.condition}</div>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{weather.temp}°C</div>
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

    // Handle card click (prevent propagation)
    const handleCardClick = useCallback((e) => e.stopPropagation(), []);

    // Handle close button hover states
    const handleCloseHover = useCallback((e, isHover) => {
        e.currentTarget.style.background = isHover
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(255,255,255,0.05)';
    }, []);

    if (!flight) return null;

    const isLanded = flight.status?.includes('Landat');

    return (
        <div className="modal-overlay fade-in" onClick={handleOverlayClick} style={STYLES.overlay}>
            <div className="glass-card" onClick={handleCardClick} style={STYLES.card}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    aria-label="Stäng"
                    style={STYLES.closeButton}
                    onMouseEnter={(e) => handleCloseHover(e, true)}
                    onMouseLeave={(e) => handleCloseHover(e, false)}
                >
                    <CloseIcon />
                </button>

                {/* Header */}
                <div style={STYLES.header}>
                    <div style={STYLES.flightId}>
                        {flight.airline} • {flight.id}
                    </div>
                    <h2 style={STYLES.destination}>{flight.destination}</h2>
                </div>

                {/* Info Grid */}
                <div style={STYLES.infoGrid}>
                    <InfoCard label="Avgång/Ankomst" value={flight.time} />
                    <InfoCard
                        label="Status"
                        value={flight.status}
                        valueColor={isLanded ? '#10b981' : 'inherit'}
                    />
                </div>

                {/* Weather */}
                {weather && !loadingWeather && (
                    <WeatherCard destination={flight.destination} weather={weather} />
                )}

                {/* Action Buttons */}
                <div style={STYLES.buttonRow}>
                    <button className="premium-btn" style={{ flex: 1 }}>
                        Bevaka Flyg
                    </button>
                    <button className="premium-btn secondary" style={{ flex: 1 }} onClick={onClose}>
                        Stäng
                    </button>
                </div>
            </div>
        </div>
    );
};
