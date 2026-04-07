'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FiUploadCloud, FiX, FiMap, FiLayers, FiDroplet } from 'react-icons/fi';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reprojectGeoJSON } from '@/utils/geoJsonProjection';
import { useMap } from '@/context/mapContext';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { hazardTypes } from '@/utils/hazardTypes';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const detectLegendProperty = (geojson) => {
  if (!geojson?.features?.length) return null;

  const allProps = geojson.features.reduce((acc, feature) => {
    const props = feature.properties || {};
    return { ...acc, ...props };
  }, {});

  const numeric = Object.keys(allProps).find((key) =>
    geojson.features.every(
      (feature) =>
        typeof feature.properties[key] === 'number' &&
        !isNaN(feature.properties[key])
    )
  );
  if (numeric) return { key: numeric, type: 'numeric' };

  const categorical = Object.keys(allProps).find((key) =>
    geojson.features.every(
      (feature) =>
        typeof feature.properties[key] === 'string' ||
        typeof feature.properties[key] === 'boolean'
    )
  );
  if (categorical) return { key: categorical, type: 'categorical' };

  return null;
};

const getColorScale = (geojson, legendProp, colorSettings) => {
  if (!legendProp || !geojson?.features?.length) return () => '#3388ff';

  const values = geojson.features
    .map((feature) => feature.properties[legendProp.key])
    .filter((value) => value !== undefined && value !== null);

  if (legendProp.type === 'numeric') {
    if (values.length === 0) return () => '#3388ff';

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) return () => colorSettings.min || '#00ff00';

    const start = colorSettings.min || '#00ff00';
    const end = colorSettings.max || '#ff0000';

    return (value) => {
      if (value === undefined || value === null) return '#3388ff';

      const ratio = (value - min) / (max - min);

      const hexToRgb = (hex) => {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
      };

      const [r1, g1, b1] = hexToRgb(start);
      const [r2, g2, b2] = hexToRgb(end);

      const r = Math.round(r1 + ratio * (r2 - r1));
      const g = Math.round(g1 + ratio * (g2 - g1));
      const b = Math.round(b1 + ratio * (b2 - b1));

      return `rgb(${r},${g},${b})`;
    };
  }

  return (value) => colorSettings[value] || '#3388ff';
};

const getLegendItems = (geojson, legendProp, colorSettings) => {
  if (!legendProp || !geojson?.features?.length) return [];

  const values = geojson.features
    .map((feature) => feature.properties[legendProp.key])
    .filter((value) => value !== undefined && value !== null);

  if (legendProp.type === 'numeric') {
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    return uniqueValues.map((value) => ({
      value: value.toString(),
      color: getColorScale(geojson, legendProp, colorSettings)(value),
    }));
  }

  const uniqueValues = [...new Set(values)];
  return uniqueValues.map((value) => ({
    value,
    color: getColorScale(geojson, legendProp, colorSettings)(value),
  }));
};

