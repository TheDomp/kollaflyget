/**
 * @fileoverview Swedavia Flight API Service
 * @description Provides all data fetching and utility functions for the Kollaflyget application.
 * Supports flight information, wait times, airport facilities, and search functionality.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * List of supported Swedavia airports with IATA codes.
 * @type {Array<{iata: string, name: string}>}
 */
export const AIRPORTS = Object.freeze([
  { iata: 'ARN', name: 'Stockholm Arlanda Airport' },
  { iata: 'GOT', name: 'Göteborg Landvetter Airport' },
  { iata: 'BMA', name: 'Stockholm Bromma Airport' },
  { iata: 'MMX', name: 'Malmö Airport' },
  { iata: 'LLA', name: 'Luleå Airport' },
  { iata: 'UME', name: 'Umeå Airport' },
  { iata: 'OSR', name: 'Östersund Airport' },
  { iata: 'VBY', name: 'Visby Airport' },
  { iata: 'RNB', name: 'Ronneby Airport' },
  { iata: 'KRN', name: 'Kiruna Airport' },
]);

/**
 * Mapping of country names to associated airports and cities for search functionality.
 * @type {Record<string, string[]>}
 */
export const COUNTRY_MAPPING = Object.freeze({
  'Spanien': ['MAD', 'BAR', 'ALC', 'AGP', 'PMI', 'LPA', 'TFS', 'Alicante', 'Malaga', 'Barcelona', 'Madrid', 'Palma', 'Gran Canaria', 'Teneriffa'],
  'Tyskland': ['FRA', 'MUC', 'BER', 'HAM', 'DUS', 'Frankfurt', 'München', 'Berlin', 'Hamburg', 'Düsseldorf'],
  'Storbritannien': ['LHR', 'LGW', 'STN', 'MAN', 'London', 'Manchester'],
  'Frankrike': ['CDG', 'ORY', 'NCE', 'Paris', 'Nice'],
  'Italien': ['FCO', 'MXP', 'VCE', 'Rom', 'Milano', 'Venedig'],
  'Norge': ['OSL', 'BGO', 'TRD', 'Oslo', 'Bergen', 'Trondheim'],
  'Danmark': ['CPH', 'BLL', 'Köpenhamn', 'Billund'],
  'Finland': ['HEL', 'Helsingfors'],
  'USA': ['JFK', 'EWR', 'ORD', 'LAX', 'New York', 'Chicago', 'Los Angeles'],
  'Thailand': ['BKK', 'HKT', 'Bangkok', 'Phuket'],
  'Grekland': ['ATH', 'CHQ', 'RHO', 'Aten', 'Chania', 'Rhodos'],
});

/** @private */
const BASE_URL = 'https://api.swedavia.se';

/** @private */
const API_KEYS = Object.freeze({
  FLIGHT: '1ae1384d87da43779929eed906133834',
  WAIT: '08db80ea420a4b0097eb73ab83059f18',
  AIRPORT: '34daabcfe6094b8482dd9fc639f5ff61',
});

/** @private */
const STORAGE_KEY = 'kollaflyget_favs';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns today's date in ISO format (YYYY-MM-DD).
 * @returns {string}
 */
const getToday = () => new Date().toISOString().split('T')[0];

/**
 * Determines the correct API key based on the endpoint path.
 * @param {string} path - The API endpoint path.
 * @returns {string} The API key or empty string.
 */
const getApiKey = (path) => {
  if (path.includes('/flightinfo/')) return API_KEYS.FLIGHT;
  if (path.includes('/waittime')) return API_KEYS.WAIT;
  if (path.includes('/airportinfo/')) return API_KEYS.AIRPORT;
  return '';
};

/**
 * Fetches data from Swedavia API, handling CORS in production.
 * @param {string} path - The API endpoint path.
 * @returns {Promise<Object>} The parsed JSON response.
 * @throws {Error} If the request fails.
 */
const fetchWithProxy = async (path) => {
  const url = `${BASE_URL}${path}`;
  const apiKey = getApiKey(path);
  const isProd = !window.location.hostname.includes('localhost');

  const headers = {
    Accept: 'application/json',
    ...(apiKey && { 'Ocp-Apim-Subscription-Key': apiKey }),
  };

  const endpoint = isProd
    ? `https://corsproxy.io/?${encodeURIComponent(url)}`
    : `/swedavia-api${path}`;

  const response = await fetch(endpoint, { headers });

  if (response.status === 401) {
    throw new Error('API-nyckel saknas eller är felaktig (401).');
  }
  if (!response.ok) {
    throw new Error(`Network error: ${response.status}`);
  }

  return response.json();
};

/**
 * Transforms raw API flight data to our application format.
 * @param {Object} rawFlight - Raw flight object from API.
 * @param {'arrivals'|'departures'} type - Flight type.
 * @returns {Object} Transformed flight object.
 */
