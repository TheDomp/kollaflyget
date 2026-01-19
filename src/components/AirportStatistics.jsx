/**
 * @fileoverview Airport Statistics Dashboard Component
 * @description Interactive dashboard showing flight statistics with filtering capabilities.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { COUNTRY_MAPPING, DESTINATION_COORDS } from '../services/swedaviaApi';
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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


    // Early return if no flights
    if (!flights?.length) return null;

    return (
        <div id="airport-stats" className="glass-card fade-in" style={STYLES.container}>
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