export default function AddHazardModal({
  isOpen,
  onClose,
  hazardType,
  setHazardType,
  description,
  setDescription,
  geojsonFile,
  setGeojsonFile,
  legendProp,
  setLegendProp,
  colorSettings,
  setColorSettings,
  handleUploadAndSave,
  loadingUpload,
}) {
  const [geojsonData, setGeojsonData] = useState(null);
  const mapRef = useRef(null);
  const { boundaryGeoJSON, defaultCenter } = useMap();

  const geojsonLayer = useMemo(
    () => (geojsonData ? L.geoJSON(geojsonData) : null),
    [geojsonData]
  );
  const boundaryLayer = useMemo(
    () => (boundaryGeoJSON ? L.geoJSON(boundaryGeoJSON) : null),
    [boundaryGeoJSON]
  );

  const initializeColorSettings = (geojson, currentLegendProp) => {
    if (!currentLegendProp || !geojson?.features?.length) return {};

    if (currentLegendProp.type === 'categorical') {
      const values = [...new Set(geojson.features.map((f) => f.properties[currentLegendProp.key]))];
      const defaultColors = ['#3388ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
      const settings = {};

      values.forEach((value, index) => {
        settings[value] = defaultColors[index % defaultColors.length];
      });

      return settings;
    }

    return { min: '#00ff00', max: '#ff0000' };
  };

  const resetForm = useCallback(() => {
    setHazardType('');
    setDescription('');
    setGeojsonFile(null);
    setGeojsonData(null);
    setLegendProp(null);
    setColorSettings({});
  }, [setHazardType, setDescription, setGeojsonFile, setLegendProp, setColorSettings]);

  const handleSave = async () => {
    try {
      await handleUploadAndSave(legendProp, colorSettings);
      resetForm();
      toast.success('Hazard layer saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving hazard layer:', error);
      toast.error('Failed to save hazard layer.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (mapRef.current && geojsonData) {
      let bounds = null;

      if (geojsonLayer) {
        bounds = geojsonLayer.getBounds();
      }

      if (boundaryLayer) {
        bounds = bounds ? bounds.extend(boundaryLayer.getBounds()) : boundaryLayer.getBounds();
      }

      if (bounds?.isValid()) {
        mapRef.current.fitBounds(bounds);
      } else {
        mapRef.current.setView(defaultCenter || [14.5995, 120.9842], 12);
      }
    }
  }, [geojsonLayer, boundaryLayer, defaultCenter, geojsonData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Close modal"
        >
          <FiX size={18} />
        </button>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              Hazard Layer Upload
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              GeoJSON Overlay
            </span>
          </div>

          <h2 className="mt-3 text-xl font-bold text-slate-800">Add Hazard Layer</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload a GeoJSON file, preview its map layer, choose the legend property,
            and define hazard colors before saving.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 px-6 py-5 xl:grid-cols-[380px_1fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Hazard Details</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Hazard Type
                  </label>
                  <select
                    value={hazardType}
                    onChange={(e) => setHazardType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Select a hazard type</option>
                    {hazardTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter hazard description..."
                    className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">GeoJSON Upload</h3>

              <label
                htmlFor="hazardGeojsonUpload"
                className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50"
              >
                <FiUploadCloud className="mb-2 text-4xl text-emerald-600" />
                <p className="font-medium text-slate-700">
                  {geojsonFile ? geojsonFile.name : 'Click to upload GeoJSON file'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Accepted: .geojson or application/geo+json
                </p>
                {geojsonFile && (
                  <p className="mt-2 text-xs text-slate-400">
                    File size: {(geojsonFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}

                <input
                  id="hazardGeojsonUpload"
                  type="file"
                  accept=".geojson,application/geo+json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('File size exceeds 10MB limit.');
                      setGeojsonFile(null);
                      setGeojsonData(null);
                      setLegendProp(null);
                      setColorSettings({});
                      return;
                    }

                    setGeojsonFile(file);

                    try {
                      const content = await file.text();
                      let geojson;

                      try {
                        geojson = JSON.parse(content);
                      } catch {
                        throw new Error('Invalid JSON format');
                      }

                      if (
                        !geojson.type ||
                        (geojson.type !== 'FeatureCollection' &&
                          geojson.type !== 'Feature')
                      ) {
                        throw new Error(
                          'Invalid GeoJSON structure: must be a Feature or FeatureCollection'
                        );
                      }

                      if (
                        geojson.type === 'FeatureCollection' &&
                        (!geojson.features || !Array.isArray(geojson.features))
                      ) {
                        throw new Error(
                          'Invalid GeoJSON: FeatureCollection must have a features array'
                        );
                      }

                      geojson = reprojectGeoJSON(geojson);
                      setGeojsonData(geojson);

                      const detected = detectLegendProperty(geojson);
                      setLegendProp(detected);
                      setColorSettings(initializeColorSettings(geojson, detected));
                    } catch (error) {
                      console.error('Invalid GeoJSON file:', error);
                      setGeojsonFile(null);
                      setGeojsonData(null);
                      setLegendProp(null);
                      setColorSettings({});
                      toast.error(`Invalid GeoJSON file: ${error.message || 'Unknown error'}`);
                    }
                  }}
                />
              </label>
            </section>

            {geojsonData?.features?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-800">Legend Settings</h3>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Legend Property
                    </label>
                    <select
                      value={legendProp?.key || ''}
                      onChange={(e) => {
                        const nextLegendProp = {
                          key: e.target.value,
                          type:
                            e.target.value &&
                              typeof geojsonData.features[0].properties[e.target.value] === 'number'
                              ? 'numeric'
                              : 'categorical',
                        };

                        setLegendProp(nextLegendProp);
                        setColorSettings(
                          initializeColorSettings(geojsonData, nextLegendProp)
                        );
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Auto-detect</option>
                      {Object.keys(geojsonData.features[0].properties || {}).map((prop) => (
                        <option key={prop} value={prop}>
                          {prop}
                        </option>
                      ))}
                    </select>
                  </div>

                  {legendProp?.type === 'categorical' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Category Colors
                      </label>
                      <div className="space-y-2">
                        {[...new Set(geojsonData.features.map((f) => f.properties[legendProp.key]))].map(
                          (value, index) => (
                            <div
                              key={`${value}-${index}`}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                            >
                              <span className="text-sm text-slate-700">{String(value)}</span>
                              <input
                                type="color"
                                value={colorSettings[value] || '#3388ff'}
                                onChange={(e) =>
                                  setColorSettings((prev) => ({
                                    ...prev,
                                    [value]: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {legendProp?.type === 'numeric' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Gradient Colors
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <div className="mb-2 text-sm text-slate-600">Minimum</div>
                          <input
                            type="color"
                            value={colorSettings.min || '#00ff00'}
                            onChange={(e) =>
                              setColorSettings((prev) => ({
                                ...prev,
                                min: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <div className="mb-2 text-sm text-slate-600">Maximum</div>
                          <input
                            type="color"
                            value={colorSettings.max || '#ff0000'}
                            onChange={(e) =>
                              setColorSettings((prev) => ({
                                ...prev,
                                max: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <FiMap className="text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-800">Map Preview</h3>
              </div>

              <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {geojsonData ? (
                  <MapContainer
                    center={defaultCenter}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    whenCreated={(mapInstance) => {
                      mapRef.current = mapInstance;
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />

                    {boundaryGeoJSON && (
                      <GeoJSON
                        data={boundaryGeoJSON}
                        style={{
                          color: 'black',
                          weight: 1,
                          fillOpacity: 0,
                          dashArray: '2 4',
                        }}
                      />
                    )}

                    <GeoJSON
                      key={`${geojsonData.features.length}-${legendProp?.key}-${JSON.stringify(colorSettings)}`}
                      data={geojsonData}
                      style={(feature) => ({
                        fillColor: legendProp
                          ? getColorScale(geojsonData, legendProp, colorSettings)(
                            feature.properties[legendProp.key]
                          )
                          : '#3388ff',
                        weight: 2,
                        opacity: 1,
                        color: 'transparent',
                        fillOpacity: 0.7,
                      })}
                    />
                  </MapContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                    Upload a GeoJSON file to preview the hazard layer on the map.
                  </div>
                )}
              </div>
            </section>

            {legendProp && geojsonData && (
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FiDroplet className="text-emerald-700" />
                  <h3 className="text-sm font-semibold text-slate-800">
                    Legend Preview
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-sm text-slate-500">
                    Based on: <span className="font-medium text-slate-700">{legendProp.key}</span>
                  </p>

                  <div className="space-y-2">
                    {getLegendItems(geojsonData, legendProp, colorSettings).map((item, index) => (
                      <div key={`${item.value}-${index}`} className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-sm border border-slate-200"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-700">{String(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </button>

          <button
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSave}
            disabled={
              loadingUpload ||
              !hazardType ||
              !description ||
              !geojsonFile ||
              !geojsonData
            }
          >
            {loadingUpload ? 'Uploading...' : 'Save Hazard Layer'}
          </button>
        </div>
      </div>
    </div>
  );
}

AddHazardModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  hazardType: PropTypes.string.isRequired,
  setHazardType: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  setDescription: PropTypes.func.isRequired,
  geojsonFile: PropTypes.instanceOf(File),
  setGeojsonFile: PropTypes.func.isRequired,
  legendProp: PropTypes.shape({
    key: PropTypes.string,
    type: PropTypes.oneOf(['numeric', 'categorical']),
  }),
  setLegendProp: PropTypes.func.isRequired,
  colorSettings: PropTypes.object.isRequired,
  setColorSettings: PropTypes.func.isRequired,
  handleUploadAndSave: PropTypes.func.isRequired,
  loadingUpload: PropTypes.bool.isRequired,
};