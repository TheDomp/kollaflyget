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

const SWEDAVIA_BASE_URL = '/swedavia-api';

export const swedaviaService = {
  getAirports: () => AIRPORTS,

  getFlights: async (airportIata, type = 'arrivals') => {
    const today = new Date().toISOString().split('T')[0];
    const endpoint = type.toLowerCase() === 'arrivals' ? 'arrivals' : 'departures';

    try {
      const url = `${SWEDAVIA_BASE_URL}/${endpoint}/sv/${airportIata}/${today}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error('Network response was not ok');

      const jsonData = await response.json();

      return (jsonData.flights || []).map(f => ({
        id: f.flightId,
        airline: f.airlineOperator.name,
        destination: endpoint === 'arrivals' ? f.departureAirportSwedish : f.arrivalAirportSwedish,
        time: endpoint === 'arrivals' ? f.arrivalTime.scheduledUtc.split('T')[1].substring(0, 5) : f.departureTime.scheduledUtc.split('T')[1].substring(0, 5),
        status: f.locationAndStatus.flightLegStatusSwedish || 'On Time',
        gate: f.locationAndStatus.gate || '-',
        type: endpoint === 'arrivals' ? 'Arrival' : 'Departure'
      }));
    } catch (error) {
      console.error('Error fetching flights:', error);
      return [];
    }
  },

  searchFlight: async (flightId, date) => {
    // Search is more complex with the public board API (usually involves filtering full lists)
    // For now, we search Arlanda arrivals as a fallback or could iterate airports
    const flights = await swedaviaService.getFlights('ARN', 'arrivals');
    return flights.filter(f => f.id.toLowerCase().includes(flightId.toLowerCase()));
  }
};
