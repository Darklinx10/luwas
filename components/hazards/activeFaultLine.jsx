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
        const response = await axios.get('/data/activeFaultLine.geojson');
        setGeoData(response.data);
      } catch (error) {
        console.error('Error loading active fault line GeoJSON:', error);
      }
    };

    fetchGeoJson();
  }, []);

  const faultLineStyle = {
    color: 'red',
    weight: 2,
    dashArray: '10 6',      // dashed line: 4px dash, 6px space
  };

  // Function to attach popups to each feature
  const onEachFeature = (feature, layer) => {
    const name = feature.properties?.name || '⛰️ Active Fault';
    layer.bindPopup(name);
  };

  return geoData ? (
    <GeoJSON data={geoData} style={faultLineStyle} onEachFeature={onEachFeature} />
  ) : null;
};

export default ActiveFaultLine;
