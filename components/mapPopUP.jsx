'use client';

import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  LayersControl,
  GeoJSON,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { BaseLayer } = LayersControl;

// Set up default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Marker component to update position on map click
function LocationMarker({ setPosition, readOnly }) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition(e.latlng); // Update position state when map is clicked
      }
    },
  });
  return null;
}

// Main component for map modal
export default function MapPopup({
  isOpen,       // Whether modal is open
  onClose,      // Function to close modal
  onSave,       // Function to save selected location
  location = null, // Initial location (if editing)
  readOnly = false, // Flag for view-only mode
  mode = 'household', // Used for labeling
}) {
  const defaultLocation = { lat: 9.9611, lng: 124.0247 }; // Default location fallback
  const [position, setPosition] = useState(location || defaultLocation);
  const [hazardGeoJSON, setHazardGeoJSON] = useState(null); // Store hazard geojson data

  // Update marker position if location prop changes
  useEffect(() => {
    if (location) {
      setPosition(location);
    }
  }, [location]);

  // Load hazard map GeoJSON from public folder
  useEffect(() => {
    fetch('/data/map.geojson')
      .then((res) => res.json())
      .then((data) => setHazardGeoJSON(data))
      .catch((err) => console.error('Error loading GeoJSON:', err));
  }, []);

  if (!isOpen) return null; // Do not render if modal is closed

  const label = mode === 'accident' ? 'Accident Location' : 'Household Location';
  const title = readOnly ? label : `Set ${label}`;

  return (
    <div className="fixed inset-0 bg-opacity-40 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded-lg w-[90%] max-w-2xl shadow-lg p-4 relative">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>

        <div className="h-[400px] mb-4">
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
            <LayersControl position="topright">
              {/* Base layer: OpenStreetMap */}
              <BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
              </BaseLayer>

              {/* Base layer: Esri Satellite */}
              <BaseLayer name="Satellite (Esri)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                />
              </BaseLayer>
            </LayersControl>

            {/* Hazard boundaries overlay */}
            {hazardGeoJSON && (
              <GeoJSON
                data={hazardGeoJSON}
                style={{
                  color: 'black',        
                  weight: 1,             
                  fillOpacity: 0,
                  dashArray: '2 4',        
                }}
              />
            )}

            {/* Marker shows current position */}
            <Marker position={position}>
              {readOnly && <Popup>{label}</Popup>}
            </Marker>

            {/* Enable click-to-set if not readOnly */}
            <LocationMarker setPosition={setPosition} readOnly={readOnly} />
          </MapContainer>
        </div>

        {/* Display coordinates and action buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                onClick={() => onSave(position)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Location
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
