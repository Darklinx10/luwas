//components/activeFaultLine.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import axios from 'axios';

const ActiveFaultLine = () => {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    const fetchGeoJson = async () => {
      try {
        const response = await axios.get('/data/groundShaking.geojson');
        setGeoData(response.data);
      } catch (error) {
        console.error('Error loading active fault line GeoJSON:', error);
      }
    };

    fetchGeoJson();
  }, []);

  const groundShakingStyle = {
    color: 'red',
    fillColor: 'red',     // Fill color
    fillOpacity: 0.2,     // Fill transparency (0 = transparent, 1 = solid)
    
  };

  // Function to attach popups to each feature
  const onEachFeature = (feature, layer) => {
    const name = feature.properties?.name || '💥 Ground Shaking Zone';
    layer.bindPopup(name);
  };

  return geoData ? (
    <GeoJSON data={geoData} style={groundShakingStyle} onEachFeature={onEachFeature} />
  ) : null;
};

export default ActiveFaultLine;
