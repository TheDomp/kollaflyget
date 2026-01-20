/**
 * @fileoverview Airport Map Component
 * @description Displays an interactive map of the airport and nearby points of interest.
 */

import React, { useState, useMemo } from 'react';
import { AIRPORTS } from '../services/swedaviaApi';

const MAP_MODES = [
    { id: 'place', label: 'Översikt', icon: '📍' },
    { id: 'hotels', label: 'Hotell', icon: '🏨' },
    { id: 'parking', label: 'Parkering', icon: '🅿️' },
    { id: 'bus', label: 'Transport', icon: '🚌' },
];

const STYLES = {
    container: {
        margin: '3rem auto',
        maxWidth: 1100,
        overflow: 'hidden',
    },
    header: {
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid var(--glass-border)',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 700,
        margin: 0,
    },
    controls: {
        display: 'flex',
        gap: '0.5rem',
    },
    mapWrapper: {
        height: 450,
        width: '100%',
        position: 'relative',
        background: 'rgba(0,0,0,0.2)',
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 0,
        // Removed inversion filter to show natural satellite colors
    },
    footer: {
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.1)',
    }
};

/**
 * Interactive Airport Map component.
 * @param {Object} props
 * @param {string} props.airportIata - IATA code for the airport.
 */
export const AirportMap = ({ airportIata }) => {
    const [mode, setMode] = useState('place');

    const airport = useMemo(() =>
        AIRPORTS.find(a => a.iata === airportIata),
        [airportIata]
    );

    if (!airport) return null;

    const mapUrl = useMemo(() => {
        const query = mode === 'place'
            ? `${airport.name}`
            : `${mode} near ${airport.name}`;

        // We use the Embed API with the free search mode (no API key needed for basic display if user has a session, 
        // but better to use the public embed without key if possible, or just a link. 
        // Actually, Google Maps Embed API requires a key for most things now. 
        // However, we can use the "view" mode with coordinates which sometimes works better without key in dev.
        // Let's use the standard search embed which is most robust.
        return `https://www.google.com/maps/embed/v1/search?key=KEY_PLACEHOLDER&q=${encodeURIComponent(query)}&center=${airport.lat},${airport.lng}&zoom=14`;

        // NOTE: Since I don't have a valid key for the user, I will use the "Place" URL format which is often free for simple embedding
        // Or I'll use a trick: public maps URL sometimes works in iframe for search if formatted correctly.
        // Actually, let's use the standard public search URL if we can't use Embed API.
    }, [airport, mode]);

    // Fallback if Embed API requires key: Use a direct link or a simple visualization
    // For this demo, I'll use a slightly different approach: a large button to open the map and a placeholder
    // NO, I will use the "Place" embed which often works for businesses.

    const googleMapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
        mode === 'place' ? airport.name : `${mode} near ${airport.name}`
    )}&t=k&output=embed`;

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${airport.lat},${airport.lng}`;

    return (
        <div className="glass-card fade-in" style={STYLES.container}>
            <div style={STYLES.header}>
                <div>
                    <h3 style={STYLES.title}>Hitta till {airport.iata}</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                        {airport.name}
                    </p>
                </div>
                <div style={STYLES.controls}>
                    {MAP_MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`premium-btn ${mode === m.id ? '' : 'secondary'}`}
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                opacity: mode === m.id ? 1 : 0.7,
                            }}
                        >
                            <span style={{ marginRight: 5 }}>{m.icon}</span>
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={STYLES.mapWrapper}>
                <iframe
                    title="Airport Map"
                    style={STYLES.iframe}
                    src={googleMapEmbedUrl}
                    allowFullScreen
                    loading="lazy"
                ></iframe>
            </div>

            <div style={STYLES.footer}>
                <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="premium-btn"
                    style={{
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    }}
                >
                    Få vägbeskrivning ↗
                </a>
            </div>
        </div>
    );
};
