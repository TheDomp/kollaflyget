export const AIRPORTS = [
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
];

const isProd = !window.location.hostname.includes('localhost');
const BASE_URL = 'https://api.swedavia.se';

// API Keys from User Profile
const API_KEYS = {
  FLIGHT: '1ae1384d87da43779929eed906133834',
  WAIT: '08db80ea420a4b0097eb73ab83059f18',
  AIRPORT: '34daabcfe6094b8482dd9fc639f5ff61'
};

const fetchWithProxy = async (path) => {
  const url = `${BASE_URL}${path}`;

  // Determine correct key based on endpoint
  let apiKey = '';
  if (path.includes('/flightinfo/')) apiKey = API_KEYS.FLIGHT;
  else if (path.includes('/waittime')) apiKey = API_KEYS.WAIT;
  else if (path.includes('/airportinfo/')) apiKey = API_KEYS.AIRPORT;

  const headers = {
    'Accept': 'application/json',
    ...(apiKey ? { 'Ocp-Apim-Subscription-Key': apiKey } : {})
  };

  if (isProd) {
    // Pro-proxy via corsproxy.io
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { headers });
    if (response.status === 401) throw new Error('API-nyckel saknas eller är felaktig (401).');
    if (!response.ok) throw new Error('CORS Proxy failure');
    return await response.json();
  } else {
    // Lokal dev använder Vite-proxy
    // Vi lägger bara till prefixet /swedavia-api så hanterar vite.config.js rewrite
    const localPath = `/swedavia-api${path}`;

    const response = await fetch(localPath, { headers });
    if (!response.ok) throw new Error(`Network response failure: ${response.status}`);
    return await response.json();
  }
};

export const swedaviaService = {
  getAirports: () => AIRPORTS,

  getFlights: async (airportIata, type = 'arrivals') => {
    const today = new Date().toISOString().split('T')[0];
    const path = `/flightinfo/v2/${airportIata}/${type}/${today}`;
    try {
      const jsonData = await fetchWithProxy(path);
      return (jsonData.flights || []).map(f => ({
        id: f.flightId,
        airline: f.airlineOperator.name,
        destination: type === 'arrivals' ? f.departureAirportSwedish : f.arrivalAirportSwedish,
        time: type === 'arrivals' ? f.arrivalTime.scheduledUtc.split('T')[1].substring(0, 5) : f.departureTime.scheduledUtc.split('T')[1].substring(0, 5),
        status: f.locationAndStatus.flightLegStatusSwedish || 'On Time',
        gate: f.locationAndStatus.gate || '-',
        type: type === 'arrivals' ? 'Arrival' : 'Departure',
        terminal: f.locationAndStatus.terminal
      }));
    } catch (error) {
      console.error('Error fetching flights:', error);
      throw error;
    }
  },

  getWaitTime: async (airportIata) => {
    const path = `/waittimepublic/v2/airports/${airportIata}`;
    try {
      const data = await fetchWithProxy(path);
      if (data && data.length > 0) {
        return Math.max(...data.map(cp => cp.waitTimeSec / 60)).toFixed(0);
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  getRestaurants: (iata) => fetchWithProxy(`/airportinfo/v2/${iata}/restaurants?langcode=sv`),
  getShops: (iata) => fetchWithProxy(`/airportinfo/v2/${iata}/shops?langcode=sv`),
  getServices: (iata) => fetchWithProxy(`/airportinfo/v2/${iata}/services?langcode=sv`),
  getDestinations: (iata) => fetchWithProxy(`/airportinfo/v2/${iata}/destinations`),

  getWeather: async (location) => {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Snow'];
    const temps = [12, 18, 5, 22, -2, 15];
    return {
      temp: temps[Math.floor(Math.random() * temps.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)]
    };
  },

  getFavorites: () => {
    const favs = localStorage.getItem('kollaflyget_favs');
    return favs ? JSON.parse(favs) : [];
  },

  toggleFavorite: (flightId) => {
    const favs = swedaviaService.getFavorites();
    const index = favs.indexOf(flightId);
    if (index > -1) {
      favs.splice(index, 1);
    } else {
      favs.push(flightId);
    }
    localStorage.setItem('kollaflyget_favs', JSON.stringify(favs));
    return favs;
  },

  searchFlight: async (flightId, date) => {
    const flights = await swedaviaService.getFlights('ARN', 'arrivals');
    return flights.filter(f => f.id.toLowerCase().includes(flightId.toLowerCase()));
  }
};
