'use client';

import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';

const HazardLayers = dynamic(
  () => import('@/components/hazardLayers'),
  { ssr: false }
);

export default function MapWithHazards({ activeHazard, setLoading }) {
  const map = useMap();
  return <HazardLayers activeHazard={activeHazard} map={map} setLoading={setLoading} />;
}
