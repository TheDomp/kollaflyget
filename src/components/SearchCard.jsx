import React, { useState } from 'react';
import { AIRPORTS } from '../services/swedaviaApi';

export const SearchCard = ({ onSearch, onAirportSelect }) => {
    const [flightId, setFlightId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedAirport, setSelectedAirport] = useState('');

    const handleAirportChange = (e) => {
        const iata = e.target.value;
        setSelectedAirport(iata);
        if (iata) {
            onAirportSelect(iata);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (flightId) {
            onSearch(flightId, date);
        }
    };

    return (
        <div className="glass-card fade-in" style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }} className="text-gradient">Hitta ditt flyg</h2>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Välj en flygplats</label>
                <select
                    value={selectedAirport}
                    onChange={handleAirportChange}
                    style={{ width: '100%', cursor: 'pointer' }}
                >
                    <option value="">-- Välj flygplats --</option>
                    {AIRPORTS.map(airport => (
                        <option key={airport.iata} value={airport.iata}>{airport.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--glass-border)', zIndex: 0 }}></div>
                <span style={{ position: 'relative', background: 'var(--bg-darker)', padding: '0 1rem', color: 'var(--text-dim)', fontSize: '0.8rem', zIndex: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>Eller sök manuellt</span>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Flight ID</label>
                    <input
                        type="text"
                        placeholder="t.ex. SK160"
                        value={flightId}
                        onChange={(e) => setFlightId(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Datum</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
                <button type="submit" className="premium-btn" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                    Sök flyg
                </button>
            </form>
        </div>
    );
};
