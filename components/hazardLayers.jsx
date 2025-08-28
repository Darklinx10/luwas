'use client';

import { useEffect, useRef } from "react";
import { fetchHazardFromFirebase } from "../utils/fetchHazards";
import { normalizeSusceptibility } from "../utils/susceptibility";
import {
  styleBySusceptibility,
  activeFaultStyle,
  stormSurgeStyle,
  tsunamiStyle,
  groundShakingStyle
} from '@/utils/hazardStyles';


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

    // // ===== STYLES =====
    // const styleBySusceptibility = (value) => {
    //   let fillColor = '#ccc', fillOpacity = 0.7;
    //   switch (value) {
    //     case 'High Susceptibility':
    //     case 'Highly Susceptible': fillColor = '#e31a1c'; break;
    //     case 'Moderate Susceptibility':
    //     case 'Moderately Susceptible': fillColor = '#7e22ce'; break;
    //     case 'Low Susceptibility':
    //     case 'Least Susceptible': fillColor = '#facc15'; break;
    //     case 'Generally Susceptible': fillColor = '#fb923c'; break;
    //   }
    //   return { color: '#555', weight: 0.5, fillOpacity, fillColor };
    // };

    // const activeFaultStyle = (feature) => {
    //   const value = feature.properties?.Risk || feature.properties?.Susceptibility || 'Unknown';
    //   let color = '#ccc', dashArray = '5,5';
    //   switch (value.toLowerCase()) {
    //     case 'high': color = '#b91c1c'; break;
    //     case 'moderate': color = '#f97316'; break;
    //     case 'low': color = '#facc15'; break;
    //   }
    //   return { color, weight: 3, opacity: 1, dashArray };
    // };

    // const stormSurgeStyle = (feature) => {
    //   const value = feature.properties.Inundation || feature.properties.Inundiation || "N/A";
    //   let fillColor = '#0ea5e9', fillOpacity = 0.6;
    //   switch (value) {
    //     case '>1m. to 4m. surges':
    //     case 'Greater than 4.0m': fillColor = '#e31a1c'; break;
    //     case '>1m. to 4m.':
    //     case '1.0m to 4.0m': fillColor = '#f97316'; break;
    //     case 'Up to 1.0m':
    //     case '<=1m': fillColor = '#fde68a'; break;
    //   }
    //   return { color: '#555', weight: 0.5, fillOpacity, fillColor };
    // };

    // const tsunamiStyle = (feature) => {
    //   const desc = feature.properties?.descrption || "";
    //   let fillColor = '#ea580c';
    //   if (desc.includes("Inundation")) fillColor = '#f97316';
    //   return { color: '#ea580c', weight: 1, fillOpacity: 0.7, fillColor };
    // };

    // const groundShakingStyle = (feature) => {
    //   const intensity = feature.properties?.Intensity ?? 0;
    //   let fillColor = '#ccc';
    //   if (intensity >= 9) fillColor = '#b91c1c';
    //   else if (intensity >= 8) fillColor = '#e31a1c';
    //   else if (intensity >= 7) fillColor = '#e3a081ff';
    //   else if (intensity >= 5) fillColor = '#f97316';
    //   else if (intensity >= 3) fillColor = '#facc15';
    //   else if (intensity > 0) fillColor = '#22c55e';
    //   return { color: '#555', weight: 0.5, fillOpacity: 0.7, fillColor };
    // };

    // ===== CREATE LAYER =====
    const createGeoJsonLayer = async ({ hazardType, popupLabel, styleFn, infoText, popupField }) => {
      const layer = L.geoJSON(null, {
        onEachFeature: (feature, layer) => {
          let rawLabel = feature.properties?.[popupField] ?? "N/A";
      
          // ✅ if it's ground shaking, don't normalize
          if (popupLabel.includes("Ground Shaking")) {
            layer.bindPopup(`<strong>${popupLabel}:</strong> ${rawLabel}`);
          } else if (popupLabel.includes("Storm Surge")) {
            // Storm surge category
            layer.bindPopup(`<strong>${popupLabel}:</strong> ${rawLabel}`);
          } else if (popupLabel.includes("Tsunami")) {
            // Tsunami special handling
            const description = feature.properties?.descrption ?? "Unknown";
            const area = feature.properties?.Area
              ? `${feature.properties.Area.toFixed(2)} sq.m`
              : "N/A";
            
            layer.bindPopup(`
              <strong>${popupLabel}</strong><br/>
              ${description}<br/>
              <em>Area:</em> ${area}
            `);
          } else {
            const label = normalizeSusceptibility(rawLabel);
            layer.bindPopup(`<strong>${popupLabel}:</strong> ${label}`);
          }
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
        if (typeof window !== 'undefined' && window.setHazardGeoJSON) {
          window.setHazardGeoJSON(data);
        }
      }
      setLoading(false);
      return layer;
    };

    // ===== HAZARD LAYERS =====
    const geoJsonLayers = {
      'Liquefaction': () => createGeoJsonLayer({
        hazardType: 'Liquefaction',
        popupLabel: 'Liquefaction Susceptibility',
        styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Susciptibi)),
        popupField: 'Susciptibi',
        infoText: `
          <p class="mb-2">Areas with potential ground failure due to soil liquefaction during strong earthquakes. Loose, water-saturated soils are most vulnerable.</p>
          <p class="font-medium mb-1">Legend:</p>
          <ul class="space-y-1">
            <li><span class="w-4 h-4 bg-[#e31a1c] inline-block border"></span> Highly Susceptible</li>
            <li><span class="w-4 h-4 bg-[#6a3d9a] inline-block border"></span> Moderately Susceptible</li>
            <li><span class="w-4 h-4 bg-[#ffed6f] inline-block border"></span> Low Susceptible</li>
            <li><span class="w-4 h-4 bg-[#ff7f00] inline-block border"></span> Generally Susceptible</li>
          </ul>
        `,
      }),
      'Earthquake Induced Landslide': () => createGeoJsonLayer({
        hazardType: 'Earthquake Induced Landslide',
        popupLabel: 'Earthquake-Induced Landslide',
        styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Susciptibi)),
        popupField: 'Susciptibi',
        infoText: `
          <p class="mb-2">Areas susceptible to landslides triggered by ground shaking during strong earthquakes.</p>
          <p class="font-medium mb-1">Legend:</p>
          <ul class="space-y-1">
            <li><span class="w-4 h-4 bg-[#e31a1c] inline-block border"></span> Highly Susceptible</li>
            <li><span class="w-4 h-4 bg-[#6a3d9a] inline-block border"></span> Moderately Susceptible</li>
            <li><span class="w-4 h-4 bg-[#ffed6f] inline-block border"></span> Low Susceptible</li>
            <li><span class="w-4 h-4 bg-[#ff7f00] inline-block border"></span> Generally Susceptible</li>
          </ul>
        `,
      }),

      'Rain Induced Landslide': () => createGeoJsonLayer({
        hazardType: 'Rain Induced Landslide',
        popupLabel: 'Rain-Induced Landslide',
        styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Susciptibi)),
        popupField: 'Susciptibi',
        infoText: `
          <p class="mb-2">Areas susceptible to landslides triggered by prolonged or heavy rainfall.</p>
          <p class="font-medium mb-1">Legend:</p>
          <ul class="space-y-1">
            <li><span class="w-4 h-4 bg-[#e31a1c] inline-block border"></span> Highly Susceptible</li>
            <li><span class="w-4 h-4 bg-[#6a3d9a] inline-block border"></span> Moderately Susceptible</li>
            <li><span class="w-4 h-4 bg-[#ffed6f] inline-block border"></span> Low Susceptible</li>
            <li><span class="w-4 h-4 bg-[#ff7f00] inline-block border"></span> Generally Susceptible</li>
          </ul>
        `,
      }),
      'Tsunami': () => createGeoJsonLayer({
        hazardType: 'Tsunami',
        popupLabel: 'Tsunami Inundation',
        styleFn: tsunamiStyle,
        popupField: 'descrption',
        infoText: `
          <p class="mb-2">Tsunami-prone zones based on historical records and model simulations. Inundation areas represent potential flooding extent.</p>
          <ul class="space-y-1">
            <li><span class="w-4 h-4 bg-[#ff7f00] inline-block border"></span> Tsunami Inundation Area</li>
          </ul>
        `,
      }),
      'Landslide': () => createGeoJsonLayer({
        hazardType: 'Landslide',
        popupLabel: 'Landslide Risk',
        styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Risk)),
        popupField: 'Susciptibi',
        infoText: `
          <p class="mb-2">Mapped zones with varying landslide risk based on terrain, slope, soil type, and rainfall. Higher risk areas are more prone to slope failure and mass movements.</p>
          <p class="font-medium mb-1">Risk Levels:</p>
          <ul class="space-y-1">
            <li><span class="w-4 h-4 bg-[#e31a1c] inline-block border"></span> High</li>
            <li><span class="w-4 h-4 bg-[#6a3d9a] inline-block border"></span> Moderate</li>
            <li><span class="w-4 h-4 bg-[#ffed6f] inline-block border"></span> Low</li>
          </ul>
        `,
      }),
      'Storm Surge': () => createGeoJsonLayer({
        hazardType: 'Storm Surge',
        popupLabel: 'Storm Surge Inundation',
        styleFn: stormSurgeStyle,
        popupField: 'Inundiation',
        infoText: `
          <p class="mb-2">Projected inundation zones during typhoons and extreme storm surge events. Depth estimates show potential floodwater height above mean sea level.</p>
          <p class="font-medium mb-1">Legend:</p>
          <ul class="space-y-1">
            <li><span class="w-4 h-4 bg-[#e31a1c] inline-block border"></span> 1m. to 4m. surges</li>
            <li><span class="w-4 h-4 bg-[#ffed6f] inline-block border"></span> Up to 1m. surges</li>
          </ul>
        `,
      }),
      'Ground Shaking': () => createGeoJsonLayer({
        hazardType: 'Ground Shaking',
        popupLabel: 'Ground Shaking Intensity',
        styleFn: groundShakingStyle,
        popupField: 'Intensity',
        infoText: `
        <p class="mb-2">Expected ground shaking intensity levels during earthquakes, based on the <strong>PHIVOLCS Intensity Scale</strong>. Stronger intensities indicate greater hazard to life and property.</p>
        <p class="font-medium mb-1">Legend (Intensity):</p>
        <ul class="space-y-1">
          <li><span class="w-4 h-4 bg-[#ef4444] inline-block border"></span> Intensity 8 and above</li>
          <li><span class="w-4 h-4 bg-[#e3a081ff] inline-block border"></span> Up to Intensity 7</li>
        </ul>
      `,
      }),
      'Active Faults': () => createGeoJsonLayer({
        hazardType: 'Active Faults',
        popupLabel: 'Active Fault Risk',
        styleFn: activeFaultStyle,
        popupField: 'Risk',
        infoText: `
          <p class="mb-2">Active fault traces where ground rupture may occur during earthquakes. Classified by associated hazard level.</p>
          <p class="font-medium mb-1">Risk Legend:</p>
          <ul class="space-y-1">
            <li><span class="w-8 h-1.5 bg-[#b91c1c] inline-block"></span> High Risk</li>
            <li><span class="w-8 h-1.5 bg-[#f97316] inline-block"></span> Moderate Risk</li>
            <li><span class="w-8 h-1.5 bg-[#facc15] inline-block"></span> Low Risk</li>
            <li><span class="w-8 h-1.5 bg-[#ccc] border border-dashed inline-block"></span> Unclassified / Default</li>
          </ul>
        `,
      }),
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
