/**
 * @fileoverview Security Wait Time Component
 * @description Displays current security checkpoint wait time for an airport.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { swedaviaService } from '../services/swedaviaApi';

// ============================================================================
// CONSTANTS
// ============================================================================

const REFRESH_INTERVAL_MS = 60000; // 1 minute

const STYLES = {
    container: {
        padding: '1rem 1.5rem',
        maxWidth: 300,
        margin: '1rem auto',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    iconWrapper: {
        color: 'var(--primary)',
        position: 'relative',
        display: 'flex',
    },
    label: {
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: '1.1rem',
        fontWeight: 700,
    },
    progressContainer: {
        height: 4,
        flex: 1,
        background: 'var(--glass-border)',
        borderRadius: 2,
        overflow: 'hidden',
        marginLeft: 'auto',
    },
};

/**
 * Returns a color based on wait time severity.
 * @param {number} waitTime - Wait time in minutes.
 * @returns {string} Hex color code.
 */
const getWaitTimeColor = (waitTime) => {
    if (waitTime > 15) return '#ef4444'; // Red
    if (waitTime > 7) return '#f59e0b'; // Orange
    return '#10b981'; // Green
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Shield icon for security */
const ShieldIcon = React.memo(() => (
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
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
));

ShieldIcon.displayName = 'ShieldIcon';

/** Progress bar visualization */
const WaitTimeProgress = React.memo(({ waitTime }) => {
    const percentage = Math.min(100, (waitTime / 20) * 100);
    const color = getWaitTimeColor(waitTime);

    return (
        <div style={STYLES.progressContainer}>
            <div
                style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: color,
                    transition: 'width 0.5s ease',
                }}
            />
        </div>
    );
});

WaitTimeProgress.displayName = 'WaitTimeProgress';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Security wait time display component.
 * @param {Object} props
 * @param {string} props.airportIata - IATA code of the airport.
 * @returns {JSX.Element|null}
 */
export const SecurityWaitTime = ({ airportIata }) => {
    const [waitTime, setWaitTime] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * Fetches the current wait time from the API.
     */
    const fetchWaitTime = useCallback(async () => {
        if (!airportIata) return;

        setLoading(true);
        try {
            const time = await swedaviaService.getWaitTime(airportIata);
            setWaitTime(time);
        } finally {
            setLoading(false);
        }
    }, [airportIata]);

    // Fetch on mount and set up refresh interval
    useEffect(() => {
        if (!airportIata) return;

        fetchWaitTime();
        const interval = setInterval(fetchWaitTime, REFRESH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [airportIata, fetchWaitTime]);

    // Don't render if no airport or no data
    if (!airportIata || (!waitTime && !loading)) {
        return null;
    }

    const displayValue = loading ? '...' : waitTime !== null ? `${waitTime} min` : 'Ingen data';

    return (
        <div className="glass-card fade-in" style={STYLES.container}>
            <div style={STYLES.iconWrapper}>
                <ShieldIcon />
            </div>

            <div>
                <div style={STYLES.label}>Säkerhetskontroll</div>
                <div style={STYLES.value}>{displayValue}</div>
            </div>

            {waitTime !== null && <WaitTimeProgress waitTime={Number(waitTime)} />}
        </div>
    );
};
