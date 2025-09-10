'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reprojectGeoJSON } from '@/utils/geoJsonProjection';
import { useMap } from '@/context/mapContext';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { useCallback } from 'react';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Detect legend property
const detectLegendProperty = (geojson) => {
  if (!geojson?.features?.length) return null;

  const allProps = geojson.features.reduce((acc, feature) => {
    const props = feature.properties || {};
    return { ...acc, ...props };
  }, {});

  const numeric = Object.keys(allProps).find((key) =>
    geojson.features.every(
      (f) => typeof f.properties[key] === 'number' && !isNaN(f.properties[key])
    )
  );
  if (numeric) return { key: numeric, type: 'numeric' };

  const categorical = Object.keys(allProps).find((key) =>
    geojson.features.every(
      (f) => typeof f.properties[key] === 'string' || typeof f.properties[key] === 'boolean'
    )
  );
  if (categorical) return { key: categorical, type: 'categorical' };

  return null;
};

// Color scale
const getColorScale = (geojson, legendProp, colorSettings) => {
  if (!legendProp || !geojson?.features?.length) return () => '#3388ff';

  const values = geojson.features
    .map((f) => f.properties[legendProp.key])
    .filter((v) => v !== undefined && v !== null);

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
  } else {
    return (value) => colorSettings[value] || '#3388ff';
  }
};

