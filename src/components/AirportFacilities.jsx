/**
 * @fileoverview Airport Facilities Component
 * @description Displays shops, restaurants, and services available at an airport.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { swedaviaService } from '../services/swedaviaApi';

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS = Object.freeze([
    { key: 'shops', label: 'Butiker' },
    { key: 'restaurants', label: 'Mat & Dryck' },
    { key: 'services', label: 'Tjänster' },
]);

const STYLES = {
    container: {
        padding: '2rem',
        maxWidth: 1100,
        margin: '3rem auto',
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
        fontSize: '1.5rem',
        fontWeight: 700,
    },
    tabContainer: {
        display: 'flex',
        gap: '0.5rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
    },
    facilityCard: {
        padding: '1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    facilityName: {
        fontWeight: 600,
        fontSize: '1rem',
    },
    facilityLocation: {
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
    },
    loadingContainer: {
        textAlign: 'center',
        padding: '3rem',
    },
    emptyState: {
        textAlign: 'center',
        padding: '3rem',
        color: 'var(--text-dim)',
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts unique facilities from API response, avoiding duplicates.
 * @param {Object} data - API response data.
 * @returns {Object[]} Array of unique facility objects.
 */
const extractUniqueFacilities = (data) => {
    if (!data) return [];

    // Handle both array and object responses
    const items = Array.isArray(data) ? data : data.facilities || data.shops || data.restaurants || data.services || [];

    // De-duplicate by name
    const seen = new Set();
    return items.filter((item) => {
        const name = item.name || item.facilityName;
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
    }).map((item) => ({
        id: item.id || item.facilityId || Math.random().toString(36).slice(2),
        name: item.name || item.facilityName,
        location: item.location || item.terminal || item.area || null,
    }));
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Tab button component */
const TabButton = React.memo(({ isActive, label, onClick }) => (
    <button
        onClick={onClick}
        className={`premium-btn ${isActive ? '' : 'secondary'}`}
        style={{
            padding: '6px 16px',
            fontSize: '0.8rem',
            opacity: isActive ? 1 : 0.7,
        }}
    >
        {label}
    </button>
));

TabButton.displayName = 'TabButton';

/** Single facility card */
const FacilityCard = React.memo(({ facility }) => (
    <div className="glass-card" style={STYLES.facilityCard}>
        <div style={STYLES.facilityName}>{facility.name}</div>
        {facility.location && <div style={STYLES.facilityLocation}>{facility.location}</div>}
    </div>
));

FacilityCard.displayName = 'FacilityCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Airport facilities component showing shops, restaurants, and services.
 * @param {Object} props
 * @param {string} props.airportIata - IATA code of the airport.
 * @returns {JSX.Element|null}
 */
export const AirportFacilities = ({ airportIata }) => {
    const [activeTab, setActiveTab] = useState('shops');
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(false);

    /**
     * Fetches facilities data based on active tab.
     */
    const fetchFacilities = useCallback(async () => {
        if (!airportIata) return;

        setLoading(true);
        try {
            let data;
            switch (activeTab) {
                case 'restaurants':
                    data = await swedaviaService.getRestaurants(airportIata);
                    break;
                case 'services':
                    data = await swedaviaService.getServices(airportIata);
                    break;
                default:
                    data = await swedaviaService.getShops(airportIata);
            }
            setFacilities(extractUniqueFacilities(data));
        } catch (error) {
            console.error('Error fetching facilities:', error);
            setFacilities([]);
        } finally {
            setLoading(false);
        }
    }, [airportIata, activeTab]);

    // Fetch on tab or airport change
    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    // Memoized tab handlers
    const tabHandlers = useMemo(
        () =>
            TABS.reduce((acc, tab) => {
                acc[tab.key] = () => setActiveTab(tab.key);
                return acc;
            }, {}),
        []
    );

    if (!airportIata) return null;

    return (
        <div className="glass-card fade-in" style={STYLES.container}>
            {/* Header */}
            <div style={STYLES.header}>
                <h3 style={STYLES.title}>Upptäck {airportIata}</h3>
                <div style={STYLES.tabContainer}>
                    {TABS.map((tab) => (
                        <TabButton
                            key={tab.key}
                            isActive={activeTab === tab.key}
                            label={tab.label}
                            onClick={tabHandlers[tab.key]}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={STYLES.loadingContainer}>
                    <p style={{ color: 'var(--text-dim)' }}>Laddar...</p>
                </div>
            ) : facilities.length === 0 ? (
                <div style={STYLES.emptyState}>
                    <p>Ingen information tillgänglig just nu.</p>
                </div>
            ) : (
                <div style={STYLES.grid}>
                    {facilities.map((facility) => (
                        <FacilityCard key={facility.id} facility={facility} />
                    ))}
                </div>
            )}
        </div>
    );
};
