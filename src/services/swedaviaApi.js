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
  { iata: 'ARN', name: 'Stockholm Arlanda Airport', lat: 59.6519, lng: 17.9186 },
  { iata: 'GOT', name: 'Göteborg Landvetter Airport', lat: 57.6688, lng: 12.2797 },
  { iata: 'BMA', name: 'Stockholm Bromma Airport', lat: 59.3544, lng: 17.9417 },
  { iata: 'MMX', name: 'Malmö Airport', lat: 55.5302, lng: 13.3724 },
  { iata: 'LLA', name: 'Luleå Airport', lat: 65.5437, lng: 22.1264 },
  { iata: 'UME', name: 'Umeå Airport', lat: 63.7930, lng: 20.2829 },
  { iata: 'OSR', name: 'Östersund Airport', lat: 63.1932, lng: 14.5007 },
  { iata: 'VBY', name: 'Visby Airport', lat: 57.6628, lng: 18.3461 },
  { iata: 'RNB', name: 'Ronneby Airport', lat: 56.2667, lng: 15.2650 },
  { iata: 'KRN', name: 'Kiruna Airport', lat: 67.8222, lng: 20.3367 },
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

/**
 * Coordinate mapping for common destinations (IATA code to Lat/Lng).
 * Used for drawing flight route maps.
 * @type {Record<string, {lat: number, lng: number}>}
 */
export const DESTINATION_COORDS = Object.freeze({
  // Sweden
  'ARN': { lat: 59.6519, lng: 17.9186 },
  'GOT': { lat: 57.6688, lng: 12.2797 },
  'BMA': { lat: 59.3544, lng: 17.9417 },
  'MMX': { lat: 55.5302, lng: 13.3724 },
  'LLA': { lat: 65.5437, lng: 22.1264 },
  'UME': { lat: 63.7930, lng: 20.2829 },
  'OSR': { lat: 63.1932, lng: 14.5007 },
  'VBY': { lat: 57.6628, lng: 18.3461 },
  'RNB': { lat: 56.2667, lng: 15.2650 },
  'KRN': { lat: 67.8222, lng: 20.3367 },
  'SDL': { lat: 62.4831, lng: 17.4378 }, // Sundsvall
  'VXO': { lat: 56.9286, lng: 14.7269 }, // Växjö
  'NRK': { lat: 58.5913, lng: 16.2417 }, // Norrköping
  'KSD': { lat: 59.4444, lng: 13.3375 }, // Karlstad

  // Europe
  'HEL': { lat: 60.3172, lng: 24.9633 }, // Helsinki
  'CPH': { lat: 55.6180, lng: 12.6508 }, // Copenhagen
  'OSL': { lat: 60.1975, lng: 11.1004 }, // Oslo
  'FRA': { lat: 50.0379, lng: 8.5622 },  // Frankfurt
  'MUC': { lat: 48.3537, lng: 11.7861 }, // Munich
  'BER': { lat: 52.3667, lng: 13.5033 }, // Berlin
  'LHR': { lat: 51.4700, lng: -0.4543 }, // London Heathrow
  'LGW': { lat: 51.1481, lng: -0.1903 }, // London Gatwick
  'AMS': { lat: 52.3086, lng: 4.7639 },  // Amsterdam
  'CDG': { lat: 49.0097, lng: 2.5479 },  // Paris CDG
  'MAD': { lat: 40.4839, lng: -3.5680 }, // Madrid
  'BCN': { lat: 41.2974, lng: 2.0833 },  // Barcelona
  'AGP': { lat: 36.6749, lng: -4.4991 }, // Malaga
  'PMI': { lat: 39.5495, lng: 2.7388 },  // Palma
  'ALC': { lat: 38.2822, lng: -0.5582 }, // Alicante
  'FCO': { lat: 41.8003, lng: 12.2389 }, // Rome
  'MXP': { lat: 45.6300, lng: 8.7231 },  // Milan
  'VCE': { lat: 45.5053, lng: 12.3519 }, // Venice
  'ATH': { lat: 37.9364, lng: 23.9445 }, // Athens
  'ZRH': { lat: 47.4582, lng: 8.5555 },  // Zurich
  'VIE': { lat: 48.1103, lng: 16.5697 }, // Vienna
  'BRU': { lat: 50.9014, lng: 4.4844 },  // Brussels
  'IST': { lat: 41.2753, lng: 28.7519 }, // Istanbul

  // World
  'DXB': { lat: 25.2532, lng: 55.3657 }, // Dubai
  'DOH': { lat: 25.2731, lng: 51.6081 }, // Doha
  'BKK': { lat: 13.6900, lng: 100.7501 },// Bangkok
  'JFK': { lat: 40.6413, lng: -73.7781 },// New York
  'EWR': { lat: 40.6895, lng: -74.1745 },// Newark
  'ORD': { lat: 41.9742, lng: -87.9073 },// Chicago
  'LAX': { lat: 33.9416, lng: -118.4085 },// Los Angeles
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
    originIata: rawFlight.flightLegIdentifier?.departureAirportIata,
    destinationIata: rawFlight.flightLegIdentifier?.arrivalAirportIata,
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