// Legend items
const getLegendItems = (geojson, legendProp, colorSettings) => {
  if (!legendProp || !geojson?.features?.length) return [];
  const values = geojson.features
    .map((f) => f.properties[legendProp.key])
    .filter((v) => v !== undefined && v !== null);

  if (legendProp.type === 'numeric') {
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    return uniqueValues.map((value) => ({
      value: value.toString(),
      color: getColorScale(geojson, legendProp, colorSettings)(value),
    }));
  } else {
    const uniqueValues = [...new Set(values)];
    return uniqueValues.map((value) => ({
      value,
      color: getColorScale(geojson, legendProp, colorSettings)(value),
    }));
  }
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

  const geojsonLayer = useMemo(() => (geojsonData ? L.geoJSON(geojsonData) : null), [geojsonData]);
  const boundaryLayer = useMemo(
    () => (boundaryGeoJSON ? L.geoJSON(boundaryGeoJSON) : null),
    [boundaryGeoJSON]
  );

  // Initialize color settings for categorical data
  const initializeColorSettings = (geojson, legendProp) => {
    if (!legendProp || !geojson?.features?.length) return {};
    if (legendProp.type === 'categorical') {
      const values = [...new Set(geojson.features.map((f) => f.properties[legendProp.key]))];
      const defaultColors = ['#3388ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
      const settings = {};
      values.forEach((val, index) => {
        settings[val] = defaultColors[index % defaultColors.length];
      });
      return settings;
    }
    return { min: '#00ff00', max: '#ff0000' };
  };

  // Reset form function
  const resetForm = useCallback(() => {
    setHazardType('');
    setDescription('');
    setGeojsonFile(null);
    setGeojsonData(null);
    setLegendProp(null);
    setColorSettings({});
  }, [setHazardType, setDescription, setGeojsonFile, setGeojsonData, setLegendProp, setColorSettings]);

  // Handle save and reset
  const handleSave = async () => {
    try {
      await handleUploadAndSave(legendProp, colorSettings);
      resetForm(); // Clear form after successful save
      toast.success('Hazard layer saved successfully!');
      onClose(); // Close modal after save
    } catch (err) {
      console.error('Error saving hazard layer:', err);
      toast.error('Failed to save hazard layer.');
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Update map bounds when geojsonData changes
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-gradient-to-t from-white to-green-50 rounded-2xl shadow-xl p-6 w-[90%] max-w-4xl overflow-y-auto max-h-[95vh]">
        <h2 className="text-xl font-bold mb-4 text-center">Add Hazard Layer</h2>

        <div className={geojsonData ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
          {/* Left Column: Form Inputs */}
          <div className="space-y-4">
            {/* Hazard Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Hazard Type</label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select type</option>
                <option value="Active Faults">Active Faults</option>
                <option value="Landslide">Landslide</option>
                <option value="Earthquake Induced Landslide">Earthquake Induced Landslide</option>
                <option value="Storm Surge">Storm Surge</option>
                <option value="Tsunami">Tsunami</option>
                <option value="Rain Induced Landslide">Rain Induced Landslide</option>
                <option value="Ground Shaking">Ground Shaking</option>
                <option value="Liquefaction">Liquefaction</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter hazard description..."
              />
            </div>

            {/* Upload */}
            <div>
              <label
                htmlFor="hazardGeojsonUpload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
                aria-label="Upload GeoJSON file"
              >
                <FiUploadCloud className="text-4xl text-green-600 mb-2" />
                <p className="text-gray-700 font-medium">
                  {geojsonFile ? geojsonFile.name : 'Click to upload GeoJSON file'}
                </p>
                {geojsonFile && (
                  <p className="text-sm text-gray-500 mt-2">
                    File size: {(geojsonFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
                <input
                  id="hazardGeojsonUpload"
                  type="file"
                  accept=".geojson,application/geo+json"
                  className="hidden"
                  aria-describedby="file-upload-description"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
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
                        } catch (parseError) {
                          throw new Error('Invalid JSON format');
                        }

                        if (!geojson.type || (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature')) {
                          throw new Error('Invalid GeoJSON structure: Must be a Feature or FeatureCollection');
                        }
                        if (geojson.type === 'FeatureCollection' && (!geojson.features || !Array.isArray(geojson.features))) {
                          throw new Error('Invalid GeoJSON: FeatureCollection must have a features array');
                        }

                        geojson = reprojectGeoJSON(geojson);
                        setGeojsonData(geojson);

                        const detected = detectLegendProperty(geojson);
                        setLegendProp(detected);
                        setColorSettings(initializeColorSettings(geojson, detected));
                      } catch (err) {
                        console.error('Invalid GeoJSON file:', err);
                        setGeojsonFile(null);
                        setGeojsonData(null);
                        setLegendProp(null);
                        setColorSettings({});
                        toast.error(`Invalid GeoJSON file: ${err.message || 'Unknown error'}`);
                      }
                    }
                  }}
                />
                <span id="file-upload-description" className="sr-only">
                  Upload a GeoJSON file to visualize hazard data on the map
                </span>
              </label>
            </div>
          </div>

          {/* Right Column: Map and Settings (visible after GeoJSON upload) */}
          {geojsonData && (
            <div className="space-y-4">
              {/* Map Preview */}
              <div>
                <label className="block text-sm font-medium mb-1">Map Preview</label>
                <div className="w-full h-64 border rounded">
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
                    {geojsonData && (
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
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Legend Property Selector */}
              {geojsonData.features?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Legend Property</label>
                  <select
                    value={legendProp?.key || ''}
                    onChange={(e) => {
                      const newProp = {
                        key: e.target.value,
                        type:
                          e.target.value &&
                          typeof geojsonData.features[0].properties[e.target.value] === 'number'
                            ? 'numeric'
                            : 'categorical',
                      };
                      setLegendProp(newProp);
                      setColorSettings(initializeColorSettings(geojsonData, newProp));
                    }}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Auto-detect</option>
                    {Object.keys(geojsonData.features[0].properties || {}).map((prop) => (
                      <option key={prop} value={prop}>
                        {prop}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Color Settings */}
              {legendProp && legendProp.type === 'categorical' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Set Colors for Values
                  </label>
                  <div className="space-y-2">
                    {[...new Set(geojsonData.features.map((f) => f.properties[legendProp.key]))].map(
                      (val, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={colorSettings[val] || '#3388ff'}
                            onChange={(e) =>
                              setColorSettings((prev) => ({ ...prev, [val]: e.target.value }))
                            }
                          />
                          <span>{val}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {legendProp && legendProp.type === 'numeric' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Set Gradient Colors
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span>Min</span>
                      <input
                        type="color"
                        value={colorSettings.min || '#00ff00'}
                        onChange={(e) =>
                          setColorSettings((prev) => ({ ...prev, min: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Max</span>
                      <input
                        type="color"
                        value={colorSettings.max || '#ff0000'}
                        onChange={(e) =>
                          setColorSettings((prev) => ({ ...prev, max: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Legend Preview */}
              {legendProp && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Legend (Based on: {legendProp.key})
                  </label>
                  <div className="border rounded p-2">
                    {getLegendItems(geojsonData, legendProp, colorSettings).map((item, idx) => (
                      <div key={idx} className="flex items-center mb-1">
                        <div
                          className="w-4 h-4 mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={() => {
              resetForm(); // Clear form when cancelling
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={loadingUpload || !hazardType || !description || !geojsonFile || !geojsonData}
          >
            {loadingUpload ? 'Uploading...' : 'Save'}
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