import React, { useState, useEffect } from 'react';
import { swedaviaService } from '../services/swedaviaApi';

export const AirportFacilities = ({ airportIata }) => {
    const [activeTab, setActiveTab] = useState('shops');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (airportIata) {
            fetchData();
        }
    }, [airportIata, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let result = [];
            if (activeTab === 'shops') result = await swedaviaService.getShops(airportIata);
            else if (activeTab === 'restaurants') result = await swedaviaService.getRestaurants(airportIata);
            else if (activeTab === 'services') result = await swedaviaService.getServices(airportIata);

            setData(result || []);
        } catch (e) {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    if (!airportIata) return null;

    return (
        <div className="glass-card fade-in" style={{ padding: '2rem', margin: '2rem auto', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Upptäck {airportIata}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['shops', 'restaurants', 'services'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`premium-btn secondary ${activeTab === tab ? 'active' : ''}`}
                            style={{ padding: '5px 15px', fontSize: '0.8rem', opacity: activeTab === tab ? 1 : 0.6 }}
                        >
                            {tab === 'shops' ? 'Butiker' : tab === 'restaurants' ? 'Restauranger' : 'Service'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Hämtar information...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {data.length > 0 ? data.map((item, i) => (
                        <div key={i} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.3rem' }}>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                {item.location?.terminalName ? (
                                    <span>
                                        {item.location.terminalName}
                                        {item.location.place && <span style={{ opacity: 0.7 }}> • {item.location.place}</span>}
                                    </span>
                                ) : 'Information saknas'}
                            </div>
                            {item.openingHours && (
                                <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: 'var(--primary)' }}>
                                    Öppet: {item.openingHours}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                            Ingen information tillgänglig via API just nu.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
