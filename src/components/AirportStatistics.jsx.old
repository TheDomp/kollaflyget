/**
 * @fileoverview Airport Statistics Dashboard Component
 * @description Interactive dashboard showing flight statistics with filtering capabilities.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { COUNTRY_MAPPING, DESTINATION_COORDS, AIRPORTS } from '../services/swedaviaApi';
import FlightMap from './FlightMap';

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
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: 0,
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
        const dest = f.destination.toLowerCase();
        const airline = f.airline.toLowerCase();
        const id = f.id.toLowerCase();

        return (
            id.includes(q) ||
            dest.includes(q) ||
            airline.includes(q) ||
            countryMatches.some((k) => dest.includes(k))
        );
    });
};

/**
 * Calculates status distribution from flights.
 * @param {Object[]} flights - Flight array.
 * @returns {Object} Status counts.
 */
const calculateStatusCounts = (flights) =>
    flights.reduce(
        (acc, f) => {
            const s = f.status.toLowerCase();
            if (s.includes('landat')) acc.landed++;
            else if (s.includes('delayed') || s.includes('försenat')) acc.delayed++;
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

/** Stats icon SVG */
const StatsIcon = () => (
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
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

/** Single stat card */
const StatCard = React.memo(({ value, label, color = 'var(--primary)' }) => (
    <div className="glass-card" style={STYLES.statCard}>
        <div style={{ ...STYLES.statValue, color }}>{value}</div>
        <div style={STYLES.statLabel}>{label}</div>
    </div>
));

StatCard.displayName = 'StatCard';

/** Progress bar item for lists */
const ProgressItem = React.memo(({ label, count, maxCount, color = 'var(--primary)' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, fontSize: '0.9rem' }}>{label}</div>
        <div style={STYLES.progressBar}>
            <div
                style={{
                    width: `${(count / maxCount) * 100}%`,
                    height: '100%',
                    background: color,
                }}
            />
        </div>
        <div style={{ fontSize: '0.8rem', minWidth: 20 }}>{count}</div>
    </div>
));

ProgressItem.displayName = 'ProgressItem';

/**
 * Interactive Flight Route Map with Tooltips and World Projection
 */
const RouteMap = React.memo(({ originIata, flights }) => {
    const [hoveredRoute, setHoveredRoute] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // World Map Projection (Equirectangular) mapping to 800x450
    const getPos = useCallback((lat, lng) => ({
        x: (lng + 180) * (800 / 360),
        y: (90 - lat) * (450 / 180),
    }), []);

    const origin = useMemo(() => DESTINATION_COORDS[originIata], [originIata]);

    const routes = useMemo(() => {
        if (!origin) return [];
        const counts = flights.reduce((acc, f) => {
            const dest = f.type === 'Arrival' ? f.originIata : f.destinationIata;
            if (dest && dest !== originIata) {
                acc[dest] = (acc[dest] || 0) + 1;
            }
            return acc;
        }, {});

        const maxCount = Math.max(...Object.values(counts), 1);

        return Object.entries(counts)
            .map(([iata, count]) => {
                const coords = DESTINATION_COORDS[iata];
                if (!coords) return null;

                const start = getPos(origin.lat, origin.lng);
                const end = getPos(coords.lat, coords.lng);

                // Curve calculation
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2 - dist * 0.2; // Arc height based on distance

                const popularity = count / maxCount;
                let color = '#94a3b8'; // Grey (Low)
                let label = 'Sällsynt';

                if (popularity > 0.7) {
                    color = '#10b981'; // Green (Popular)
                    label = 'Populär';
                } else if (popularity > 0.3) {
                    color = '#3b82f6'; // Blue (Medium)
                    label = 'Vanlig';
                }

                return { iata, count, start, end, midX, midY, color, label, popularity };
            })
            .filter(Boolean);
    }, [origin, originIata, flights, getPos]);

    const handleMouseEnter = useCallback((e, route) => {
        const rect = e.target.getBoundingClientRect();
        setTooltipPos({
            x: e.clientX - rect.left + 20,
            y: e.clientY - rect.top - 40
        });
        setHoveredRoute(route);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHoveredRoute(null);
    }, []);

    if (!origin) return null;

    const originPos = getPos(origin.lat, origin.lng);

    return (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                FLYGRUTTER FRÅN {originIata}
            </h3>

            <div className="route-map-container" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)', borderRadius: 12, overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 450" style={{ display: 'block' }}>
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* World Map Dots Background */}
                    {Object.entries(DESTINATION_COORDS).map(([code, coords]) => {
                        const pos = getPos(coords.lat, coords.lng);
                        return (
                            <circle
                                key={code}
                                cx={pos.x}
                                cy={pos.y}
                                r={1.5}
                                fill="rgba(255, 255, 255, 0.15)"
                            />
                        );
                    })}

                    {/* Routes */}
                    {routes.map((route) => (
                        <g key={route.iata}>
                            <path
                                d={`M ${route.start.x} ${route.start.y} Q ${route.midX} ${route.midY} ${route.end.x} ${route.end.y}`}
                                fill="none"
                                stroke={route.color}
                                strokeWidth={hoveredRoute?.iata === route.iata ? 3 : 1 + route.popularity * 2}
                                strokeLinecap="round"
                                strokeOpacity={hoveredRoute && hoveredRoute.iata !== route.iata ? 0.2 : 0.8}
                                style={{
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => handleMouseEnter(e, route)}
                                onMouseLeave={handleMouseLeave}
                            />
                            {/* Hit area for easier hovering */}
                            <path
                                d={`M ${route.start.x} ${route.start.y} Q ${route.midX} ${route.midY} ${route.end.x} ${route.end.y}`}
                                fill="none"
                                stroke="transparent"
                                strokeWidth="15"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={(e) => handleMouseEnter(e, route)}
                                onMouseLeave={handleMouseLeave}
                            />

                            {/* Destination Dot */}
                            <circle
                                cx={route.end.x}
                                cy={route.end.y}
                                r={hoveredRoute?.iata === route.iata ? 5 : 3}
                                fill={route.color}
                                style={{ transition: 'all 0.3s ease' }}
                            />
                        </g>
                    ))}

                    {/* Origin Dot (Pulse effect) */}
                    <circle cx={originPos.x} cy={originPos.y} r="4" fill="var(--primary)">
                        <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={originPos.x} cy={originPos.y} r="3" fill="#fff" />
                </svg>

                {/* Tooltip Overlay */}
                {hoveredRoute && (
                    <div
                        style={{
                            position: 'absolute',
                            left: tooltipPos.x,
                            top: tooltipPos.y,
                            background: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid var(--glass-border)',
                            padding: '8px 12px',
                            borderRadius: 8,
                            pointerEvents: 'none',
                            zIndex: 10,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{hoveredRoute.iata}</div>
                        <div style={{ fontSize: '0.8rem', color: hoveredRoute.color }}>
                            {hoveredRoute.count} flyg ({hoveredRoute.label})
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div style={{
                    position: 'absolute',
                    bottom: 15,
                    left: 15,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    fontSize: '0.7rem',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    pointerEvents: 'none'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Populär (+70%)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Vanlig
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} /> Sällsynt
                    </div>
                </div>
            </div>
        </div>
    );
});

RouteMap.displayName = 'RouteMap';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DateRangeInput = React.memo(({ startDate, endDate, onStartChange, onEndChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
        <input
            type="date"
            value={startDate}
            onChange={onStartChange}
            aria-label="Startdatum"
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.8rem', outline: 'none', cursor: 'pointer', maxWidth: 110 }}
        />
        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>&rarr;</span>
        <input
            type="date"
            value={endDate}
            onChange={onEndChange}
            min={startDate}
            aria-label="Slutdatum"
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.8rem', outline: 'none', cursor: 'pointer', maxWidth: 110 }}
        />
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
    onEndDateChange
}) => {
    const [filter, setFilter] = useState('');

    // Filter flights based on query
    const filteredFlights = useMemo(
        () => filterFlightsByQuery(flights, filter),
        [flights, filter]
    );

    // Calculate statistics
    const stats = useMemo(() => {
        if (filteredFlights.length === 0) return null;

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

    // Handlers
    // Removed unused handlers

    // Early return if no flights
    if (!flights?.length) return null;

    return (
        <div id="airport-stats" className="glass-card fade-in" style={STYLES.container}>
            {/* Header */}
            <div style={STYLES.header}>
                <h2 style={STYLES.title}>
                    <span style={{ fontSize: '1.5rem', marginRight: 10 }}>📊</span>
                    <div>
                        Statistik för {airportIata}
                        <div style={{ marginTop: 5 }}>
                            <DateRangeInput
                                startDate={startDate}
                                endDate={endDate}
                                onStartChange={onStartDateChange}
                                onEndChange={onEndDateChange}
                            />
                        </div>
                    </div>
                </h2>

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

            {/* Content */}
            {!stats ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    Ingen data matchar din filtrering.
                </div>
            ) : (
                <>
                    {/* Route Map (Leaflet) */}
                    <div className="glass-card" style={{ padding: '0', marginBottom: '2rem', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-dim)' }}>FLYGRUTTER FRÅN {airportIata}</h3>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {stats.topDestinations.map(([dest, count]) => (
                                    <ProgressItem
                                        key={dest}
                                        label={dest}
                                        count={count}
                                        maxCount={stats.topDestinations[0][1]}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Airlines */}
                        <div>
                            <h3 style={STYLES.listHeader}>Flygbolag</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {stats.topAirlines.map(([airline, count]) => (
                                    <ProgressItem
                                        key={airline}
                                        label={airline}
                                        count={count}
                                        maxCount={stats.topAirlines[0][1]}
                                        color="#f59e0b"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
