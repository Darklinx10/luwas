'use client';

import { useMap } from 'react-leaflet';
import dynamic from 'next/dynamic';

const HazardLayers = dynamic(
  () => import('@/components/hazards/hazardLayers'),
  { ssr: false }
);

export default function MapWithHazards({ activeHazard, setLoading }) {
  const map = useMap();
  return <HazardLayers activeHazard={activeHazard} map={map} setLoading={setLoading} />;
}
