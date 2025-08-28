// components/BoundaryLayer.jsx
import React from 'react';
import { GeoJSON } from 'react-leaflet';

const BoundaryLayer = ({ boundaryGeoJSON }) => {
  if (!boundaryGeoJSON) return null;

  return (
    <GeoJSON
      key={JSON.stringify(boundaryGeoJSON)}
      data={boundaryGeoJSON}
      style={{
        color: 'black',
        weight: 1,
        fillOpacity: 0,
        dashArray: '2 4',
      }}
      onEachFeature={(feature, layer) => {
        if (feature.properties?.name) {
          layer.bindPopup(feature.properties.name);
        }
      }}
    />
  );
};

export default BoundaryLayer;
