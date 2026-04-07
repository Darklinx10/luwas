'use client';

import { useEffect, useRef, useState } from 'react';
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
import { FiMapPin, FiX } from 'react-icons/fi';
import { useMap } from '@/context/mapContext';

const { BaseLayer } = LayersControl;

const defaultIcon = L.icon({
  iconUrl: '/leaflet-icons/marker-icon.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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

export default function MapPopup({
  isOpen,
  onClose,
  onSave,
  location = null,
  readOnly = false,
  mode = 'household',
}) {
  const { boundaryGeoJSON: contextBoundary } = useMap();
  const defaultLocation = { lat: 9.9611, lng: 124.0247 };

  const [position, setPosition] = useState(location || defaultLocation);
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState(contextBoundary || null);

  const mapRef = useRef(null);

  useEffect(() => {
    if (location) setPosition(location);
  }, [location]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchBoundary = async () => {
      if (contextBoundary) {
        setBoundaryGeoJSON(contextBoundary);
        return;
      }

      try {
        const response = await fetch('/api/maps/boundary');
        if (response.ok) {
          const data = await response.json();
          if (data.geojson) {
            setBoundaryGeoJSON(data.geojson);
          }
        }
      } catch (error) {
        console.warn('Could not load boundary:', error);
      }
    };

    fetchBoundary();
  }, [isOpen, contextBoundary]);

  if (!isOpen) return null;

  const label = mode === 'accident' ? 'Accident Location' : 'Household Location';
  const title = readOnly ? label : `Set ${label}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close modal"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <FiMapPin className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {readOnly
                  ? 'Viewing saved coordinates on the map.'
                  : 'Click on the map to pin the exact location.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 h-[420px] overflow-hidden rounded-2xl border border-slate-200">
            <MapContainer
              center={position}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            >
              <LayersControl position="topright">
                <BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
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

              {!readOnly && (
                <LocationMarker setPosition={setPosition} readOnly={readOnly} />
              )}
            </MapContainer>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Lat: <span className="font-medium text-slate-800">{position.lat.toFixed(6)}</span>
              {'  '}|{'  '}
              Lng: <span className="font-medium text-slate-800">{position.lng.toFixed(6)}</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {readOnly ? 'Close' : 'Cancel'}
              </button>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onSave(position)}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Save Location
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}