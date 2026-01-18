
import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Custom dot icon for clean look
const dotIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzEwYjk4MSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiAvPjwvc3ZnPg==',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
    className: 'custom-marker-icon'
});

const originIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNiODJmNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz48L3N2Zz4=',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
    className: 'origin-marker-icon'
});

// Component to handle map view bounds
const MapController = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

// Main FlightMap Component
const FlightMap = ({ origin, originIata, destinations }) => {

    // Convert destinations object to array of routes
    const routes = useMemo(() => {
        if (!origin) return [];
        return destinations.map(dest => ({
            iata: dest.iata,
            lat: dest.lat,
            lng: dest.lng,
            count: dest.count,
            color: dest.popularity > 0.7 ? '#10b981' : dest.popularity > 0.3 ? '#3b82f6' : '#94a3b8'
        }));
    }, [origin, destinations]);

    // Calculate bounds to fit all points
    const bounds = useMemo(() => {
        if (!origin) return null;
        if (routes.length === 0) return [[origin.lat, origin.lng], [origin.lat, origin.lng]];

        const lats = [origin.lat, ...routes.map(r => r.lat)];
        const lngs = [origin.lng, ...routes.map(r => r.lng)];

        return [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        ];
    }, [origin, routes]);

    if (!origin) return null;

    return (
        <div className="route-map-container" style={{ height: 450, width: '100%', borderRadius: 12, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
            <MapContainer
                center={[origin.lat, origin.lng]}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                {/* Dark Theme Tiles (CartoDB Dark Matter) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapController bounds={bounds} />

                {/* Origin Marker */}
                <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
                    <Popup>
                        <strong>{originIata}</strong><br />
                        Navet i din sökning
                    </Popup>
                </Marker>

                {/* Routes and Destinations */}
                {routes.map((route, idx) => (
                    <React.Fragment key={idx}>
                        <Polyline
                            positions={[
                                [origin.lat, origin.lng],
                                [route.lat, route.lng]
                            ]}
                            pathOptions={{
                                color: route.color,
                                weight: 1.5,
                                opacity: 0.6,
                                dashArray: '5, 10' // Dashed lines for flight feel
                            }}
                        />
                        <Marker position={[route.lat, route.lng]} icon={dotIcon}>
                            <Popup>
                                <strong>{route.iata}</strong><br />
                                {route.count} flyg
                            </Popup>
                        </Marker>
                    </React.Fragment>
                ))}
            </MapContainer>
        </div>
    );
};

export default FlightMap;
