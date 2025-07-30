'use client';

import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  GeoJSON,
  useMap,
  CircleMarker,
  Tooltip
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { getDistance } from 'geolib';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import AccidentMapForm from '@/components/accidentMapForm';
import HazardLayers from '@/components/hazards/hazardLayers';

// ✅ Heatmap Component
function AccidentHeatmap({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      gradient: {
        0.4: 'green',   // ~2 accidents
        0.6: 'yellow',  // ~3–4 accidents
        0.9: 'red'      // 5 or more accidents
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

// ✅ Move MapWithHazards OUTSIDE of MapPage
function MapWithHazards({ activeHazard, setLoading }) {
  const map = useMap();
  return <HazardLayers activeHazard={activeHazard} map={map} setLoading={setLoading} />;
}

// Override Leaflet default icon configuration
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

// Custom icons
const houseIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7720/7720546.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32]
});
const accidentIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32]
});

const { BaseLayer } = LayersControl;
const defaultPosition = [9.941975, 124.033194]; // Default map center



export default function MapPage() {
  const [activeMap, setActiveMap] = useState('Household Map');
  const [activeHazard, setActiveHazard] = useState('');
  const [householdMarkers, setHouseholdMarkers] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [addingAccident, setAddingAccident] = useState(false);
  const [clarinBoundary, setClarinBoundary] = useState(null);
  const [loading, setLoading] = useState(false);
  const isHouseholdMap = activeMap === 'Household Map';
  const isAccidentMap = activeMap === 'Accident Map';

  useEffect(() => {
    fetch('/data/map.geojson')
      .then((res) => res.json())
      .then((data) => setClarinBoundary(data))
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  }, []);

  useEffect(() => {
    const fetchHouseholds = async () => {
      const snapshot = await getDocs(collection(db, 'households'));
      const locations = [];

      for (const doc of snapshot.docs) {
        const geoSnap = await getDocs(
          collection(db, 'households', doc.id, 'geographicIdentification')
        );
        geoSnap.forEach((geoDoc) => {
          const data = geoDoc.data();
          const lat = Number(data.latitude);
          const lng = Number(data.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            locations.push({
              id: `${doc.id}_${geoDoc.id}`,
              name: `${data.headFirstName || ''} ${data.headLastName || ''}`.trim(),
              lat,
              lng,
            });
          }
        });
      }

      setHouseholdMarkers(locations);
    };

    fetchHouseholds();
  }, []);

  useEffect(() => {
    const fetchAccidents = async () => {
      const snapshot = await getDocs(collection(db, 'accidents'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccidents(data);
    };

    fetchAccidents();
  }, []);

  const handleAccidentSubmit = (data) => {
    setAccidents((prev) => [...prev, data]);
    setAddingAccident(false);
  };

  // ✅ Group nearby accidents (within 50m) and show heatmap only for groups with ≥3
  function groupNearbyAccidents(accidents, radius = 50) {
    const clusters = [];

    accidents.forEach(acc => {
      const { position } = acc;
      if (!position) return;

      // ✅ Handle both [lat, lng] and { lat: ..., lng: ... }
      const [lat, lng] = Array.isArray(position)
        ? position
        : [position.lat, position.lng];

      if (!lat || !lng) return;

      let added = false;

      for (const cluster of clusters) {
        const distance = getDistance(
          { latitude: lat, longitude: lng },
          { latitude: cluster.lat, longitude: cluster.lng }
        );

        if (distance <= radius) {
          cluster.count += 1;
          cluster.accidents.push(acc);
          added = true;
          break;
        }
      }

      if (!added) {
        clusters.push({
          lat,
          lng,
          count: 1,
          accidents: [acc],
        });
      }
    });

    return clusters;
  }
  const clustered = groupNearbyAccidents(accidents, 50); // 50m radius

  const MAX_ACCIDENTS = 5;

  const accidentHeatPoints = clustered
    .filter(c => c.count >= 2) // include from 2 and up
    .map(c => {
      const intensity = Math.min(c.count / MAX_ACCIDENTS, 1); // normalize 0–1
      return [c.lat, c.lng, intensity];
    });


  return (
    <div className="relative">
      <div className="mb-4 flex gap-3 z-30 relative ">
        {['Household Map', 'Accident Map'].map((option) => (
          <button
            key={option}
            onClick={() => {
              setActiveMap(option);
              setActiveHazard('');
              setAddingAccident(false);
            }}
            className={`px-4 py-2 rounded cursor-pointer ${
              activeMap === option
                ? 'bg-green-600 text-white font-bold'
                : 'bg-gray-300 text-gray-800 hover:bg-green-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <MapContainer
        center={defaultPosition}
        zoom={13}
        scrollWheelZoom
        style={{
          height: '750px',
          width: '100%',
          cursor: 'pointer',
          borderRadius: '8px'
        }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          </BaseLayer>
          <BaseLayer name="Satellite (Esri)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="© Esri, Maxar, Earthstar Geographics"
            />
          </BaseLayer>
        </LayersControl>

        {clarinBoundary && (
          <GeoJSON
            data={clarinBoundary}
            style={{
              color: 'black',
              weight: 1,
              fillOpacity: 0.5,
              dashArray: '2 4',
            }}
          />
        )}

        {isHouseholdMap && (
          <div className="leaflet-top leaflet-left ml-10">
            <div className="leaflet-control leaflet-bar bg-white shadow rounded mt-2 ml-2 p-2">
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="hazard-select" className="text-sm font-medium">
                  Hazards
                </label>
                {loading && (
                  <div className="absolute top-2 right-2 z-50">
                    <svg className="animate-spin h-4 w-4 text-green-800" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <select
                id="hazard-select"
                className="text-sm border rounded p-1 cursor-pointer focus:outline-none w-full"
                value={activeHazard}
                onChange={(e) => {
                  setActiveHazard(e.target.value);
                }}
              >
                <option value="">Select Hazard</option>
                <option value="Active Faults">Active Faults Susceptibility Map</option>
                <option value="Liquefaction">Liquefaction Susceptibility Map</option>
                <option value="Rain Induced Landslide">Rain Induced Landslide Susceptibility Map</option>
                <option value="Earthquake Induced Landslide">Earthquake Induced Landslide Susceptibility Map</option>
                <option value="Ground Shaking">Ground Shaking Susceptibility Map</option>
                <option value="Storm Surge">Storm Surge Susceptibility Map</option>
                <option value="Tsunami">Tsunami Susceptibility Map</option>
                <option value="Landslide">Landslide Susceptibility Map</option>
              </select>
            </div>
          </div>
        )}

        {isAccidentMap && (
          <div className="leaflet-top leaflet-left ml-10">
            <div className="leaflet-control leaflet-bar bg-white shadow rounded mt-2 ml-2 p-2">
              <button
                onClick={() => setAddingAccident((prev) => !prev)}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full cursor-pointer"
              >
                {addingAccident ? 'Cancel' : 'Add Accident'}
              </button>
            </div>
          </div>
        )}

        {isHouseholdMap &&
          householdMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={houseIcon}
              eventHandlers={{
                mouseover: (e) => e.target.openPopup(),
                mouseout: (e) => e.target.closePopup(),
              }}
            >
              <Popup>
                <strong>
                  {marker.name ? `${marker.name} Residence` : 'Unnamed Residence'}
                </strong>
                <br />
                Lat: {marker.lat.toFixed(4)}, Lng: {marker.lng.toFixed(4)}
              </Popup>
            </Marker>
          ))}

        {isAccidentMap && addingAccident && <AccidentMapForm onSubmit={handleAccidentSubmit} />}

        {isAccidentMap &&
          accidents.map((acc, idx) => (
            <Marker
              key={acc.id || idx}
              position={acc.position}
              icon={accidentIcon}
              eventHandlers={{
                mouseover: (e) => e.target.openPopup(),
                mouseout: (e) => e.target.closePopup(),
              }}
            >
              <Popup>
                <strong>Type:</strong> {acc.type}<br />
                <strong>Severity:</strong> {acc.severity}<br />
                <strong>Description:</strong> {acc.description}<br />
                <strong>Date & Time:</strong> {acc.datetime}
              </Popup>
            </Marker>
          ))}

        {isHouseholdMap && activeHazard && (
          <MapWithHazards activeHazard={activeHazard} setLoading={setLoading} />
        )}

        {isAccidentMap && (
          <>
            {/* Accident Heatmap */}
            <AccidentHeatmap points={accidentHeatPoints} />

            {/* Cluster Labels */}
            {clustered
            .filter(c => c.count >= 2)
            .map((c, index) => (
              <CircleMarker
                key={`label-${index}`}
                center={[c.lat, c.lng]}
                radius={10}
                pathOptions={{
                  color: 'transparent',
                  fillOpacity: 0,
                }}
                eventHandlers={{
                  mouseover: (e) => {
                    e.target.openTooltip();
                  },
                  mouseout: (e) => {
                    e.target.closeTooltip();
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                  <div
                    style={{
                      background:
                        c.count >= 5
                          ? 'rgba(255,0,0,0.8)'
                          : c.count >= 3
                          ? 'rgba(255,255,0,0.8)'
                          : 'rgba(0,128,0,0.8)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: 'black',
                      border: '1px solid #222',
                      textAlign: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                      pointerEvents: 'auto',
                    }}
                  >
                    ⚠️ {c.count} Accident{c.count > 1 ? 's' : ''}
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}
