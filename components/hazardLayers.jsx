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
  }

  // Categorical
  return value => colorSettings?.[value] || '#3388ff';
}

export default function HazardLayer({
  activeHazard,
  map,
  setLoading,
  setHazardGeoJSON,
  setLegendProp,
  setColorSettings,
  setAffectedHouseholds, // 👈 NEW: reset households when hazard is cleared
}) {
  const geoJsonLayerRef = useRef(null);
  const infoLegendRef = useRef(null);

  useEffect(() => {
    if (!map || !activeHazard) {
      // No hazard selected → reset state
      setHazardGeoJSON?.(null);
      setLegendProp?.(null);
      setColorSettings?.({});
      setAffectedHouseholds?.([]);
      return;
    }

    let isCancelled = false;

    const loadHazard = async () => {
      setLoading(true);

      try {
        const data = await fetchHazardFromFirebase(activeHazard);
        if (isCancelled) return;

        // 🟢 CASE: No hazard data → show empty legend box
        if (!data || !data.features?.length) {
          console.warn(`No hazard data for "${activeHazard}"`);

          // Remove old layers if any
          if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
            geoJsonLayerRef.current = null;
          }
          if (infoLegendRef.current) {
            map.removeControl(infoLegendRef.current);
            infoLegendRef.current = null;
          }

          // Add fallback legend
          const emptyLegend = L.control({ position: 'bottomright' });
          emptyLegend.onAdd = () => {
            const container = L.DomUtil.create(
              'div',
              'leaflet-control hazard-info-legend p-4 bg-white rounded shadow w-[90vw] max-w-sm text-sm'
            );
            container.innerHTML = `
              <h4 class="font-semibold mb-1">${activeHazard}</h4>
              <p class="text-gray-500 italic">No hazard layer available</p>
            `;
            return container;
          };
          emptyLegend.addTo(map);
          infoLegendRef.current = emptyLegend;

          // Reset states
          setHazardGeoJSON?.(null);
          setLegendProp?.(null);
          setColorSettings?.({});
          setAffectedHouseholds?.([]);
          setLoading(false);
          return;
        }

        // --- normal flow with hazard data ---
        let legendProp = data.legendProp?.key ? data.legendProp : null;

        if (!legendProp) {
          const sampleProps = data.features[0]?.properties || {};
          const keys = Object.keys(sampleProps);
          if (keys.length) {
            const key = keys[0];
            legendProp = {
              key,
              type: typeof sampleProps[key] === 'number' ? 'numeric' : 'categorical'
            };
          }
        }

        if (!legendProp) {
          console.warn(`No valid legend property found for "${activeHazard}"`);
          setHazardGeoJSON?.(null);
          setLegendProp?.(null);
          setColorSettings?.({});
          setAffectedHouseholds?.([]);
          setLoading(false);
          return;
        }

        // Pass data to parent
        setHazardGeoJSON?.(data);
        setLegendProp?.(legendProp);

        // Build color settings
        let finalColorSettings = data.colorSettings || {};

        if (legendProp.type === 'numeric') {
          finalColorSettings.min = finalColorSettings.min || '#00ff00';
          finalColorSettings.max = finalColorSettings.max || '#ff0000';
        } else if (legendProp.type === 'categorical') {
          const uniqueValues = [
            ...new Set(data.features.map(f => f.properties[legendProp.key]))
          ];

          if (Object.keys(finalColorSettings).length === 0) {
            const palette = ['#3388ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
            finalColorSettings = Object.fromEntries(
              uniqueValues.map((val, i) => [val, palette[i % palette.length]])
            );
          }
        }

        setColorSettings?.(finalColorSettings);

        // Remove old layers
        if (geoJsonLayerRef.current) {
          map.removeLayer(geoJsonLayerRef.current);
          geoJsonLayerRef.current = null;
        }
        if (infoLegendRef.current) {
          map.removeControl(infoLegendRef.current);
          infoLegendRef.current = null;
        }

        // Add Legend
        const colorFn = getColorScale(data, legendProp, finalColorSettings);

        const infoLegend = L.control({ position: 'bottomright' });
        infoLegend.onAdd = () => {
          const container = L.DomUtil.create(
            'div',
            'leaflet-control hazard-info-legend p-4 bg-white rounded shadow max-h-[300px] overflow-auto w-[90vw] max-w-sm sm:max-w-md text-sm'
          );

          let legendHTML = `<h4 class="font-semibold mb-1">${activeHazard}</h4>`;
          legendHTML += `<p class="mb-2">${data.description || 'No description available'}</p>`;

          if (legendProp.type === 'numeric') {
            const values = data.features.map(f => f.properties[legendProp.key]);
            const min = Math.min(...values);
            const max = Math.max(...values);
            legendHTML += `
              <div class="font-semibold mb-1">Legend (${legendProp.key})</div>
              <div class="flex items-center mb-1">
                <div style="background:${finalColorSettings.min};width:20px;height:20px;margin-right:4px;"></div> ${min}
              </div>
              <div class="flex items-center mb-1">
                <div style="background:${finalColorSettings.max};width:20px;height:20px;margin-right:4px;"></div> ${max}
              </div>
            `;
          } else {
            const uniqueValues = [...new Set(data.features.map(f => f.properties[legendProp.key]))];
            legendHTML += `<div class="font-semibold mb-1">Legend (${legendProp.key})</div>`;
            uniqueValues.forEach(val => {
              const color = finalColorSettings[val] || '#3388ff';
              legendHTML += `
                <div class="flex items-center mb-1">
                  <div style="background:${color};width:20px;height:20px;margin-right:4px;"></div> ${val}
                </div>
              `;
            });
          }

          container.innerHTML = legendHTML;
          return container;
        };

        infoLegend.addTo(map);
        infoLegendRef.current = infoLegend;

        // Add Hazard GeoJSON Layer
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
          console.error(`Error loading hazard "${activeHazard}":`, err);
          setHazardGeoJSON?.(null);
          setLegendProp?.(null);
          setColorSettings?.({});
          setAffectedHouseholds?.([]);
          setLoading(false);
        }
      }
    };

    loadHazard();

    return () => {
      isCancelled = true;
    
      // Remove Hazard Layer
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }
    
      // Remove Legend
      if (infoLegendRef.current) {
        map.removeControl(infoLegendRef.current);
        infoLegendRef.current = null;
      }
    
      // Reset related states together
      setHazardGeoJSON?.(null);
      setLegendProp?.(null);
      setColorSettings?.({});
      setAffectedHouseholds?.([]);
      setLoading(false);
    };
    
  }, [activeHazard, map, setLoading, setHazardGeoJSON, setLegendProp, setColorSettings, setAffectedHouseholds]);

  return null;
}
