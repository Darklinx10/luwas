'use client';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ImageOverlayComponent = () => {
  const map = useMap();

  useEffect(() => {
    const imageUrl = '/flood.png'; // This should be in /public/storm.png
    const imageBounds = [
  [9.922, 123.963], // SW moved ~0.010 degrees south
  [9.9833, 124.122], // NE moved ~0.010 degrees south
];





    const overlay = L.imageOverlay(imageUrl, imageBounds).addTo(map);

    return () => {
      map.removeLayer(overlay); // Clean up when component unmounts
    };
  }, [map]);

  return null; // This component doesn't render JSX
};

export default ImageOverlayComponent;
