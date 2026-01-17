/**
 * @fileoverview Search Card Component
 * @description Provides airport selection and manual flight search functionality.
 */

import React, { useState, useCallback } from 'react';
import { AIRPORTS } from '../services/swedaviaApi';

// ============================================================================
// CONSTANTS
// ============================================================================

const STYLES = {
    container: {
        padding: '2rem',
        maxWidth: 600,
        margin: '2rem auto',
    },
    title: {
        marginBottom: '1.5rem',
        textAlign: 'center',
    },
    selectContainer: {
        marginBottom: '2rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        color: 'var(--text-dim)',
        fontSize: '0.9rem',
    },
    select: {
        width: '100%',
        cursor: 'pointer',
    },
    divider: {
        position: 'relative',
        textAlign: 'center',
        margin: '1.5rem 0',
    },
    dividerLine: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 1,
        background: 'var(--glass-border)',
        zIndex: 0,
    },
    dividerText: {
        position: 'relative',
        background: 'var(--bg-darker)',
        padding: '0 1rem',
        color: 'var(--text-dim)',
        fontSize: '0.8rem',
        zIndex: 1,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    form: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    input: {
        width: '100%',
    },
    submitButton: {
        gridColumn: 'span 2',
        marginTop: '1rem',
    },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Search card component with airport selector and manual search.
 * @param {Object} props
 * @param {Function} props.onAirportSelect - Callback for airport selection.
 * @param {Function} props.onSearch - Callback for manual search.
 * @returns {JSX.Element}
 */
export const SearchCard = ({ onSearch, onAirportSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedAirport, setSelectedAirport] = useState('');

    /**
     * Handles airport selection change.
     */
    const handleAirportChange = useCallback(
        (e) => {
            const iata = e.target.value;
            setSelectedAirport(iata);
            if (iata) {
                onAirportSelect(iata);
            }
        },
        [onAirportSelect]
    );

    /**
     * Handles manual search form submission.
     */
    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault();
            const query = searchQuery.trim();
            if (query) {
                onSearch(query, searchDate);
            }
        },
        [searchQuery, searchDate, onSearch]
    );

    /**
     * Handles search query input change.
     */
    const handleQueryChange = useCallback((e) => setSearchQuery(e.target.value), []);

    /**
     * Handles search date input change.
     */
    const handleDateChange = useCallback((e) => setSearchDate(e.target.value), []);

    return (
        <div className="glass-card fade-in" style={STYLES.container}>
            <h2 style={STYLES.title} className="text-gradient">
                Hitta ditt flyg
            </h2>

            {/* Airport Selector */}
            <div style={STYLES.selectContainer}>
                <label style={STYLES.label}>Välj en flygplats</label>
                <select value={selectedAirport} onChange={handleAirportChange} style={STYLES.select}>
                    <option value="">-- Välj flygplats --</option>
                    {AIRPORTS.map((airport) => (
                        <option key={airport.iata} value={airport.iata}>
                            {airport.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Divider */}
            <div style={STYLES.divider}>
                <div style={STYLES.dividerLine} />
                <span style={STYLES.dividerText}>Eller sök manuellt</span>
            </div>

            {/* Manual Search Form */}
            <form onSubmit={handleSubmit} style={STYLES.form}>
                <div>
                    <label style={STYLES.label}>Stad, land eller flyg-ID</label>
                    <input
                        type="text"
                        placeholder="t.ex. London, Spanien eller SK160"
                        value={searchQuery}
                        onChange={handleQueryChange}
                        style={STYLES.input}
                    />
                </div>
                <div>
                    <label style={STYLES.label}>Datum</label>
                    <input
                        type="date"
                        value={searchDate}
                        onChange={handleDateChange}
                        style={STYLES.input}
                    />
                </div>
                <button type="submit" className="premium-btn" style={STYLES.submitButton}>
                    Sök flyg
                </button>
            </form>
        </div>
    );
};
