'use client';
import { useEffect, useRef } from 'react';
import * as esri from 'esri-leaflet';
import L from 'leaflet';
import { faultCategories } from '@/app/utils/faultcategories';
import {normalizeSusceptibility} from '@/app/utils/susceptibility'


export default function HazardLayers({ activeHazard, map, setLoading }) {
  const infoDivRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
 
  

  useEffect(() => { 
    if (!map || !activeHazard) return;

    //Initialize Leaflet info control
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
    //Update info panel dynamically
    const updateInfo = (title, description) => {
      const content = infoDivRef.current?.querySelector('#info-content');
      if (content) {
        content.innerHTML = `
          <h4 class="font-semibold text-lg mb-2">${title}</h4>
          ${description}`;
      }
    };

    //Create and load GeoJSON layer
    const createGeoJsonLayer = ({ url, popupLabel, styleFn, infoText }) => {
      const layer = L.geoJSON(null, {
        onEachFeature: (feature, layer) => {
          const rawLabel =
            feature.properties?.Susciptibi ??
            feature.properties?.Susceptibility ??
            feature.properties?.HazardLevel ??
            feature.properties?.Inundation;
            feature.properties?.Risk;

          const label = normalizeSusceptibility(rawLabel);
          layer.bindPopup(`<strong>${popupLabel}:</strong> ${label}`);
        },
        style: styleFn //Apply feature style
      });

      setLoading(true); //Start loading spinner
      fetch(url)
        .then(res => res.json())
        .then(data => {

          //Remove existing layer if present
          if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
            geoJsonLayerRef.current = null;
          }
          layer.clearLayers();
          layer.addData(data); //Load new data
          layer.addTo(map);
          geoJsonLayerRef.current = layer; //Save reference
          updateInfo(popupLabel, `<p class="mb-2">${infoText}</p>`);

          // expose data globally for dev tools
          if (typeof window !== 'undefined' && window.setHazardGeoJSON) {
            window.setHazardGeoJSON(data); // <-- Make data available globally
          }
        })
        .catch(err => {
          console.error(`Error loading ${popupLabel} GeoJSON:`, err);
        })
        .finally(() => setLoading(false)); //Stop loading spinner

      return layer;
    };

    //Map hazard values to styles
    const styleBySusceptibility = (value) => {
      let fillColor = '#ccc';
      let fillOpacity = 0.7;
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
      let color = '#ccc'; // default gray
      let dashArray = '5,5'; // default dashed line

      switch (value) {
        case 'High':
        case 'HIGH':
          color = '#b91c1c'; // deep red
          break;
        case 'Moderate':
        case 'MODERATE':
          color = '#f97316'; // orange
          break;
        case 'Low':
        case 'LOW':
          color = '#facc15'; // yellow
          break;
        default:
          color = '#9ca3af'; // gray
      }

      return {
        color,
        weight: 3,
        opacity: 1,
        dashArray
      };
    };

    //Style for storm surge values
    const stormSurgeStyle = (feature) => {
      const value = feature.properties?.Inundation || feature.properties?.Inundiation;
      let fillColor = '#0ea5e9';
      let fillOpacity = 0.6;
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

    //Fixed style for tsunami zones
    const tsunamiStyle = () => ({
      color: '#ea580c', weight: 1, fillOpacity: 0.7, fillColor: '#ea580c'
    });

    //Predefined GeoJSON hazard layers
    const geoJsonLayers = {
      'Liquefaction': () =>
        createGeoJsonLayer({
          url: '/data/Clarin_Liquefaction_converted.geojson',
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
            `
        }),

      'Earthquake Induced Landslide': () =>
        createGeoJsonLayer({
          url: '/data/Clarin_EIL_converted.geojson',
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
          `
        }),


      'Rain Induced Landslide': () =>
        createGeoJsonLayer({
          url: '/data/Clarin_RIL_converted.geojson',
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
          `
        }),

      'Tsunami': () =>
        createGeoJsonLayer({
          url: '/data/Clarin_Tsunami_converted.geojson',
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
          `
        }),

      'Landslide': () =>
        createGeoJsonLayer({
          url: '/data/Clarin_Landslide.geojson',
          popupLabel: 'Landslide Susceptibility',
          styleFn: (f) => styleBySusceptibility(normalizeSusceptibility(f.properties?.Susciptibi)),
          infoText: `
            <p class="mb-2">Areas susceptible to landslides based on slope, soil type, and land use.</p>
            <p class="font-medium mb-1">Legend:</p>
            <ul class="space-y-1">
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-red-700 inline-block border"></span> High Susceptibility
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-yellow-400 inline-block border"></span> Moderate Susceptibility
              </li>
              <li class="flex items-center gap-2">
                <span class="w-4 h-4 bg-green-500 inline-block border"></span> Low Susceptibility
              </li>
            </ul>
          `
        }),

        'Active Faults': () =>
          createGeoJsonLayer({
            url: '/data/FaultLine.geojson',
            popupLabel: 'Active Fault Line',
            styleFn: activeFaultStyle,
            infoText: `
              <p class="mb-2">Mapped locations of active fault lines that may produce ground rupture during seismic events.</p>
              <p class="font-medium mb-1">Legend:</p>
              <ul class="space-y-1">
                <li class="flex items-center gap-2">
                  <span class="w-4 h-1.5 bg-pink-600 inline-block border"></span> Active Fault Trace
                </li>
              </ul>
            `
          })


    };

    // Dynamic map layers using ESRI
    const hazardLayers = {
      // 'Active Faults': esri.dynamicMapLayer({
      //   url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCSPublic/ActiveFault/MapServer',
      //   opacity: 1
      // })
      //   .on('loading', () => {
      //     setLoading(true);
      //     updateInfo('Active Faults', `
      //       <p class="mb-2">Shows known active faults in the region.</p>
      //       <div class="space-y-1 text-xs">
      //         ${faultCategories.map(fault => {
      //           const strokeStyle =
      //             fault.type.includes('Dashed') ? 'border-dashed' :
      //             fault.type.includes('Dotted') ? 'border-dotted' : 'border-solid';

      //           const line = fault.type.includes('Sawteeth') ? `
      //             <svg width="40" height="10">
      //               <path d="M0 5 L40 5" stroke="${fault.color}" stroke-width="2"/>
      //               <path d="M5 0 L10 5 L5 10" fill="none" stroke="${fault.color}" stroke-width="1"/>
      //               <path d="M15 0 L20 5 L15 10" fill="none" stroke="${fault.color}" stroke-width="1"/>
      //             </svg>` :
      //             `<div class="w-10 border-t-2 ${strokeStyle}" style="border-color:${fault.color};"></div>`;

      //           return `<div class="flex items-center space-x-2">${line}<span>${fault.category}, ${fault.type}</span></div>`;
      //         }).join('')}
      //       </div>
      //     `);
      //   })
      //   .on('load', () => setLoading(false)),

      'Ground Shaking': esri.dynamicMapLayer({
        url: 'https://ulap-hazards.georisk.gov.ph/arcgis/rest/services/PHIVOLCS/GroundShaking/MapServer',
        opacity: 0.5
      })
        .on('loading', () => {
          setLoading(true);
          updateInfo('Ground Shaking', 'Estimated seismic shaking intensity.');
        })
        .on('load', () => setLoading(false)),

      
    };

    
    // Remove previous layers
    Object.values(hazardLayers).forEach(layer => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    // Add new hazard layer
    if (geoJsonLayers[activeHazard]) {
      geoJsonLayers[activeHazard](); //Load and display GeoJSON hazard
    } else if (hazardLayers[activeHazard]) {
      hazardLayers[activeHazard].addTo(map); // Add ESRI layer
    }

    return () => {
      map.removeControl(info); // ✅ Properly remove info control
      Object.values(hazardLayers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      });
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }
    };
  }, [map, activeHazard, setLoading]);

  return null;
}
