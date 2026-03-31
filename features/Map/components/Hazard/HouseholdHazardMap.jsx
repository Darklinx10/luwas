'use client';

import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';

const HazardLayers = dynamic(
  () => import('@/components/hazardLayers'),
  { ssr: false }
);

export default function MapWithHazards({ activeHazard, setLoading, setLegendProp, setColorSettings, setHazardGeoJSON }) {
  const map = useMap();

  if (!map) return null;

  return (
    <HazardLayers
      activeHazard={activeHazard}
      map={map}
      setLoading={setLoading}
      setLegendProp={setLegendProp}
      setColorSettings={setColorSettings}
      setHazardGeoJSON={setHazardGeoJSON}
    />
  );
}
