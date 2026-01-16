import React, { useState, useEffect } from 'react';
import { SearchCard } from './components/SearchCard';
import { FlightList } from './components/FlightList';
import { SecurityWaitTime } from './components/SecurityWaitTime';
import { AirportFacilities } from './components/AirportFacilities';
import { swedaviaService } from './services/swedaviaApi';

const Atmosphere = () => (
  <div className="clouds-container">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="cloud"
        style={{
          width: `${Math.random() * 300 + 100}px`,
          height: `${Math.random() * 200 + 50}px`,
          top: `${Math.random() * 100}%`,
          left: `-${Math.random() * 500}px`,
          animationDuration: `${Math.random() * 60 + 40}s`,
          animationDelay: `${Math.random() * -100}s`,
          opacity: 0.1
        }}
      />
    ))}
  </div>
);

function App() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTitle, setSearchTitle] = useState('Välj flygplats för att se flyg');
  const [type, setType] = useState('arrivals');
  const [currentAirport, setCurrentAirport] = useState('');
  const [isNight, setIsNight] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsNight(hour >= 19 || hour <= 6);
  }, []);

  const handleAirportSelect = async (iata) => {
    setCurrentAirport(iata);
    setLoading(true);
    setError(null);
    setSearchTitle(`${type === 'arrivals' ? 'Ankomster' : 'Avgångar'} vid ${iata}`);
    try {
      const data = await swedaviaService.getFlights(iata, type);
      setFlights(data);
      if (data.length === 0) setError('Inga flyg hittades för valda parametrar. API-nyckel kan saknas.');
    } catch (e) {
      setError(e.message || 'Kunde inte hämta data från Swedavia.');
    } finally {
      setLoading(false);
    }
  };

  const toggleType = async () => {
    const newType = type === 'arrivals' ? 'departures' : 'arrivals';
    setType(newType);
    if (currentAirport) {
      handleAirportSelect(currentAirport);
    }
  };

  const handleManualSearch = async (flightId, date) => {
    setLoading(true);
    setError(null);
    setSearchTitle(`Sökresultat för ${flightId}`);
    try {
      const data = await swedaviaService.searchFlight(flightId, date);
      setFlights(data);
      if (data.length === 0) setError(`Hittade inga flighter med ID "${flightId}".`);
    } catch (e) {
      setError('Ett fel uppstod vid sökningen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-root ${isNight ? 'theme-night' : ''}`} style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="app-container">
        <Atmosphere />

        <header style={{ textAlign: 'center', margin: '3rem 0' }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px hsla(var(--primary-h), var(--primary-s), 50%, 0.4)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z" />
              </svg>
            </div>
            <h1 className="logo-text" style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-1px' }}>
              Kolla<span className="text-gradient">flyget</span><span style={{ fontSize: '0.8rem', verticalAlign: 'top', marginLeft: '5px', opacity: 0.6 }}>PRO</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto' }}>
            Utforska ankomster och avgångar vid Swedavias flygplatser med precision och stil.
          </p>
        </header>

        <main>
          <SecurityWaitTime airportIata={currentAirport} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }} className="fade-in">
            <button
              className={`premium-btn ${type !== 'arrivals' ? 'secondary' : ''}`}
              onClick={() => type !== 'arrivals' && toggleType()}
              style={{
                opacity: type === 'arrivals' ? 1 : 0.6,
                background: type === 'arrivals' ? 'var(--primary)' : 'var(--glass)',
                padding: '10px 20px',
                fontSize: '0.9rem'
              }}
            >
              Ankomster
            </button>
            <button
              className={`premium-btn ${type !== 'departures' ? 'secondary' : ''}`}
              onClick={() => type !== 'departures' && toggleType()}
              style={{
                opacity: type === 'departures' ? 1 : 0.6,
                background: type === 'departures' ? 'var(--primary)' : 'var(--glass)',
                padding: '10px 20px',
                fontSize: '0.9rem'
              }}
            >
              Avgångar
            </button>
          </div>

          <SearchCard
            onAirportSelect={handleAirportSelect}
            onSearch={handleManualSearch}
          />

          <FlightList
            flights={flights}
            loading={loading}
            title={searchTitle}
            error={error}
          />

          {currentAirport && !loading && (
            <AirportFacilities airportIata={currentAirport} />
          )}
        </main>

        <footer style={{ marginTop: '5rem', padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Kollaflyget Redesign. Datan tillhandahålls via Swedavia API.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
