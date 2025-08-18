'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRef, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function HazardMapPreview({ geojson, center = [9.9611, 124.0247], zoom = 12 }) {
  const mapRef = useRef(null);
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState(null);

  // Fetch boundary from Firestore
  useEffect(() => {
    const fetchBoundary = async () => {
      try {
        const docRef = doc(db, 'settings', 'boundaryFile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const geojsonString = docSnap.data().data;
          const data = JSON.parse(geojsonString);
          setBoundaryGeoJSON(data);
        }
      } catch (err) {
        console.error('Failed to fetch GeoJSON from Firestore:', err);
      }
    };
    fetchBoundary();
  }, []);

  // Fit map to both hazard and boundary layers
  useEffect(() => {
    if (!mapRef.current) return;

    let bounds = null;

    if (geojson) {
      const layer = L.geoJSON(geojson);
      bounds = layer.getBounds();
    }

    if (boundaryGeoJSON) {
      const layer = L.geoJSON(boundaryGeoJSON);
      const boundaryBounds = layer.getBounds();
      bounds = bounds ? bounds.extend(boundaryBounds) : boundaryBounds;
    }

    if (bounds && bounds.isValid()) {
      mapRef.current.fitBounds(bounds);
    }
  }, [geojson, boundaryGeoJSON]);

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

      {geojson && <GeoJSON data={geojson} />}
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
