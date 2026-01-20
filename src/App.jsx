/**
 * @fileoverview Main Application Component
 * @description Root component for the Kollaflyget flight information application.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchCard } from './components/SearchCard';
import { FlightList } from './components/FlightList';
import { SecurityWaitTime } from './components/SecurityWaitTime';
import { AirportFacilities } from './components/AirportFacilities';
import { AirportMap } from './components/AirportMap';
import { AirportStatistics } from './components/AirportStatistics';
import { swedaviaService } from './services/swedaviaApi';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TITLE = 'Välj flygplats för att se flyg';
const NIGHT_HOURS = { start: 19, end: 6 };

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Decorative animated cloud background */
const Atmosphere = React.memo(() => (
  <div className="clouds-container">
    {Array.from({ length: 6 }, (_, i) => (
      <div
        key={i}
        className="cloud"
        style={{
          width: `${100 + Math.random() * 300}px`,
          height: `${50 + Math.random() * 200}px`,
          top: `${Math.random() * 100}%`,
          left: `${-Math.random() * 500}px`,
          animationDuration: `${40 + Math.random() * 60}s`,
          animationDelay: `${-Math.random() * 100}s`,
          opacity: 0.1,
        }}
      />
    ))}
  </div>
));

Atmosphere.displayName = 'Atmosphere';

