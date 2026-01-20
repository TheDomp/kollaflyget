
const start = '2026-01-13';
const end = '2026-01-20';

const dates = [];
let current = new Date(start);
const endDate = new Date(end);

let count = 0;
while (current <= endDate && count < 7) {
    dates.push(new Date(current).toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
    count++;
}

console.log('Dates generated:', dates);

// Simulate metadata attachment
const flights = [];
// Simulate flights found for the last date only
const lastDate = dates[dates.length - 1];

const missingDates = [];
dates.forEach(d => {
    if (d === lastDate) {
        // found data
        flights.push({ id: 1 });
    } else {
        missingDates.push(d);
    }
});

const statsMetadata = {
    totalDates: dates.length,
    datesWithData: 1,
    missingDates: missingDates
};

flights._metadata = statsMetadata;

console.log('Flights length:', flights.length);
console.log('Metadata attached:', flights._metadata);
console.log('Missing dates:', flights._metadata.missingDates);
