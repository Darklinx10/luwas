// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import L from 'leaflet';
// import { fetchHazardFromFirebase } from '@/utils/fetchHazards';

// function getColorScale(geojson, legendProp, colorSettings) {
//   if (!legendProp) return () => '#3388ff';

//   const values = geojson.features
//     .map(f => f.properties[legendProp.key])
//     .filter(v => v !== undefined && v !== null);

//   if (legendProp.type === 'numeric') {
//     if (values.length === 0) return () => '#3388ff';
//     const min = Math.min(...values);
//     const max = Math.max(...values);
//     const start = colorSettings?.min || '#00ff00';
//     const end = colorSettings?.max || '#ff0000';

//     if (min === max) return () => start;

//     const hexToRgb = hex => {
//       const bigint = parseInt(hex.replace('#', ''), 16);
//       return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
//     };

//     const [r1, g1, b1] = hexToRgb(start);
//     const [r2, g2, b2] = hexToRgb(end);

//     return value => {
//       if (typeof value !== 'number') return '#3388ff';
//       const ratio = (value - min) / (max - min);
//       const r = Math.round(r1 + ratio * (r2 - r1));
//       const g = Math.round(g1 + ratio * (g2 - g1));
//       const b = Math.round(b1 + ratio * (b2 - b1));
//       return `rgb(${r},${g},${b})`;
//     };
//   } else {
//     return value => colorSettings?.[value] || '#3388ff';
//   }
// }

// const getLegendItems = (geojson, legendProp, colorSettings) => {
//   if (!legendProp || !geojson?.features?.length) return [];
//   const values = geojson.features
//     .map(f => f.properties[legendProp.key])
//     .filter(v => v !== undefined && v !== null);

//   if (legendProp.type === 'numeric') {
//     const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
//     return uniqueValues.map(value => ({
//       value: value.toString(),
//       color: getColorScale(geojson, legendProp, colorSettings)(value),
//     }));
//   } else {
//     const uniqueValues = [...new Set(values)];
//     return uniqueValues.map(value => ({
//       value,
//       color: getColorScale(geojson, legendProp, colorSettings)(value),
//     }));
//   }
// };

// export default function HazardLayers({
//   activeHazard,
//   map,
//   setLoading,
//   onLegendChange,
//   onGeoJsonLoad,
// }) {
//   const infoDivRef = useRef(null);
//   const geoJsonLayerRef = useRef(null);
//   const [hazardData, setHazardData] = useState(null);
//   const [legendProp, setLegendProp] = useState(null);
//   const [colorSettings, setColorSettings] = useState({});

//   useEffect(() => {
//     if (!activeHazard) {
//     setHazardData(null);
//     setLegendProp(null);
//     setColorSettings({});
//     onGeoJsonLoad?.(null);

//     // remove layer from map
//     if (map && geoJsonLayerRef.current) {
//       map.removeLayer(geoJsonLayerRef.current);
//       geoJsonLayerRef.current = null;
//     }
//     return;
//   }

//     const loadHazard = async () => {
//       setLoading(true); // ✅ start spinner here
//       try {
//         const data = await fetchHazardFromFirebase(activeHazard);
//         if (!data || !data.features?.length) {
//           console.warn(`No hazard data found for ${activeHazard}`);
//           setHazardData(null);
//           onGeoJsonLoad?.(null);
//           return;
//         }

//         setHazardData(data);
//         onGeoJsonLoad?.(data);

//         let finalLegendProp = data.legendProp?.key ? data.legendProp : null;
//         if (!finalLegendProp) {
//           const keys = Object.keys(data.features[0].properties || {});
//           if (keys.length > 0) {
//             const key = keys[0];
//             finalLegendProp = { key, type: typeof data.features[0].properties[key] === 'number' ? 'numeric' : 'categorical' };
//           }
//         }
//         setLegendProp(finalLegendProp);

//         let initialColors = data.colorSettings || {};
//         if (finalLegendProp?.type === 'numeric') {
//           initialColors.min = initialColors.min || '#00ff00';
//           initialColors.max = initialColors.max || '#ff0000';
//         } else if (finalLegendProp?.type === 'categorical' && Object.keys(initialColors).length === 0) {
//           const uniqueValues = [...new Set(data.features.map(f => f.properties[finalLegendProp.key]))];
//           const palette = ['#3388ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
//           initialColors = Object.fromEntries(uniqueValues.map((v, i) => [v, palette[i % palette.length]]));
//         }
//         setColorSettings(initialColors);
//       } catch (err) {
//         console.error(`Error fetching hazard data for ${activeHazard}:`, err);
//         setHazardData(null);
//         onGeoJsonLoad?.(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadHazard();
//   }, [activeHazard, setLoading, onGeoJsonLoad, map]);

