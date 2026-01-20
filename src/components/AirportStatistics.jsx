/**
 * @fileoverview Airport Statistics Dashboard Component
 * @description Interactive dashboard showing flight statistics with filtering capabilities.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { COUNTRY_MAPPING, DESTINATION_COORDS, swedaviaService } from '../services/swedaviaApi';
import FlightMap from './FlightMap';
import { FlightCard } from './FlightList';
import { FlightDetailsModal } from './FlightDetailsModal';

// ============================================================================
// CONSTANTS
// ============================================================================

const STYLES = {
    container: {
        padding: '2rem',
        margin: '2rem auto',
        maxWidth: 1000,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
        gap: '1.5rem',
    },
    titleSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem', // Increased gap between title and picker
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 600,
    },
    filterContainer: {
        position: 'relative',
        width: 300,
    },
    filterInput: {
        width: '100%',
        padding: '10px 15px',
        borderRadius: 20,
        fontSize: '0.85rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
    },
    clearButton: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: 'var(--text-dim)',
        cursor: 'pointer',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem',
    },
    statCard: {
        padding: '1.5rem',
        textAlign: 'center',
    },
    statValue: {
        fontSize: '2.5rem',
        fontWeight: 700,
    },
    statLabel: {
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
    },
    listsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
    },
    listHeader: {
        marginBottom: '1rem',
        borderBottom: '1px solid var(--glass-border)',
        paddingBottom: '0.5rem',
    },
    progressBar: {
        width: 100,
        height: 6,
        background: 'var(--glass-border)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    routeModalOverlay: {
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
    routeModalCard: {
        width: '100%',
        maxWidth: 600,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'rgba(20, 20, 25, 0.95)',
        border: '1px solid hsla(var(--primary-h), var(--primary-s), 50%, 0.3)',
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    closeButton: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid var(--glass-border)',
        color: 'white',
        cursor: 'pointer',
        padding: 8,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Filters flights based on search query with country support.
 * @param {Object[]} flights - Flight array.
 * @param {string} query - Filter query.
 * @returns {Object[]} Filtered flights.
 */
const filterFlightsByQuery = (flights, query) => {
    if (!query) return flights;

    const q = query.toLowerCase();
    const countryMatches = Object.entries(COUNTRY_MAPPING)
        .filter(([country]) => country.toLowerCase().includes(q))
        .flatMap(([, keywords]) => keywords.map((k) => k.toLowerCase()));

    return flights.filter((f) => {
        const dest = (f.destination || '').toLowerCase();
        const airline = (f.airline || '').toLowerCase();
        const id = (f.id || '').toLowerCase();

        return (
            id.includes(q) ||
            dest.includes(q) ||
            airline.includes(q) ||
            countryMatches.some((k) => dest.includes(k))
        );
    });
};

/**
 * Calculates status distribution from flights using UTC timestamps for accurate delay detection.
 * @param {Object[]} flights - Flight array.
 * @returns {Object} Status counts.
 */
const calculateStatusCounts = (flights) =>
    flights.reduce(
        (acc, f) => {
            const s = (f.status || '').toLowerCase();

            // Accurate delay detection using UTC timestamps (threshold: 15 mins)
            let isDelayed = s.includes('delayed') || s.includes('försenat');

            if (!isDelayed && f.scheduledUtc && (f.actualUtc || f.estimatedUtc)) {
                const scheduled = new Date(f.scheduledUtc).getTime();
                const actual = new Date(f.actualUtc || f.estimatedUtc).getTime();
                const diffMinutes = (actual - scheduled) / (1000 * 60);

                if (diffMinutes >= 15) {
                    isDelayed = true;
                }
            }

            if (s.includes('landat')) acc.landed++;
            else if (isDelayed) acc.delayed++;
            else if (s.includes('cancelled') || s.includes('inställt')) acc.cancelled++;
            else acc.onTime++;
            return acc;
        },
        { landed: 0, delayed: 0, cancelled: 0, onTime: 0 }
    );

/**
 * Calculates top N items from a frequency map.
 * @param {Object[]} items - Array of items with a key property.
 * @param {string} key - Property to count.
 * @param {number} [limit=5] - Number of top items.
 * @returns {Array<[string, number]>} Sorted entries.
 */