/** Logo icon component */
const LogoIcon = React.memo(() => (
  <div
    style={{
      width: 48,
      height: 48,
      background: 'var(--primary)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 0 20px hsla(var(--primary-h), var(--primary-s), 50%, 0.4)',
    }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z" />
    </svg>
  </div>
));

LogoIcon.displayName = 'LogoIcon';

/** Flight type toggle buttons */
const FlightTypeToggle = React.memo(({ type, onToggle }) => {
  const buttons = [
    { value: 'arrivals', label: 'Ankomster' },
    { value: 'departures', label: 'Avgångar' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {buttons.map(({ value, label }) => (
        <button
          key={value}
          className={`premium-btn ${type !== value ? 'secondary' : ''}`}
          onClick={() => type !== value && onToggle()}
          style={{
            opacity: type === value ? 1 : 0.6,
            background: type === value ? 'var(--primary)' : 'var(--glass)',
            padding: '10px 20px',
            fontSize: '0.9rem',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

FlightTypeToggle.displayName = 'FlightTypeToggle';

/** Date selector component */
const DateSelector = React.memo(({ startDate, endDate, onStartChange, onEndChange }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'var(--glass)',
      padding: '5px 15px',
      borderRadius: 12,
      border: '1px solid var(--glass-border)',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Från</span>
      <input
        type="date"
        value={startDate}
        onChange={onStartChange}
        aria-label="Startdatum"
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '0.8rem',
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
    <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Till</span>
      <input
        type="date"
        value={endDate}
        onChange={onEndChange}
        min={startDate}
        aria-label="Slutdatum"
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '0.8rem',
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  </div>
));

DateSelector.displayName = 'DateSelector';

/** Stats navigation button */
const StatsButton = React.memo(() => {
  const scrollToStats = () => {
    document.getElementById('airport-stats')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToStats}
      className="premium-btn"
      style={{
        padding: '8px 20px',
        fontSize: '0.8rem',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
      }}
    >
      Visa Statistik
    </button>
  );
});

StatsButton.displayName = 'StatsButton';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main application component.
 * @returns {JSX.Element}
 */
function App() {
  // State
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTitle, setSearchTitle] = useState(DEFAULT_TITLE);
  const [type, setType] = useState('arrivals');
  const [currentAirport, setCurrentAirport] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Theme based on time of day
  const isNight = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= NIGHT_HOURS.start || hour <= NIGHT_HOURS.end;
  }, []);

  // Determine if we should show statistics
  const showStatistics = useMemo(() => {
    // Early return if no flights AND no metadata (to avoid hiding the warning)
    if (!flights?.length && (!flights?._metadata || flights?._metadata.missingDates.length === 0)) {
      return false;
    }
    return currentAirport && (flights.length > 0 || loading);
  }, [currentAirport, flights, loading]);

  /**
   * Handles airport selection and fetches flight data.
   */
  const handleAirportSelect = useCallback(
    async (iata, start = startDate, end = endDate) => {
      console.log('handleAirportSelect called with:', { iata, start, end, type });
      setCurrentAirport(iata);
      setLoading(true);
      setError(null);

      const typeLabel = type === 'arrivals' ? 'Ankomster' : 'Avgångar';
      const dateLabel = start === end ? start : `${start} - ${end}`;
      setSearchTitle(`${typeLabel} vid ${iata} ${dateLabel}`);

      try {
        let data;
        if (start === end) {
          console.log('App.jsx: Fetching single date', start);
          data = await swedaviaService.getFlights(iata, type, start);
        } else {
          console.log('App.jsx: Fetching range', start, end);
          data = await swedaviaService.getFlightsInRange(iata, type, start, end);
        }

        console.log('App.jsx received data:', data, 'Metadata:', data._metadata);
        setFlights(data);
        if (data.length === 0 && (!data._metadata || data._metadata.missingDates.length === data._metadata.totalDates)) {
          setError('Inga flyg hittades för valda parametrar.');
        }
      } catch (e) {
        setError(e.message || 'Kunde inte hämta data från Swedavia.');
      } finally {
        setLoading(false);
      }
    },
    [type, startDate, endDate]
  );

  /**
   * Toggles between arrivals and departures.
   */
  const toggleType = useCallback(() => {
    const newType = type === 'arrivals' ? 'departures' : 'arrivals';
    setType(newType);
  }, [type]);

  // Re-fetch when type changes (if airport is selected)
  useEffect(() => {
    if (currentAirport) {
      handleAirportSelect(currentAirport, startDate, endDate);
    }
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handles date changes.
   */
  const handleStartDateChange = useCallback((e) => {
    const newDate = e.target.value;
    setStartDate(newDate);
    if (newDate > endDate) setEndDate(newDate); // Ensure end >= start

    if (currentAirport) {
      handleAirportSelect(currentAirport, newDate, newDate > endDate ? newDate : endDate).then(() => {
        // Wait for render to stabilize then scroll
        setTimeout(() => {
          document.getElementById('airport-stats')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      });
    }
  }, [currentAirport, endDate, handleAirportSelect]);

  const handleEndDateChange = useCallback((e) => {
    const newDate = e.target.value;
    setEndDate(newDate);
    if (currentAirport) {
      handleAirportSelect(currentAirport, startDate, newDate).then(() => {
        // Wait for render to stabilize then scroll
        setTimeout(() => {
          document.getElementById('airport-stats')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      });
    }
  }, [currentAirport, startDate, handleAirportSelect]);

  /**
   * Handles manual flight search.
   */
  const handleManualSearch = useCallback(async (query, date) => {
    setLoading(true);
    setError(null);
    setSearchTitle(`Sökresultat för ${query}`);

    try {
      const data = await swedaviaService.searchFlight(query, date);
      setFlights(data);
      if (data.length === 0) {
        setError('Inga flyg hittades för valda parametrar.');
      }
    } catch {
      setError('Ett fel uppstod vid hämtning av flyg.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div
      className={`app-root ${isNight ? 'theme-night' : ''}`}
      style={{ minHeight: '100vh', padding: '1rem' }}
    >
      <div className="app-container">
        <Atmosphere />

        {/* Header */}
        <header style={{ textAlign: 'center', margin: '3rem 0' }} className="fade-in">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <LogoIcon />
            <h1
              className="logo-text"
              style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1px' }}
            >
              Kolla<span className="text-gradient">flyget</span>
              <span
                style={{
                  fontSize: '0.8rem',
                  verticalAlign: 'top',
                  marginLeft: 5,
                  opacity: 0.6,
                }}
              >
                PRO
              </span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-dim)', maxWidth: 400, margin: '0 auto' }}>
            Utforska ankomster och avgångar vid Swedavias flygplatser med precision och stil.
          </p>
        </header>

        {/* Main Content */}
        <main>
          <SecurityWaitTime airportIata={currentAirport} />

          {/* Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
            }}
            className="fade-in"
          >
            <FlightTypeToggle type={type} onToggle={toggleType} />
            {showStatistics && <StatsButton />}
          </div>

          <SearchCard onAirportSelect={handleAirportSelect} onSearch={handleManualSearch} />

          <FlightList flights={flights} loading={loading} title={searchTitle} error={error} />

          {showStatistics && (
            <AirportStatistics
              flights={flights}
              loading={loading}
              airportIata={currentAirport}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
            />
          )}

          {currentAirport && (
            <>
              <AirportMap airportIata={currentAirport} />
              <AirportFacilities airportIata={currentAirport} />
            </>
          )}
        </main>

        {/* Footer */}
        <footer
          style={{
            marginTop: '5rem',
            padding: '2rem',
            textAlign: 'center',
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Kollaflyget Redesign. Datan tillhandahålls via
            Swedavia API.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