//   useEffect(() => {
//     if (legendProp) {
//       onLegendChange?.(legendProp, colorSettings);
//     }
//   }, [legendProp, colorSettings, onLegendChange]);

//   useEffect(() => {
//   if (!map || !hazardData || !legendProp) return;

//   if (geoJsonLayerRef.current) {
//     map.removeLayer(geoJsonLayerRef.current);
//     geoJsonLayerRef.current = null;
//   }

//   const info = L.control({ position: 'bottomright' });
//   info.onAdd = () => {
//     const container = L.DomUtil.create(
//       'div',
//       'leaflet-control hazard-info-control'
//     );
//     container.innerHTML = `
//       <div id="info-content" class="w-[320px] sm:w-[400px] max-h-[40vh] overflow-y-auto p-4 bg-white rounded-lg shadow-lg text-sm border border-gray-200">
//         <h4 class="font-semibold text-lg mb-2">Hazard Map Info</h4>
//         <p>Loading hazard data...</p>
//       </div>`;
//     infoDivRef.current = container;
//     return container;
//   };

//   info.addTo(map);

//   const updateInfo = () => {
//     const content = infoDivRef.current?.querySelector('#info-content');
//     if (!content) return;

//     const items = getLegendItems(hazardData, legendProp, colorSettings);

//     content.innerHTML = `
//       <h4 class="font-semibold text-lg mb-2">${activeHazard}</h4>
//       <p class="mb-2">${hazardData?.description || 'No description available'}</p>
//       <p>Legend property: ${legendProp.key}</p>
//       <div class="border rounded p-2">
//         ${items
//           .map(
//             (item) => `
//           <div class="flex items-center mb-1">
//             <div class="w-4 h-4 border mr-2" style="background-color:${item.color}"></div>
//             <span>${item.value}</span>
//           </div>`
//           )
//           .join('')}
//       </div>
//     `;
//   };

//   const colorFn = getColorScale(hazardData, legendProp, colorSettings);

//   geoJsonLayerRef.current = L.geoJSON(hazardData, {
//     style: (feature) => ({
//       color: 'transparent',
//       weight: 1,
//       fillColor: colorFn(feature.properties[legendProp.key]),
//       fillOpacity: 0.6,
//     }),
//     onEachFeature: (feature, layer) => {
//       const val = feature.properties?.[legendProp.key] ?? 'N/A';
//       layer.bindPopup(`<strong>${activeHazard}</strong>: ${val}`);
//     },
//   }).addTo(map);

//   // ✅ Stop loading only when ready
//   geoJsonLayerRef.current.on('add', () => {
//     updateInfo();
//     setLoading(false);
//   });

//   return () => {
//     if (geoJsonLayerRef.current) {
//       map.removeLayer(geoJsonLayerRef.current);
//       geoJsonLayerRef.current = null;
//     }
//     map.removeControl(info);
//   };
// }, [hazardData, legendProp, colorSettings, map, activeHazard, setLoading]);

  
// }
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { fetchHazardFromFirebase } from '@/utils/fetchHazards';

function getColorScale(geojson, legendProp, colorSettings) {
  if (!legendProp) return () => '#3388ff';

  const values = geojson.features
    .map(f => f.properties[legendProp.key])
    .filter(v => v !== undefined && v !== null);

  if (legendProp.type === 'numeric') {
    if (!values.length) return () => '#3388ff';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const start = colorSettings?.min || '#00ff00';
    const end = colorSettings?.max || '#ff0000';
    if (min === max) return () => start;

    const hexToRgb = hex => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };
    const [r1, g1, b1] = hexToRgb(start);
    const [r2, g2, b2] = hexToRgb(end);

    return value => {
      if (typeof value !== 'number') return '#3388ff';
      const ratio = (value - min) / (max - min);
      const r = Math.round(r1 + ratio * (r2 - r1));
      const g = Math.round(g1 + ratio * (g2 - g1));
      const b = Math.round(b1 + ratio * (b2 - b1));
      return `rgb(${r},${g},${b})`;
    };
  } else {
    return value => colorSettings?.[value] || '#3388ff';
  }
}

