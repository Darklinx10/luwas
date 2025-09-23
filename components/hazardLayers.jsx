'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { fetchHazardFromFirebase } from '@/utils/fetchHazards';
import useIsMobile from '@/hooks/useMobile';

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

  return value => colorSettings?.[value] || '#3388ff';
}

export default function HazardLayer({
  activeHazard,
  map,
  setLoading,
  setHazardGeoJSON,
  setLegendProp,
  setColorSettings,
  setAffectedHouseholds,
}) {
  const geoJsonLayerRef = useRef(null);
  const infoLegendRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!map || !activeHazard) {
      resetStates();
      return;
    }

    let isCancelled = false;

    const loadHazard = async () => {
      setLoading(true);
      try {
        const data = await fetchHazardFromFirebase(activeHazard);
        if (isCancelled) return;

        // Remove old layers
        removeLayers();

        // Determine legend property
        let legendProp = data?.legendProp?.key ? data.legendProp : null;
        if (!legendProp && data?.features?.length) {
          const keys = Object.keys(data.features[0]?.properties || {});
          if (keys.length) {
            const key = keys[0];
            legendProp = {
              key,
              type: typeof data.features[0].properties[key] === 'number' ? 'numeric' : 'categorical',
            };
          }
        }

        // Handle empty hazard
        const isEmpty = !data || !data.features?.length || !legendProp;

        // Build color settings
        let finalColorSettings = {};
        if (!isEmpty) {
          finalColorSettings = data.colorSettings || {};
          if (legendProp.type === 'numeric') {
            finalColorSettings.min = finalColorSettings.min || '#00ff00';
            finalColorSettings.max = finalColorSettings.max || '#ff0000';
          } else {
            const uniqueValues = [...new Set(data.features.map(f => f.properties[legendProp.key]))];
            if (Object.keys(finalColorSettings).length === 0) {
              const palette = ['#3388ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
              finalColorSettings = Object.fromEntries(uniqueValues.map((val, i) => [val, palette[i % palette.length]]));
            }
          }
        }

        // Set parent states
        setHazardGeoJSON?.(isEmpty ? null : data);
        setLegendProp?.(isEmpty ? null : legendProp);
        setColorSettings?.(finalColorSettings);

        // Add legend control
        const legendControl = L.control({ position: 'bottomright' });
        legendControl.onAdd = () => {
          const container = L.DomUtil.create('div', 'relative z-[1000]');
          let collapsed = isMobile ;

          // Collapsed chat bubble
          const collapsedDiv = L.DomUtil.create('div', 'group absolute right-4 bottom-4');
          collapsedDiv.innerHTML = `
            <button class="p-2 rounded-full bg-white shadow hover:bg-gray-200 flex items-center justify-center" aria-label="Expand panel">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14l4 4V8c0-1.1-.9-2-2-2z" fill="white" stroke="currentColor"/>
              </svg>
            </button>
            <span class="absolute -left-36 bottom-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Hazard Info
            </span>
          `;

          // Expanded panel
          const expandedDiv = L.DomUtil.create(
            'div',
            `absolute right-4 bottom-4 bg-white rounded shadow text-sm transition-all duration-300 ease-in-out p-4 max-h-[300px] overflow-auto w-[90vw] max-w-sm ${isMobile ? '' : 'w-[90vw] max-w-sm sm:max-w-md'}`
          );
          expandedDiv.style.display = collapsed ? 'none' : 'block';
          expandedDiv.innerHTML = `
            <button class="absolute top-2 right-2 p-1 rounded hover:bg-gray-200" aria-label="Collapse panel">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <h4 class="font-semibold mt-5 mb-2 text-lg">${activeHazard}</h4>
            <p class="text-gray-500 italic">${isEmpty ? 'No hazard layer available' : data.description || 'No description available'}</p>
          `;

          // Add legend items if not empty
          if (!isEmpty) {
            let legendHTML = '';
            if (legendProp.type === 'numeric') {
              const values = data.features.map(f => f.properties[legendProp.key]);
              legendHTML += `<div class="font-semibold mb-1">Legend (${legendProp.key})</div>
                <div class="flex items-center mb-1">
                  <div style="background:${finalColorSettings.min};width:20px;height:20px;margin-right:4px;"></div> ${Math.min(...values)}
                </div>
                <div class="flex items-center mb-1">
                  <div style="background:${finalColorSettings.max};width:20px;height:20px;margin-right:4px;"></div> ${Math.max(...values)}
                </div>`;
            } else {
              legendHTML += `<div class="font-semibold mb-1">Legend (${legendProp.key})</div>`;
              [...new Set(data.features.map(f => f.properties[legendProp.key]))].forEach(val => {
                const color = finalColorSettings[val] || '#3388ff';
                legendHTML += `
                  <div class="flex items-center mb-1">
                    <div style="background:${color};width:20px;height:20px;margin-right:4px;"></div> ${val}
                  </div>`;
              });
            }
            expandedDiv.innerHTML += legendHTML;
          }

          // Toggle logic
          const expandBtn = collapsedDiv.querySelector('button');
          const collapseBtn = expandedDiv.querySelector('button');
          L.DomEvent.on(expandBtn, 'click', () => {
            collapsed = false;
            collapsedDiv.style.display = 'none';
            expandedDiv.style.display = 'block';
          });
          L.DomEvent.on(collapseBtn, 'click', () => {
            collapsed = true;
            collapsedDiv.style.display = 'block';
            expandedDiv.style.display = 'none';
          });

          container.appendChild(collapsedDiv);
          container.appendChild(expandedDiv);
          L.DomEvent.disableClickPropagation(container);
          L.DomEvent.disableScrollPropagation(container);

          return container;
        };

        legendControl.addTo(map);
        infoLegendRef.current = legendControl;

        // Add GeoJSON if not empty
        if (!isEmpty) {
          const colorFn = getColorScale(data, legendProp, finalColorSettings);
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
        }

        setLoading(false);
      } catch (err) {
        if (!isCancelled) {
          console.error(`Error loading hazard "${activeHazard}":`, err);
          resetStates();
          setLoading(false);
        }
      }
    };

    loadHazard();

    return () => {
      isCancelled = true;
      removeLayers();
      resetStates();
    };

    function removeLayers() {
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }
      if (infoLegendRef.current) {
        map.removeControl(infoLegendRef.current);
        infoLegendRef.current = null;
      }
    }

    function resetStates() {
      setHazardGeoJSON?.(null);
      setLegendProp?.(null);
      setColorSettings?.({});
      setAffectedHouseholds?.([]);
    }
  }, [activeHazard, map, setLoading, setHazardGeoJSON, setLegendProp, setColorSettings, setAffectedHouseholds, isMobile]);

  return null;
}
