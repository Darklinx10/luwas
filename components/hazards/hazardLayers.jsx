'use client';

import { useEffect, useRef } from "react";
import { fetchHazardFromFirebase } from "./utils/fetchHazards";
import { normalizeSusceptibility } from "./utils/susceptibility";


export default function HazardLayers({ activeHazard, map, setLoading }) {
  const infoDivRef = useRef(null);
  const geoJsonLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !activeHazard) return;

    // Initialize info control
    const info = L.control({ position: 'bottomright' });
    info.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-control');
      container.innerHTML = `
        <div id="info-content" class="w-[320px] sm:w-[400px] max-h-[40vh] overflow-y-auto p-4 bg-white rounded-lg shadow-lg text-sm border border-gray-200">
          <h4 class="font-semibold text-lg mb-2">Hazard Map Info</h4>
          <p>Select hazard layers using the dropdown.</p>
          <p>Zoom and pan to explore Bohol.</p>
        </div>`;
      infoDivRef.current = container;
      return container;
    };
    info.addTo(map);

    const updateInfo = (title, description) => {
      const content = infoDivRef.current?.querySelector('#info-content');
      if (content) {
        content.innerHTML = `<h4 class="font-semibold text-lg mb-2">${title}</h4>${description}`;
      }
    };

    // Styles
    const styleBySusceptibility = (value) => {
      let fillColor = '#ccc', fillOpacity = 0.7;
      switch (value) {
        case 'High Susceptibility':
        case 'Highly Susceptible': fillColor = '#ef4444'; break;
        case 'Moderate Susceptibility':
        case 'Moderately Susceptible': fillColor = '#7e22ce'; break;
        case 'Low Susceptibility':
        case 'Least Susceptible': fillColor = '#facc15'; break;
        case 'Generally Susceptible': fillColor = '#fb923c'; break;
      }
      return { color: '#555', weight: 0.5, fillOpacity, fillColor };
    };
    const activeFaultStyle = (feature) => {
      const value = feature.properties?.Risk || feature.properties?.Susceptibility || 'Unknown';
      let color = '#ccc', dashArray = '5,5';
      switch (value.toLowerCase()) {
        case 'high': color = '#b91c1c'; break;
        case 'moderate': color = '#f97316'; break;
        case 'low': color = '#facc15'; break;
      }
      return { color, weight: 3, opacity: 1, dashArray };
    };
    const stormSurgeStyle = (feature) => {
      const value = feature.properties?.Inundation;
      let fillColor = '#0ea5e9', fillOpacity = 0.6;
      switch (value) {
        case '>1m. to 4m. surges':
        case 'Greater than 4.0m': fillColor = '#ef4444'; break;
        case '>1m. to 4m.':
        case '1.0m to 4.0m': fillColor = '#f97316'; break;
        case 'Up to 1.0m':
        case '<=1m': fillColor = '#fde68a'; break;
      }
      return { color: '#555', weight: 0.5, fillOpacity, fillColor };
    };
    const tsunamiStyle = () => ({ color: '#ea580c', weight: 1, fillOpacity: 0.7, fillColor: '#ea580c' });

    // Create and load GeoJSON layer from Firebase
    const createGeoJsonLayer = async ({ hazardType, popupLabel, styleFn, infoText }) => {
      const layer = L.geoJSON(null, {
        onEachFeature: (feature, layer) => {
          const rawLabel =
            feature.properties?.Susciptibi ??
            feature.properties?.Susceptibility ??
            feature.properties?.HazardLevel ??
            feature.properties?.Inundation ??
            feature.properties?.Risk;
          const label = normalizeSusceptibility(rawLabel);
          layer.bindPopup(`<strong>${popupLabel}:</strong> ${label}`);
        },
        style: styleFn
      });

      setLoading(true);
      const data = await fetchHazardFromFirebase(hazardType);
      if (data) {
        if (geoJsonLayerRef.current) {
          map.removeLayer(geoJsonLayerRef.current);
          geoJsonLayerRef.current = null;
        }
        layer.clearLayers();
        layer.addData(data);
        layer.addTo(map);
        geoJsonLayerRef.current = layer;
        updateInfo(popupLabel, `<p class="mb-2">${infoText}</p>`);
        if (typeof window !== 'undefined' && window.setHazardGeoJSON) window.setHazardGeoJSON(data);
      }
      setLoading(false);
      return layer;
    };

    // Hazard mapping
    const geoJsonLayers = {
      'Liquefaction': () => createGeoJsonLayer({
        hazardType: 'Liquefaction',
        popupLabel: 'Liquefaction Susceptibility',
        styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Susciptibi)),
        infoText: `
                      <p class="mb-2">Areas with potential for ground failure due to soil liquefaction during strong earthquakes.</p>
                      <p class="font-medium mb-1">Legend:</p>
                      <ul class="space-y-1">
                        <li class="flex items-center gap-2"><span class="w-4 h-4 bg-red-600 inline-block border"></span>Highly Susceptible</li>
                        <li class="flex items-center gap-2"><span class="w-4 h-4 bg-purple-600 inline-block border"></span>Moderately Susceptible</li>
                        <li class="flex items-center gap-2"><span class="w-4 h-4 bg-yellow-400 inline-block border"></span>Least Susceptible</li>
                        <li class="flex items-center gap-2"><span class="w-4 h-4 bg-orange-400 inline-block border"></span>Generally Susceptible</li>
                      </ul>
                    `,
        map, setLoading, updateInfo, geoJsonLayerRef
      }),
      'Earthquake Induced Landslide': () => createGeoJsonLayer({
        hazardType: 'Earthquake Induced Landslide',
        popupLabel: 'Earthquake-Induced Landslide Susceptibility',
        styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Susciptibi)),
        infoText: `
                      <p class="mb-2">Areas susceptible to landslides triggered by earthquake ground shaking.</p>
                      <p class="font-medium mb-1">Legend:</p>
                      <ul class="space-y-1">
                        <li class="flex items-center gap-2"><span class="w-4 h-4 bg-red-600 inline-block border"></span>Highly Susceptible</li>
                        <li class="flex items-center gap-2"><span class="w-4 h-4 bg-purple-600 inline-block border"></span>Moderately Susceptible</li>
                        <li class="flex items-center gap-2"><span class="w-4 h-4 bg-yellow-400 inline-block border"></span>Least Susceptible</li>
                        <li class="flex items-center gap-2"><span class="w-4 h-4 bg-orange-400 inline-block border"></span>Generally Susceptible</li>
                      </ul>
                  `,
                  map, setLoading, updateInfo, geoJsonLayerRef
        
      }),
      'Rain Induced Landslide': () => createGeoJsonLayer({
        hazardType: 'Rain Induced Landslide',
        popupLabel: 'Rain-Induced Landslide Susceptibility',
        styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Susciptibi)),
        infoText: `
                    <p class="mb-2">Areas susceptible to landslides triggered by heavy or continuous rainfall.</p>
                    <p class="font-medium mb-1">Legend:</p>
                    <ul class="space-y-1">
                      <li class="flex items-center gap-2"><span class="w-4 h-4 bg-red-600 inline-block border"></span>Highly Susceptible</li>
                      <li class="flex items-center gap-2"><span class="w-4 h-4 bg-purple-600 inline-block border"></span>Moderately Susceptible</li>
                      <li class="flex items-center gap-2"><span class="w-4 h-4 bg-yellow-400 inline-block border"></span>Least Susceptible</li>
                      <li class="flex items-center gap-2"><span class="w-4 h-4 bg-orange-400 inline-block border"></span>Generally Susceptible</li>
                    </ul>
                  `,
                  map, setLoading, updateInfo, geoJsonLayerRef
      }),
      'Tsunami': () => createGeoJsonLayer({
        hazardType: 'Tsunami',
        popupLabel: 'Tsunami Hazard Susceptibility',
        styleFn: tsunamiStyle,
        infoText: `
                    <p class="mb-2">Tsunami-prone zones based on historical and model data.</p>
                    <p class="font-medium mb-1">Legend:</p>
                    <ul class="space-y-1">
                      <li class="flex items-center gap-2">
                        <span class="w-4 h-4 bg-orange-500 inline-block border"></span>Tsunami Inundation Area
                      </li>
                    </ul>
                  `,
                  map, setLoading, updateInfo, geoJsonLayerRef
        
      }),
      'Landslide': () => createGeoJsonLayer({
        hazardType: 'Landslide',
        popupLabel: 'Landslide Risk Zones',
        styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Risk)),
        infoText:  `
                    <p class="mb-2">Mapped areas with varying levels of landslide risk based on terrain, soil composition, rainfall, and human activities.</p>
                    <p class="mb-2">These zones indicate where landslides are most likely to occur and may result in property damage, injury, or loss of life, especially during heavy rain or earthquakes.</p>
                    <p class="font-medium mb-1">Risk Levels:</p>
                    <ul class="space-y-1">
                      <li class="flex items-center gap-2">
                        <span class="w-4 h-4 bg-red-700 inline-block border"></span> High Risk
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="w-4 h-4 bg-purple-700 inline-block border"></span> Moderate Risk
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="w-4 h-4 bg-yellow-500 inline-block border"></span> Low Risk
                      </li
                    </ul>
                  `,
                  map, setLoading, updateInfo, geoJsonLayerRef
        
      }),
      'Storm Surge': () => createGeoJsonLayer({
        hazardType: 'Storm Surge',
        popupLabel: 'Storm Surge Inundation',
        styleFn: stormSurgeStyle,
        infoText: `
                      <p class="mb-2">Projected inundation areas due to storm surges during typhoons or extreme weather events.</p>
                      <p class="font-medium mb-1">Legend:</p>
                      <ul class="space-y-1">
                        <li class="flex items-center gap-2">
                          <span class="w-4 h-4 bg-red-500 inline-block border"></span> Greater than 4.0m
                        </li>
                        <li class="flex items-center gap-2">
                          <span class="w-4 h-4 bg-orange-500 inline-block border"></span> 1.0m to 4.0m
                        </li>
                        <li class="flex items-center gap-2">
                          <span class="w-4 h-4 bg-yellow-300 inline-block border"></span> Up to 1.0m
                        </li>
                      </ul>
                    `,
                    map, setLoading, updateInfo, geoJsonLayerRef
        
      }),
      'Active Faults': () => createGeoJsonLayer({
        hazardType: 'Active Faults',
        popupLabel: 'Active Fault Line',
        styleFn: activeFaultStyle,
        infoText:  `
              <p class="mb-2">This layer shows active fault lines categorized by their associated risk levels. These areas may pose varying degrees of danger during seismic activity, particularly due to potential ground rupture.</p>
              <p class="font-medium mb-1">Risk Legend:</p>
              <ul class="space-y-1">
                <li class="flex items-center gap-2">
                  <span class="w-4 h-1.5 bg-[#b91c1c] inline-block border"></span> High Risk
                </li>
                <li class="flex items-center gap-2">
                  <span class="w-4 h-1.5 bg-[#f97316] inline-block border"></span> Moderate Risk
                </li>
                <li class="flex items-center gap-2">
                  <span class="w-4 h-1.5 bg-[#facc15] inline-block border"></span> Low Risk
                </li>
                <li class="flex items-center gap-2">
                  <span class="w-4 h-1.5 bg-[#ccc] inline-block border border-dashed"></span> Unclassified / Default
                </li>
              </ul>
            `,
            map, setLoading, updateInfo, geoJsonLayerRef
      })
    };
    
    // Remove previous GeoJSON layer
  if (geoJsonLayerRef.current) {
    map.removeLayer(geoJsonLayerRef.current);
    geoJsonLayerRef.current = null;
  }

  // Add new hazard layer
  if (geoJsonLayers[activeHazard]) geoJsonLayers[activeHazard]();

  // Cleanup on unmount
  return () => {
    map.removeControl(info);
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }
  };
}, [map, activeHazard, setLoading]);
  return null;
}
