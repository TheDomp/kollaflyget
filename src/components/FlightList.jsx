import React from 'react';

const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
        const s = status.toLowerCase();
        if (s.includes('on time')) return '#10b981';
        if (s.includes('delayed')) return '#f59e0b';
        if (s.includes('boarding')) return '#3b82f6';
        if (s.includes('cancelled')) return '#ef4444';
        return 'var(--text-dim)';
    };

    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: `${getStatusColor()}20`,
            color: getStatusColor(),
            border: `1px solid ${getStatusColor()}40`
        }}>
            {status}
        </span>
    );
};

export const FlightList = ({ flights, loading, title }) => {
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--glass-border)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                }}></div>
                <style dangerouslySetInnerHTML={{
                    __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
                <p style={{ color: 'var(--text-dim)' }}>Hämtar flygdata...</p>
            </div>
        );
    }

    if (!flights || flights.length === 0) {
        return (
            <div className="glass-card fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', margin: '2rem auto' }}>
                <p style={{ color: 'var(--text-dim)' }}>Inga resultat hittades. Försök med en annan sökning.</p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '2rem auto' }}>
            <h3 style={{ marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {flights.map(flight => (
                    <div key={flight.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{flight.time}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{flight.type}</div>
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{flight.destination}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{flight.airline} • {flight.id}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Gate</div>
                                <div style={{ fontWeight: '600' }}>{flight.gate}</div>
                            </div>
                            <StatusBadge status={flight.status} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
