'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import useIsMobile from '@/hooks/useMobile';

function getColorScale(geojson, legendProp, colorSettings) {
  if (!legendProp) return () => '#3388ff';

  const values = geojson.features
    .map((feature) => feature.properties[legendProp.key])
    .filter((value) => value !== undefined && value !== null);

  if (legendProp.type === 'numeric') {
    if (!values.length) return () => '#3388ff';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const start = colorSettings?.min || '#00ff00';
    const end = colorSettings?.max || '#ff0000';

    if (min === max) return () => start;

    const hexToRgb = (hex) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const [r1, g1, b1] = hexToRgb(start);
    const [r2, g2, b2] = hexToRgb(end);

    return (value) => {
      if (typeof value !== 'number') return '#3388ff';

      const ratio = (value - min) / (max - min);
      const r = Math.round(r1 + ratio * (r2 - r1));
      const g = Math.round(g1 + ratio * (g2 - g1));
      const b = Math.round(b1 + ratio * (b2 - b1));

      return `rgb(${r},${g},${b})`;
    };
  }

  return (value) => colorSettings?.[value] || '#3388ff';
}

function buildDefaultColorSettings(data, legendProp) {
  if (!legendProp || !data?.features?.length) return {};

  if (legendProp.type === 'numeric') {
    return {
      min: '#00ff00',
      max: '#ff0000',
    };
  }

  const uniqueValues = [...new Set(data.features.map((f) => f.properties[legendProp.key]))];
  const palette = ['#3388ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];

  return Object.fromEntries(
    uniqueValues.map((value, index) => [value, palette[index % palette.length]])
  );
}

function detectLegendProp(data) {
  if (!data?.features?.length) return null;

  if (data?.legendProp?.key) {
    return data.legendProp;
  }

  const keys = Object.keys(data.features[0]?.properties || {});
  if (!keys.length) return null;

  const key = keys[0];
  const sampleValue = data.features[0]?.properties?.[key];

  return {
    key,
    type: typeof sampleValue === 'number' ? 'numeric' : 'categorical',
  };
}

function createCollapsedPanel() {
  const collapsedDiv = L.DomUtil.create('div', 'group');

  collapsedDiv.innerHTML = `
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      aria-label="Expand hazard panel"
    >
      <span>Hazard Info</span>
    </button>
  `;

  return collapsedDiv;
}

function createExpandedPanel({
  activeHazard,
  isEmpty,
  description,
  legendProp,
  data,
  finalColorSettings,
}) {
  const expandedDiv = L.DomUtil.create(
    'div',
    'w-[calc(100vw-2rem)] max-w-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-[22rem] md:w-[24rem] lg:w-[26rem]'
  );

  const header = L.DomUtil.create(
    'div',
    'flex items-start justify-between border-b border-slate-200 px-4 py-4',
    expandedDiv
  );

  const titleWrap = L.DomUtil.create('div', '', header);
  const title = L.DomUtil.create('h4', 'text-base font-semibold text-slate-800', titleWrap);
  title.textContent = activeHazard;

  const desc = L.DomUtil.create('p', 'mt-1 text-sm text-slate-500', titleWrap);
  desc.textContent = isEmpty
    ? 'No hazard layer available'
    : description || 'No description available';

  const collapseBtn = L.DomUtil.create(
    'button',
    'rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700',
    header
  );
  collapseBtn.type = 'button';
  collapseBtn.setAttribute('aria-label', 'Collapse hazard panel');
  collapseBtn.textContent = '−';

  const body = L.DomUtil.create(
    'div',
    'max-h-[40vh] space-y-3 overflow-auto p-4 sm:max-h-[45vh] lg:max-h-[50vh]',
    expandedDiv
  );

  if (!isEmpty) {
    const sectionTitle = L.DomUtil.create(
      'div',
      'text-xs font-semibold uppercase tracking-[0.08em] text-slate-400',
      body
    );
    sectionTitle.textContent = `Legend (${legendProp.key})`;

    if (legendProp.type === 'numeric') {
      const values = data.features
        .map((feature) => feature.properties[legendProp.key])
        .filter((value) => typeof value === 'number');

      const min = values.length ? Math.min(...values) : 'N/A';
      const max = values.length ? Math.max(...values) : 'N/A';

      [
        { label: String(min), color: finalColorSettings.min || '#00ff00' },
        { label: String(max), color: finalColorSettings.max || '#ff0000' },
      ].forEach((item) => {
        const row = L.DomUtil.create(
          'div',
          'flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2',
          body
        );

        const swatch = L.DomUtil.create('div', 'h-4 w-4 rounded-sm border border-slate-200', row);
        swatch.style.backgroundColor = item.color;

        const text = L.DomUtil.create('span', 'text-sm text-slate-700', row);
        text.textContent = item.label;
      });
    } else {
      const uniqueValues = [...new Set(data.features.map((f) => f.properties[legendProp.key]))];

      uniqueValues.forEach((value) => {
        const row = L.DomUtil.create(
          'div',
          'flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2',
          body
        );

        const swatch = L.DomUtil.create('div', 'h-4 w-4 rounded-sm border border-slate-200', row);
        swatch.style.backgroundColor = finalColorSettings?.[value] || '#3388ff';

        const text = L.DomUtil.create('span', 'text-sm text-slate-700', row);
        text.textContent = String(value);
      });
    }
  }

  return { expandedDiv, collapseBtn };
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
      removeLayers();
      return;
    }

    let isCancelled = false;

    const loadHazard = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/hazards?type=${encodeURIComponent(activeHazard)}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch hazards: ${response.statusText}`);
        }

        const data = await response.json();
        if (isCancelled) return;

        removeLayers();

        const legendProp = detectLegendProp(data);
        const isEmpty = !data || !data.features?.length || !legendProp;

        let finalColorSettings = data?.colorSettings || {};
        if (!isEmpty && Object.keys(finalColorSettings).length === 0) {
          finalColorSettings = buildDefaultColorSettings(data, legendProp);
        } else if (!isEmpty && legendProp.type === 'numeric') {
          finalColorSettings.min = finalColorSettings.min || '#00ff00';
          finalColorSettings.max = finalColorSettings.max || '#ff0000';
        }

        setHazardGeoJSON?.(isEmpty ? null : data);
        setLegendProp?.(isEmpty ? null : legendProp);
        setColorSettings?.(isEmpty ? {} : finalColorSettings);

        const legendControl = L.control({ position: 'bottomright' });

        legendControl.onAdd = () => {
          const container = L.DomUtil.create('div', 'relative z-[1000]');
          let collapsed = !!isMobile;

          const collapsedDiv = createCollapsedPanel();
          const { expandedDiv, collapseBtn } = createExpandedPanel({
            activeHazard,
            isEmpty,
            description: data?.description,
            legendProp,
            data,
            finalColorSettings,
          });

          collapsedDiv.style.display = collapsed ? 'block' : 'none';
          expandedDiv.style.display = collapsed ? 'none' : 'block';

          const expandBtn = collapsedDiv.querySelector('button');

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

        if (!isEmpty) {
          const colorFn = getColorScale(data, legendProp, finalColorSettings);

          geoJsonLayerRef.current = L.geoJSON(data, {
            style: (feature) => ({
              color: 'transparent',
              weight: 1,
              fillColor: colorFn(feature.properties[legendProp.key]),
              fillOpacity: 0.6,
            }),
            onEachFeature: (feature, layer) => {
              const value = feature.properties?.[legendProp.key] ?? 'N/A';
              layer.bindPopup(`<strong>${activeHazard}</strong>: ${value}`);
            },
          }).addTo(map);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error(`Error loading hazard "${activeHazard}":`, error);
          resetStates();
          removeLayers();
        }
      } finally {
        if (!isCancelled) {
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
  }, [
    activeHazard,
    map,
    setLoading,
    setHazardGeoJSON,
    setLegendProp,
    setColorSettings,
    setAffectedHouseholds,
    isMobile,
  ]);

  return null;
}