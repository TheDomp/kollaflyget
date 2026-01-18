/**
 * @fileoverview Flight List Component
 * @description Displays a list of flights with sorting, favorites, and modal interaction.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { swedaviaService } from '../services/swedaviaApi';
import { FlightDetailsModal } from './FlightDetailsModal';

// ============================================================================
// CONSTANTS
// ============================================================================

const STYLES = {
    container: {
        maxWidth: 1000,
        margin: '2rem auto',
        padding: '0 1rem',
    },
    title: {
        fontSize: '1.5rem',
        marginBottom: '1.5rem',
        textAlign: 'left',
    },
    grid: {
        display: 'grid',
        gap: 12,
    },
    loadingContainer: {
        textAlign: 'center',
        padding: '4rem 1rem',
    },
    spinner: {
        width: 50,
        height: 50,
        border: '3px solid var(--glass-border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 1s linear infinite',
    },
    errorCard: {
        padding: '3rem 2rem',
        textAlign: 'center',
        maxWidth: 500,
        margin: '4rem auto',
        border: '1px solid hsla(var(--primary-h), var(--primary-s), 50%, 0.2)',
    },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Loading spinner */
const LoadingState = () => (
    <div style={STYLES.loadingContainer}>
        <div style={STYLES.spinner} />
        <p style={{ marginTop: '1.5rem', color: 'var(--text-dim)', fontWeight: 500 }}>
            Hämtar data från Swedavia...
        </p>
    </div>
);

/** Error/empty state display */
const ErrorState = ({ error }) => (
    <div className="glass-card fade-in" style={STYLES.errorCard}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ marginBottom: '0.5rem' }}>
            {error ? 'Kunde inte hämta data' : 'Inga flyg hittades'}
        </h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
            {error || 'Det verkar inte finnas några flyg för den valda tidpunkten eller sökningen.'}
        </p>
    </div>
);

/** Star/favorite button */
const FavoriteButton = React.memo(({ isFavorite, onClick }) => (
    <button
        onClick={onClick}
        className="favorite-btn"
        style={{
            background: 'none',
            border: 'none',
            color: isFavorite ? '#f59e0b' : 'var(--text-dim)',
            cursor: 'pointer',
            padding: 5,
            display: 'flex',
            transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label={isFavorite ? 'Ta bort från favoriter' : 'Lägg till som favorit'}
    >
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    </button>
));

FavoriteButton.displayName = 'FavoriteButton';

/** Status badge display */
const StatusBadge = React.memo(({ status }) => {
    const getBadgeStyle = () => {
        const isLanded = status?.includes('Landat');
        return {
            background: isLanded ? 'hsla(150, 80%, 30%, 0.2)' : 'var(--glass-border)',
            color: isLanded ? '#10b981' : 'inherit',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 600,
        };
    };

    return <div style={getBadgeStyle()}>{status}</div>;
});

StatusBadge.displayName = 'StatusBadge';

/** Single flight card */
const FlightCard = React.memo(({ flight, isFavorite, onSelect, onToggleFavorite }) => {
    const handleFavoriteClick = useCallback(
        (e) => {
            e.stopPropagation();
            onToggleFavorite(flight.id);
        },
        [flight.id, onToggleFavorite]
    );

    return (
        <div
            className="flight-card glass-card"
            onClick={() => onSelect(flight)}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1.2rem 1.5rem',
                gap: '1.5rem',
                cursor: 'pointer',
                borderLeft: isFavorite ? '4px solid #f59e0b' : '1px solid var(--glass-border)',
            }}
        >
            {/* Time */}
            <div style={{ minWidth: 80, textAlign: 'left' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{flight.time}</div>
                <div
                    style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                    }}
                >
                    {flight.type === 'Arrival' ? 'Ankomst' : 'Avgång'}
                </div>
            </div>

            {/* Destination & Airline */}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{flight.destination}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    {flight.airline} • <span style={{ color: 'var(--primary)' }}>{flight.id}</span>
                </div>
            </div>

            {/* Status & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={flight.status} />
                    {flight.gate && flight.gate !== '-' && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>
                            Gate {flight.gate}
                        </div>
                    )}
                </div>
                <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} />
            </div>
        </div>
    );
});

FlightCard.displayName = 'FlightCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Flight list component with favorites and modal.
 * @param {Object} props
 * @param {Object[]} props.flights - Array of flight objects.
 * @param {boolean} props.loading - Loading state.
 * @param {string} props.title - List title.
 * @param {string|null} props.error - Error message.
 * @returns {JSX.Element}
 */
export const FlightList = ({ flights, loading, title, error }) => {
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [favorites, setFavorites] = useState(() => swedaviaService.getFavorites());

    // Toggle favorite handler
    const handleToggleFavorite = useCallback((flightId) => {
        const newFavs = swedaviaService.toggleFavorite(flightId);
        setFavorites([...newFavs]);
    }, []);

    // Close modal handler
    const handleCloseModal = useCallback(() => setSelectedFlight(null), []);

    // Sort flights: favorites first, then by time
    const sortedFlights = useMemo(() => {
        return [...flights].sort((a, b) => {
            const aFav = favorites.includes(a.id);
            const bFav = favorites.includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return a.time.localeCompare(b.time);
        });
    }, [flights, favorites]);

    // Render states
    // If loading but we have flights, show content with overlay
    const showLoadingOverlay = loading && flights.length > 0;

    // If loading and NO flights, show full loading state
    if (loading && flights.length === 0) return <LoadingState />;

    if (error || (flights.length === 0 && title !== 'Välj flygplats för att se flyg')) {
        return <ErrorState error={error} />;
    }

    return (
        <div className="flight-list-container fade-in" style={{ ...STYLES.container, position: 'relative', opacity: showLoadingOverlay ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
            {showLoadingOverlay && (
                <div
                    data-testid="loading-overlay"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                    }}>
                    <div style={STYLES.spinner} />
                </div>
            )}
            <h2 style={STYLES.title}>{title}</h2>

            <div style={STYLES.grid}>
                {sortedFlights.map((flight) => (
                    <FlightCard
                        key={flight.id}
                        flight={flight}
                        isFavorite={favorites.includes(flight.id)}
                        onSelect={setSelectedFlight}
                        onToggleFavorite={handleToggleFavorite}
                    />
                ))}
            </div>

            {selectedFlight && (
                <FlightDetailsModal flight={selectedFlight} onClose={handleCloseModal} />
            )}
        </div>
    );
};
