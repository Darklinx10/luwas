'use client';

import { useEffect, useState, useRef } from 'react';
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
import { useMap } from '@/context/mapContext'; // optional, for shared boundary/defaultCenter

const { BaseLayer } = LayersControl;

// ✅ Create local marker icon (SVG-based, no CDN needed)
const defaultIcon = L.icon({
  iconUrl: '/leaflet-icons/marker-icon.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Marker component to handle map clicks
function LocationMarker({ setPosition, readOnly }) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition(e.latlng);
      }
    },
  });
  return null;
}

// Main MapPopup component
export default function MapPopup({
  isOpen,
  onClose,
  onSave,
  location = null,
  readOnly = false,
  mode = 'household',
}) {
  const { boundaryGeoJSON: contextBoundary } = useMap(); // optional
  const defaultLocation = { lat: 9.9611, lng: 124.0247 };
  const [position, setPosition] = useState(location || defaultLocation);
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState(contextBoundary || null);
  const mapRef = useRef(null);

  // Update marker if `location` prop changes
  useEffect(() => {
    if (location) setPosition(location);
  }, [location]);

  // ✅ Fetch boundary from API endpoint when modal opens (if not in context)
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchBoundary = async () => {
      // Use context boundary if available
      if (contextBoundary) {
        setBoundaryGeoJSON(contextBoundary);
        return;
      }

      // Otherwise fetch from API endpoint (handles Firestore permissions server-side)
      try {
        const response = await fetch('/api/maps/boundary');
        if (response.ok) {
          const data = await response.json();
          if (data.geojson) {
            setBoundaryGeoJSON(data.geojson);
            console.log('✅ Boundary loaded in map popup:', {features: data.geojson.features?.length || 0});
          }
        } else {
          console.warn('API returned status:', response.status);
        }
      } catch (err) {
        console.warn('Could not load boundary:', err);
      }
    };

    fetchBoundary();
  }, [isOpen, contextBoundary]);


  

  if (!isOpen) return null;

  const label = mode === 'accident' ? 'Accident Location' : 'Household Location';
  const title = readOnly ? label : `Set ${label}`;

  return (
    <div className="fixed inset-0 bg-opacity-40 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded-lg w-[90%] max-w-2xl shadow-lg p-4 relative">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>

        <div className="h-[400px] mb-4">
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
          >
            <LayersControl position="topright">
              <BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
              </BaseLayer>
              <BaseLayer name="Satellite (Esri)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                />
              </BaseLayer>
            </LayersControl>

            {boundaryGeoJSON && (
              <GeoJSON
                data={boundaryGeoJSON}
                style={{
                  color: 'black',
                  weight: 1,
                  fillOpacity: 0,
                  dashArray: '2 4',
                }}
                onEachFeature={(feature, layer) => {
                  if (mapRef.current) {
                    const bounds = layer.getBounds();
                    mapRef.current.fitBounds(bounds);
                  }
                }}
              />
            )}

            <Marker position={position} icon={defaultIcon}>
              {readOnly && <Popup>{label}</Popup>}
            </Marker>

            {!readOnly && <LocationMarker setPosition={setPosition} readOnly={readOnly} />}
          </MapContainer>
        </div>

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
