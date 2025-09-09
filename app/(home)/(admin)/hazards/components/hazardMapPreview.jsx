'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from '@/context/mapContext';

const L = typeof window !== 'undefined' ? require('leaflet') : null;
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });

// --- Use the same getColorScale as in AddHazardModal ---
function getColorScale(geojson, legendProp, colorSettings) {
  if (!legendProp) return () => '#3388ff';
  const values = geojson.features
    .map((f) => f.properties[legendProp.key])
    .filter((v) => v !== undefined && v !== null);

  if (legendProp.type === 'numeric') {
    if (values.length === 0) return () => '#3388ff';
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return () => colorSettings.min || '#00ff00';

    const start = colorSettings.min || '#00ff00';
    const end = colorSettings.max || '#ff0000';

    return (value) => {
      if (value === undefined || value === null) return '#3388ff';
      const ratio = (value - min) / (max - min);

      const hexToRgb = (hex) => {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
      };

      const [r1, g1, b1] = hexToRgb(start);
      const [r2, g2, b2] = hexToRgb(end);

      const r = Math.round(r1 + ratio * (r2 - r1));
      const g = Math.round(g1 + ratio * (g2 - g1));
      const b = Math.round(b1 + ratio * (b2 - b1));

      return `rgb(${r},${g},${b})`;
    };
  } else {
    return (value) => colorSettings[value] || '#3388ff';
  }
}

export default function HazardMapPreview({
  geojson,
  legendProp,
  colorSettings,
  zoom = 12,
}) {
  const mapRef = useRef(null);
  const { boundaryGeoJSON, defaultCenter } = useMap();

  useEffect(() => {
    if (!mapRef.current || !geojson) return;
    try {
      const bounds = L.geoJSON(geojson).getBounds();
      if (bounds.isValid()) mapRef.current.fitBounds(bounds);
    } catch (err) {
      // ignore
    }
  }, [geojson]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      whenCreated={map => { mapRef.current = map; }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
      {geojson && (
        <GeoJSON
          data={geojson}
          style={(feature) => ({
            fillColor: legendProp
              ? getColorScale(geojson, legendProp, colorSettings)(
                  feature.properties[legendProp.key]
                )
              : '#3388ff',
            weight: 2,
            opacity: 1,
            color: 'transparent',
            fillOpacity: 0.7,
          })}
        />
      )}
    </MapContainer>
  );
}