export default function HazardLayer({ activeHazard, map, setLoading, setHazardGeoJSON, setLegendProp, setColorSettings }) {
  const geoJsonLayerRef = useRef(null);
  const infoLegendRef = useRef(null);

  useEffect(() => {
    if (!map || !activeHazard) return;

    let isCancelled = false;

    const loadHazard = async () => {
      setLoading(true);

      try {
        const data = await fetchHazardFromFirebase(activeHazard);
        if (isCancelled) return;

        if (!data || !data.features?.length) {
          console.warn(`No hazard data for ${activeHazard}`);
          setLoading(false);
          return;
        }

        // Determine legend property
        let legendProp = data.legendProp?.key ? data.legendProp : null;
        if (!legendProp) {
          const keys = Object.keys(data.features[0].properties || {});
          if (keys.length) {
            const key = keys[0];
            legendProp = {
              key,
              type: typeof data.features[0].properties[key] === 'number' ? 'numeric' : 'categorical'
            };
          }
        }

        // Expose to parent for household computation
        setHazardGeoJSON && setHazardGeoJSON(data);
        setLegendProp && setLegendProp(legendProp);

        // Determine color settings
        let colorSettings = data.colorSettings || {};
        if (legendProp.type === 'numeric') {
          colorSettings.min = colorSettings.min || '#00ff00';
          colorSettings.max = colorSettings.max || '#ff0000';
        } else if (legendProp.type === 'categorical' && Object.keys(colorSettings).length === 0) {
          const uniqueValues = [...new Set(data.features.map(f => f.properties[legendProp.key]))];
          const palette = ['#3388ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
          colorSettings = Object.fromEntries(uniqueValues.map((v, i) => [v, palette[i % palette.length]]));
        }

        // Cleanup previous layer/control
        if (geoJsonLayerRef.current) {
          map.removeLayer(geoJsonLayerRef.current);
          geoJsonLayerRef.current = null;
        }
        if (infoLegendRef.current) {
          map.removeControl(infoLegendRef.current);
          infoLegendRef.current = null;
        }

        // Add legend control
        const infoLegend = L.control({ position: 'bottomright' });
        infoLegend.onAdd = () => {
          const container = L.DomUtil.create(
            'div',
            'leaflet-control hazard-info-legend absolute bottom-4 right-2 z-[1000] p-4 bg-white rounded shadow max-h-[300px] overflow-auto w-[90vw] max-w-sm sm:max-w-md text-sm'
          );
          
          const colorFn = getColorScale(data, legendProp, colorSettings);
          let legendHTML = '';

          if (legendProp.type === 'numeric') {
            const values = data.features.map(f => f.properties[legendProp.key]);
            const min = Math.min(...values);
            const max = Math.max(...values);
            legendHTML += `
              <div class="font-semibold mb-1">Legend (${legendProp.key})</div>
              <div class="flex items-center mb-1">
                <div style="background:${colorSettings.min};width:20px;height:20px;margin-right:4px;"></div> ${min}
              </div>
              <div class="flex items-center mb-1">
                <div style="background:${colorSettings.max};width:20px;height:20px;margin-right:4px;"></div> ${max}
              </div>
            `;
          } else {
            const uniqueValues = [...new Set(data.features.map(f => f.properties[legendProp.key]))];
            legendHTML += `<div class="font-semibold mb-1">Legend (${legendProp.key})</div>`;
            uniqueValues.forEach(v => {
              const color = colorSettings[v] || '#3388ff';
              legendHTML += `
                <div class="flex items-center mb-1">
                  <div style="background:${color};width:20px;height:20px;margin-right:4px;"></div> ${v}
                </div>
              `;
            });
          }

          container.innerHTML = `
            <h4 class="font-semibold mb-1">${activeHazard}</h4>
            <p class="mb-2">${data.description || 'No description available'}</p>
            ${legendHTML}
          `;
          infoLegendRef.current = infoLegend;
          return container;
        };
        infoLegend.addTo(map);

        // Add hazard layer
        const colorFn = getColorScale(data, legendProp, colorSettings);
        geoJsonLayerRef.current = L.geoJSON(data, {
          style: feature => ({
            color: 'transparent',
            weight: 1,
            fillColor: colorFn(feature.properties[legendProp.key]),
            fillOpacity: 0.6,
          }),
          onEachFeature: (feature, layer) => {
            const val = feature.properties?.[legendProp.key] ?? 'N/A';
            layer.bindPopup(`<strong>${activeHazard}</strong>: ${val}`);
          },
        }).addTo(map);

        setLoading(false);

      } catch (err) {
        if (!isCancelled) {
          console.error(`Error loading hazard ${activeHazard}:`, err);
          setLoading(false);
        }
      }
    };

    loadHazard();

    return () => {
      isCancelled = true;
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }
      if (infoLegendRef.current) {
        map.removeControl(infoLegendRef.current);
        infoLegendRef.current = null;
      }
    };
  }, [activeHazard, map, setLoading, setHazardGeoJSON, setLegendProp, setColorSettings]);

  return null;
}
