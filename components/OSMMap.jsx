'use client';

import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import AccidentMapForm from '@/components/accidentMap';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

const houseIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7720/7720546.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const accidentIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const { BaseLayer } = LayersControl;
const defaultPosition = [9.9611, 124.0247];

export default function MapPage() {
  const [activeMap, setActiveMap] = useState('Household Map');
  const [activeHazard, setActiveHazard] = useState('');
  const [householdMarkers, setHouseholdMarkers] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [addingAccident, setAddingAccident] = useState(false);

  const isHouseholdMap = activeMap === 'Household Map';
  const isAccidentMap = activeMap === 'Accident Map';

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

  return (
    <div className="p-4 relative">
      <div className="mb-4 flex gap-2 z-30 relative">
        {['Household Map', 'Accident Map'].map((option) => (
          <button
            key={option}
            onClick={() => {
              setActiveMap(option);
              setActiveHazard('');
              setAddingAccident(false);
            }}
            className={`px-4 py-2 rounded ${
              activeMap === option
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-green-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <MapContainer
        center={defaultPosition}
        zoom={16}
        scrollWheelZoom
        style={{ height: '700px', width: '100%' }}
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
              attribution="Tiles &copy; Esri, Maxar, Earthstar Geographics"
            />
          </BaseLayer>
        </LayersControl>

        {/* Hazards Dropdown */}
        {isHouseholdMap && (
          <div className="leaflet-top leaflet-left ml-10">
            <div className="leaflet-control leaflet-bar bg-white shadow rounded mt-2 ml-2 p-2">
              <label className="text-sm font-medium block mb-1">Hazards</label>
              <select
                className="text-sm border rounded p-1"
                value={activeHazard}
                onChange={(e) => setActiveHazard(e.target.value)}
              >
                <option value="">None</option>
                <option value="Earthquake">Earthquake</option>
                <option value="Landslide">Landslide</option>
                <option value="Ground Shaking">Ground Shaking</option>
                <option value="Tsunami">Tsunami</option>
              </select>
            </div>
          </div>
        )}

        {/* Add Accident Button */}
        {isAccidentMap && (
          <div className="leaflet-top leaflet-left ml-10">
            <div className="leaflet-control leaflet-bar bg-white shadow rounded mt-2 ml-2 p-2">
              <button
                onClick={() => setAddingAccident((prev) => !prev)}
                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full"
              >
                {addingAccident ? 'Cancel' : 'Add Accident'}
              </button>
            </div>
          </div>
        )}

        {/* Household Markers */}
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

        {/* Accident Form */}
        {isAccidentMap && addingAccident && <AccidentMapForm onSubmit={handleAccidentSubmit} />}

        {/* Accident Markers */}
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

        {/* Hazard Markers */}
        {isHouseholdMap && activeHazard === 'Earthquake' && (
          <Marker position={[9.9615, 124.025]}>
            <Popup>🌋 Earthquake Zone</Popup>
          </Marker>
        )}
        {isHouseholdMap && activeHazard === 'Landslide' && (
          <Marker position={[9.9605, 124.026]}>
            <Popup>⛰️ Landslide Risk Area</Popup>
          </Marker>
        )}
        {isHouseholdMap && activeHazard === 'Ground Shaking' && (
          <Marker position={[9.9595, 124.027]}>
            <Popup>💥 Ground Shaking Zone</Popup>
          </Marker>
        )}
        {isHouseholdMap && activeHazard === 'Tsunami' && (
          <Marker position={[9.9625, 124.023]}>
            <Popup>🌊 Tsunami Alert Zone</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
