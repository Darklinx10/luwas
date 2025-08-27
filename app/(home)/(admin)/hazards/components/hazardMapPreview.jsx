'use client';

import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { normalizeSusceptibility } from '../../../../../components/susceptibility';
import { fetchHazardFromFirebase } from './utils/fetchHazards';
import dynamic from 'next/dynamic';

const L = typeof window !== 'undefined' ? require('leaflet') : null;
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}
const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then(mod => mod.GeoJSON),
  { ssr: false }
);

export default function HazardMapPreview({
  hazardType,
  geojson,
  center = [9.9611, 124.0247],
  zoom = 12
}) {
  const mapRef = useRef(null);
  const [hazardGeoJSON, setHazardGeoJSON] = useState(geojson || null);
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState(null);

  // Fetch hazard data if hazardType is provided
  useEffect(() => {
    if (!hazardType) return;
    const fetchData = async () => {
      const data = await fetchHazardFromFirebase(hazardType);
      if (data) setHazardGeoJSON(data);
    };
    fetchData();
  }, [hazardType]);

  // Fetch boundary from Firestore
  useEffect(() => {
    const fetchBoundary = async () => {
      try {
        const docRef = doc(db, 'settings', 'boundaryFile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const geojsonString = docSnap.data().data;
          setBoundaryGeoJSON(JSON.parse(geojsonString));
        }
      } catch (err) {
        console.error('Failed to fetch GeoJSON from Firestore:', err);
      }
    };
    fetchBoundary();
  }, []);

  // Fit map to hazard + boundary layers
  useEffect(() => {
    if (!mapRef.current || !L) return;

    let bounds = null;
    if (hazardGeoJSON) bounds = L.geoJSON(hazardGeoJSON).getBounds();
    if (boundaryGeoJSON) {
      const boundaryBounds = L.geoJSON(boundaryGeoJSON).getBounds();
      bounds = bounds ? bounds.extend(boundaryBounds) : boundaryBounds;
    }
    if (bounds && bounds.isValid()) mapRef.current.fitBounds(bounds);
  }, [hazardGeoJSON, boundaryGeoJSON]);

  const styleBySusceptibility = (value) => {
    let fillColor = '#ccc', fillOpacity = 0.7;
    switch (value) {
      case 'High Susceptibility':
      case 'Highly Susceptible': fillColor = '#ef4444'; break;
      case 'Moderate Susceptibility':
      case 'Moderately Susceptible': fillColor = '#7e22ce'; break;
      case 'Low Susceptibility':
      case 'Least Susceptible': fillColor = '#facc15'; break;
      case 'Generally Susceptible': fillColor = '#fb923c'; break;
    }
    return { color: '#555', weight: 0.5, fillOpacity, fillColor };
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {hazardGeoJSON && (
        <GeoJSON
          data={hazardGeoJSON}
          style={(feature) =>
            styleBySusceptibility(
              normalizeSusceptibility(
                feature.properties?.Susciptibi ??
                feature.properties?.Susceptibility ??
                feature.properties?.Risk ??
                feature.properties?.HazardLevel
              )
            )
          }
        />
      )}

      {boundaryGeoJSON && (
        <GeoJSON
          data={boundaryGeoJSON}
          style={{
            color: 'black',
            weight: 1,
            fillOpacity: 0,
            dashArray: '2 4',
          }}
        />
      )}
    </MapContainer>
  );
}
