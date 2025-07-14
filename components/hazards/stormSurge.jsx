//components/stormSurge.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import axios from 'axios';

const ActiveFaultLine = () => {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    const fetchGeoJson = async () => {
      try {
        const response = await axios.get('/data/stormSurge.geojson');
        setGeoData(response.data);
      } catch (error) {
        console.error('Error loading active fault line GeoJSON:', error);
      }
    };

    fetchGeoJson();
  }, []);

  const stormSurgeStyle = {
  color: 'transparent',      // No border color
  fillColor: 'transparent',  // No fill color
  fillOpacity: 0,            // Fully transparent fill
};


  // Function to attach popups to each feature
  const onEachFeature = (feature, layer) => {
    const name = feature.properties?.name || '🌊 Storm Surge Zone';
    layer.bindPopup(name);
  };

  return geoData ? (
    <GeoJSON data={geoData} style={stormSurgeStyle} onEachFeature={onEachFeature} />
  ) : null;
};

export default ActiveFaultLine;