const transformFlight = (rawFlight, type) => {
  const isArrival = type === 'arrivals';
  const timeData = isArrival ? rawFlight.arrivalTime : rawFlight.departureTime;

  return {
    id: rawFlight.flightId,
    airline: rawFlight.airlineOperator?.name ?? 'Unknown',
    destination: isArrival
      ? rawFlight.departureAirportSwedish
      : rawFlight.arrivalAirportSwedish,
    time: timeData?.scheduledUtc?.split('T')[1]?.substring(0, 5) ?? '--:--',
    status: rawFlight.locationAndStatus?.flightLegStatusSwedish ?? 'Okänd',
    gate: rawFlight.locationAndStatus?.gate ?? '-',
    type: isArrival ? 'Arrival' : 'Departure',
    terminal: rawFlight.locationAndStatus?.terminal ?? null,
  };
};

/**
 * Filters flights based on a search query, supporting country lookup.
 * @param {Object[]} flights - Array of flight objects.
 * @param {string} query - Search query.
 * @returns {Object[]} Filtered flights.
 */
const filterFlights = (flights, query) => {
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

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Swedavia API Service - provides all flight and airport data operations.
 */
export const swedaviaService = {
  /**
   * Returns the list of available airports.
   * @returns {Array<{iata: string, name: string}>}
   */
  getAirports: () => AIRPORTS,

  /**
   * Fetches flight data for a specific airport, type, and date.
   * @param {string} airportIata - The IATA code of the airport.
   * @param {'arrivals'|'departures'} [type='arrivals'] - Flight type.
   * @param {string|null} [date=null] - Date in YYYY-MM-DD format. Defaults to today.
   * @returns {Promise<Object[]>} Array of flight objects.
   */
  getFlights: async (airportIata, type = 'arrivals', date = null) => {
    const targetDate = date ?? getToday();
    const path = `/flightinfo/v2/${airportIata}/${type}/${targetDate}`;

    try {
      const data = await fetchWithProxy(path);
      return (data.flights ?? []).map((f) => transformFlight(f, type));
    } catch (error) {
      console.error('Error fetching flights:', error);
      throw error;
    }
  },

  /**
   * Fetches current security wait time for an airport.
   * @param {string} airportIata - The IATA code of the airport.
   * @returns {Promise<string|null>} Wait time in minutes or null.
   */
  getWaitTime: async (airportIata) => {
    try {
      const data = await fetchWithProxy(`/waittimepublic/v2/airports/${airportIata}`);
      if (data?.length > 0) {
        return Math.max(...data.map((cp) => cp.waitTimeSec / 60)).toFixed(0);
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Fetches restaurant listings for an airport.
   * @param {string} iata - The IATA code.
   * @returns {Promise<Object>}
   */
  getRestaurants: (iata) => fetchWithProxy(`/airportinfo/v2/${iata}/restaurants?langcode=sv`),

  /**
   * Fetches shop listings for an airport.
   * @param {string} iata - The IATA code.
   * @returns {Promise<Object>}
   */
  getShops: (iata) => fetchWithProxy(`/airportinfo/v2/${iata}/shops?langcode=sv`),

  /**
   * Fetches service listings for an airport.
   * @param {string} iata - The IATA code.
   * @returns {Promise<Object>}
   */
  getServices: (iata) => fetchWithProxy(`/airportinfo/v2/${iata}/services?langcode=sv`),

  /**
   * Fetches destination listings for an airport.
   * @param {string} iata - The IATA code.
   * @returns {Promise<Object>}
   */
  getDestinations: (iata) => fetchWithProxy(`/airportinfo/v2/${iata}/destinations`),

  /**
   * Generates mock weather data for a destination (placeholder for real API).
   * @param {string} _location - The location name (unused).
   * @returns {Promise<{temp: number, condition: string}>}
   */
  getWeather: async (_location) => {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Snow'];
    const temps = [12, 18, 5, 22, -2, 15];
    return {
      temp: temps[Math.floor(Math.random() * temps.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
    };
  },

  /**
   * Retrieves favorite flight IDs from local storage.
   * @returns {string[]}
   */
  getFavorites: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Toggles a flight's favorite status.
   * @param {string} flightId - The flight ID to toggle.
   * @returns {string[]} Updated favorites array.
   */
  toggleFavorite: (flightId) => {
    const favs = swedaviaService.getFavorites();
    const index = favs.indexOf(flightId);

    if (index > -1) {
      favs.splice(index, 1);
    } else {
      favs.push(flightId);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    return favs;
  },

  /**
   * Searches for flights matching a query (ID, destination, airline, or country).
   * @param {string} query - Search query.
   * @param {string|null} [date=null] - Date in YYYY-MM-DD format.
   * @returns {Promise<Object[]>} Matching flights.
   */
  searchFlight: async (query, date = null) => {
    const targetDate = date ?? getToday();
    const [arrivals, departures] = await Promise.all([
      swedaviaService.getFlights('ARN', 'arrivals', targetDate),
      swedaviaService.getFlights('ARN', 'departures', targetDate),
    ]);
    return filterFlights([...arrivals, ...departures], query);
  },
};