const getTopItems = (items, key, limit = 5) => {
    const counts = items.reduce((acc, item) => {
        const value = item[key];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Single stat card */
const StatCard = React.memo(({ value, label, color = 'var(--primary)' }) => (
    <div className="glass-card" style={STYLES.statCard}>
        <div style={{ ...STYLES.statValue, color }}>{value}</div>
        <div style={STYLES.statLabel}>{label}</div>
    </div>
));

StatCard.displayName = 'StatCard';

/** Progress bar item for lists */
const ProgressItem = React.memo(({ label, count, maxCount, color = 'var(--primary)', onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: onClick ? 'pointer' : 'default',
            padding: '4px 8px',
            borderRadius: 8,
            transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => onClick && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={(e) => onClick && (e.currentTarget.style.background = 'transparent')}
    >
        <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{label}</div>
        <div style={STYLES.progressBar}>
            <div
                style={{
                    width: `${(count / maxCount) * 100}%`,
                    height: '100%',
                    background: color,
                }}
            />
        </div>
        <div style={{ fontSize: '0.8rem', minWidth: 25, textAlign: 'right', fontWeight: 600 }}>{count}</div>
    </div>
));

ProgressItem.displayName = 'ProgressItem';

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/** Modal for list of flights on a route */
const RouteFlightsModal = ({ route, flights, onClose, onSelectFlight, favorites, onToggleFavorite }) => {
    return createPortal(
        <div className="fade-in" style={STYLES.routeModalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={STYLES.routeModalCard}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Flyg till/från {route}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                        {flights.length} flyg hittades
                    </div>
                </div>

                <button onClick={onClose} style={STYLES.closeButton}>
                    <CloseIcon />
                </button>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {flights.map(flight => (
                        <div key={flight.id} style={{ transform: 'scale(0.98)' }}>
                            <FlightCard
                                flight={flight}
                                isFavorite={favorites.includes(flight.id)}
                                onSelect={onSelectFlight}
                                onToggleFavorite={onToggleFavorite}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};


// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DataFeedback = React.memo(({ metadata }) => {
    if (!metadata || metadata.missingDates.length === 0) return null;

    return (
        <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 12,
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: '#f59e0b',
            fontSize: '0.9rem'
        }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
                <strong>Information:</strong> Data saknas för vissa datum i ditt valda intervall
                ({metadata.missingDates.join(', ')}).
                Swedavia sparar oftast bara data för de senaste 24-48 timmarna.
            </div>
        </div>
    );
});

DataFeedback.displayName = 'DataFeedback';

const DateRangeInput = React.memo(({ startDate, endDate, onStartChange, onEndChange }) => (
    <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2rem', // Increased gap between Från and Till
        background: 'rgba(255,255,255,0.08)',
        padding: '8px 20px',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Från</span>
            <input
                type="date"
                value={startDate}
                onChange={onStartChange}
                aria-label="Startdatum"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', width: '135px' }}
            />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Till</span>
            <input
                type="date"
                value={endDate}
                onChange={onEndChange}
                min={startDate}
                aria-label="Slutdatum"
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', width: '135px' }}
            />
        </div>
    </div>
));

/**
 * Airport Statistics Component
 * @description Displays various statistics based on flight data.
 * @param {Object} props
 * @param {Object[]} props.flights - Flight data.
 * @param {string} props.airportIata - Airport IATA code.
 * @param {string} props.date - Current date string (for display).
 * @param {string} props.startDate - Start date.
 * @param {string} props.endDate - End date.
 * @param {Function} props.onStartDateChange - Handler for start date.
 * @param {Function} props.onEndDateChange - Handler for end date.
 */
export const AirportStatistics = ({
    flights,
    airportIata,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    loading
}) => {
    const [filter, setFilter] = useState('');
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [favorites, setFavorites] = useState(() => swedaviaService.getFavorites());

    const handleToggleFavorite = useCallback((flightId) => {
        const newFavs = swedaviaService.toggleFavorite(flightId);
        setFavorites([...newFavs]);
    }, []);

    // Filter flights based on query
    const filteredFlights = useMemo(
        () => filterFlightsByQuery(flights, filter),
        [flights, filter]
    );

    const routeFlights = useMemo(() => {
        if (!selectedRoute) return [];
        const normalizedRoute = selectedRoute.toLowerCase().trim();
        return filteredFlights.filter(f => {
            const originIata = (f.originIata || '').toLowerCase();
            const destIata = (f.destinationIata || '').toLowerCase();
            const destName = (f.destination || '').toLowerCase();

            return (
                originIata === normalizedRoute ||
                destIata === normalizedRoute ||
                destName.includes(normalizedRoute) ||
                normalizedRoute.includes(destName)
            );
        });
    }, [selectedRoute, filteredFlights]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!filteredFlights || filteredFlights.length === 0) return null;

        const statusCounts = calculateStatusCounts(filteredFlights);
        const delayRate =
            filteredFlights.length > 0
                ? ((statusCounts.delayed / filteredFlights.length) * 100).toFixed(1)
                : 0;

        return {
            total: filteredFlights.length,
            statusCounts,
            delayRate,
            topDestinations: getTopItems(filteredFlights, 'destination'),
            topAirlines: getTopItems(filteredFlights, 'airline'),
        };
    }, [filteredFlights]);


    // Early return if no flights AND no metadata (to avoid hiding the warning)
    if (!flights?.length && (!flights?._metadata || flights?._metadata.missingDates.length === 0)) return null;

    return (
        <div id="airport-stats" className="glass-card fade-in" style={{ ...STYLES.container, position: 'relative' }}>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(20, 25, 35, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 16
                }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid var(--glass-border)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                </div>
            )}
            {/* Header */}
            <div style={STYLES.header}>
                <div style={STYLES.titleSection}>
                    <h2 style={STYLES.title}>
                        <span>📊</span>
                        Statistik för {airportIata}
                    </h2>
                    <DateRangeInput
                        startDate={startDate}
                        endDate={endDate}
                        onStartChange={onStartDateChange}
                        onEndChange={onEndDateChange}
                    />
                </div>

                <div style={STYLES.filterContainer}>
                    <input
                        type="text"
                        placeholder="Filtrera statistik (t.ex. Spanien, SAS)"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={STYLES.filterInput}
                    />
                    {filter && (
                        <button onClick={() => setFilter('')} style={STYLES.clearButton} aria-label="Rensa filter">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Debug Element */}
            <div id="debug-metadata" style={{ display: 'none' }} data-metadata={JSON.stringify(flights._metadata || {})}>
                {JSON.stringify(flights._metadata || {})}
            </div>

            <DataFeedback metadata={flights._metadata} />

            {/* Content */}
            {!stats ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    Ingen data matchar din filtrering.
                </div>
            ) : (
                <>
                    {/* Route Map */}
                    <div className="glass-card" style={{ padding: '0', marginBottom: '2rem', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ ...STYLES.listHeader, margin: 0, fontSize: '0.9rem', color: 'var(--text-dim)' }}>FLYGRUTTER FRÅN {airportIata}</h3>
                        </div>
                        <FlightMap
                            origin={DESTINATION_COORDS[airportIata]}
                            originIata={airportIata}
                            destinations={
                                // Prepare data for map
                                (() => {
                                    const counts = filteredFlights.reduce((acc, f) => {
                                        const dest = f.type === 'Arrival' ? f.originIata : f.destinationIata;
                                        if (dest && dest !== airportIata && DESTINATION_COORDS[dest]) {
                                            acc[dest] = (acc[dest] || 0) + 1;
                                        }
                                        return acc;
                                    }, {});
                                    const max = Math.max(...Object.values(counts), 1);
                                    return Object.entries(counts).map(([iata, count]) => ({
                                        iata,
                                        count,
                                        ...DESTINATION_COORDS[iata],
                                        popularity: count / max
                                    }));
                                })()
                            }
                            onDestinationSelect={setSelectedRoute}
                        />
                    </div>

                    {/* Stats Cards */}
                    <div style={STYLES.statsGrid}>
                        <StatCard
                            value={stats.total}
                            label={filter ? 'Flyg (filtrerat)' : 'Flyg totalt'}
                        />
                        <StatCard
                            value={`${stats.delayRate}%`}
                            label="Förseningsgrad"
                            color={Number(stats.delayRate) > 10 ? '#ef4444' : '#10b981'}
                        />
                        <StatCard value={stats.statusCounts.landed} label="Landade" color="#3b82f6" />
                    </div>

                    {/* Top Lists */}
                    <div style={STYLES.listsGrid}>
                        {/* Destinations */}
                        <div>
                            <h3 style={STYLES.listHeader}>Toppdestinationer</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {stats.topDestinations.map(([dest, count]) => (
                                    <ProgressItem
                                        key={dest}
                                        label={dest}
                                        count={count}
                                        maxCount={stats.topDestinations[0][1]}
                                        onClick={() => {
                                            setSelectedRoute(dest);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Airlines */}
                        <div>
                            <h3 style={STYLES.listHeader}>Flygbolag</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {stats.topAirlines.map(([airline, count]) => (
                                    <ProgressItem
                                        key={airline}
                                        label={airline}
                                        count={count}
                                        maxCount={stats.topAirlines[0][1]}
                                        color="#f59e0b"
                                        onClick={() => setFilter(airline)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            {selectedRoute && (
                <RouteFlightsModal
                    route={selectedRoute}
                    flights={routeFlights}
                    onClose={() => setSelectedRoute(null)}
                    onSelectFlight={setSelectedFlight}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                />
            )}

            {selectedFlight && (
                <FlightDetailsModal
                    flight={selectedFlight}
                    onClose={() => setSelectedFlight(null)}
                />
            )}
        </div>
    );
};
