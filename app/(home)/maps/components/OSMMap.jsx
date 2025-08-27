'use client';

import AccidentMapForm from './accidentMapForm';
import { formatSusceptibility } from '@/components/susceptibility';
import { auth, db, storage } from '@/firebase/config';
import { capitalizeWords } from '@/utils/capitalize';
import * as turf from '@turf/turf';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import {
    CircleMarker,
    GeoJSON,
    LayersControl,
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    Tooltip
} from 'react-leaflet';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AccidentHeatmap from './AccidentHeatmap';
import MapClickHandler from './MapClickHandler';
import MapWithHazards from './MapWithHazards';
import { groupNearbyAccidents } from './utils/groupNearbyAccidents';
import { accidentIcon, affectedIcon, houseIcon, plusMarkerIcon } from './utils/icons';

const { BaseLayer } = LayersControl;
const defaultPosition = [9.941975, 124.033194]; // Default map center

export default function OSMMapPage() {
  const [activeMap, setActiveMap] = useState('Household Map');
  const [activeHazard, setActiveHazard] = useState('');
  const [householdMarkers, setHouseholdMarkers] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [addingAccident, setAddingAccident] = useState(false);
  const [loading, setLoading] = useState(false);
  const [affectedHouseholds, setAffectedHouseholds] = useState([]);
  const [hazardGeoJSON, setHazardGeoJSON] = useState({});
  const [profile, setProfile] = useState(null);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [defaultCenter, setDefaultCenter] = useState(defaultPosition);
  const [settingDefault, setSettingDefault] = useState(false);
  const [plusMarkers, setPlusMarkers] = useState([]);
  const [geojsonFile, setGeojsonFile] = useState(null);
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mapRef = useRef(null);
  const router = useRouter();

  const isHouseholdMap = activeMap === 'Household Map';
  const isAccidentMap = activeMap === 'Accident Map';
  const isMDRRMCAdmin = profile?.role === 'MDRRMC-Admin';

  // =============================
  // FETCH DEFAULT MAP CENTER
  // =============================
  const fetchDefaultCenter = useCallback(() => {
    try {
      const docRef = doc(db, "settings", "mapCenter");

      // Listen for real-time updates
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.lat && data.lng) {
              setDefaultCenter([data.lat, data.lng]);
            }
          }
        },
        (error) => {
          console.error("Error fetching default center:", error);
        }
      );

      // Return unsubscribe to clean up
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up snapshot listener:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = fetchDefaultCenter();
    return () => unsubscribe && unsubscribe();
  }, [fetchDefaultCenter]);

  // =============================
  // AUTH STATE LISTENER + PROFILE FETCH
  // =============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        setProfile(docSnap.exists() ? docSnap.data() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // =============================
  // REDIRECT IF NO PROFILE OR ROLE
  // =============================
  useEffect(() => {
    if (profile === null) return; // Still loading
    if (!profile || !profile.role) {
      router.push('/unauthorized');
    }
  }, [profile, router]);

  // =============================
  // FETCH BOUNDARY GEOJSON
  // =============================
  useEffect(() => {
    const fetchBoundary = async () => {
      try {
        const docRef = doc(db, 'settings', 'boundaryFile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const geojsonString = docSnap.data().data;
          const data = JSON.parse(geojsonString);
          setBoundaryGeoJSON(data);
          if (mapRef.current) {
            const leafletGeoJSON = L.geoJSON(data);
            mapRef.current.fitBounds(leafletGeoJSON.getBounds());
          }
        }
      } catch (err) {
        console.error('Failed to fetch GeoJSON from Firestore:', err);
      }
    };
    fetchBoundary();
  }, []);

  // =============================
  // HANDLE GEOJSON UPLOAD
  // =============================
  const handleFileUpload = async () => {
    if (!geojsonFile) return toast.error('Please select a GeoJSON file');
    setLoading(true);

    if (!geojsonFile.name.endsWith('.geojson')) {
      toast.error('Please upload a valid .geojson file');
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const geojson = JSON.parse(event.target.result);
        if (!geojson.type || (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature')) {
          throw new Error('Invalid GeoJSON structure');
        }

        setBoundaryGeoJSON(geojson);
        if (mapRef.current) {
          const leafletGeoJSON = L.geoJSON(geojson);
          mapRef.current.fitBounds(leafletGeoJSON.getBounds());
        }

        const storageRef = ref(storage, `boundary/${geojsonFile.name}`);
        const blob = new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' });
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        await setDoc(doc(db, 'settings', 'boundaryFile'), {
          name: geojsonFile.name,
          data: JSON.stringify(geojson),
          url: downloadURL,
          uploadedAt: new Date(),
        });

        toast.success('GeoJSON uploaded and map updated!');
        setIsUploadModalOpen(false);
        setGeojsonFile(null);
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload GeoJSON');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(geojsonFile);
  };

  // =============================
  // FETCH HOUSEHOLD LOCATIONS
  // =============================
  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'households'));
        const promises = snapshot.docs.map(async (doc) => {
          const geoSnap = await getDocs(
            collection(db, 'households', doc.id, 'geographicIdentification')
          );
  
          return Promise.all(
            geoSnap.docs.map(async (geoDoc) => {
              const data = geoDoc.data();
              const lat = Number(data.latitude);
              const lng = Number(data.longitude);
  
              // Capitalize head's full name
              const headFullName = capitalizeWords(
                `${data.headFirstName || ''} ${data.headLastName || ''}`.trim()
              );
  
              if (!isNaN(lat) && !isNaN(lng)) {
                const membersSnap = await getDocs(
                  collection(db, 'households', doc.id, 'members')
                );
  
                // Capitalize member names
                const memberNames = membersSnap.docs
                  .map(m => capitalizeWords(`${m.data().firstName || ''} ${m.data().lastName || ''}`.trim()))
                  .filter(name => name && name !== headFullName);
  
                return {
                  id: `${doc.id}_${geoDoc.id}`,
                  name: headFullName,
                  lat,
                  lng,
                  barangay: data.barangay || 'N/A',
                  contactNumber: data.contactNumber || 'N/A',
                  members: memberNames
                };
              }
  
              return null;
            })
          );
        });
  
        const results = await Promise.all(promises);
        setHouseholdMarkers(results.flat().filter(Boolean));
      } catch (err) {
        console.error(err);
      }
    };
  
    fetchHouseholds();
  }, []);
  

  // =============================
  // FETCH ACCIDENTS
  // =============================
  useEffect(() => {
    const fetchAccidents = async () => {
      const snapshot = await getDocs(collection(db, 'accidents'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccidents(data);
    };
    fetchAccidents();
  }, []);

  const handleAccidentSubmit = (data) => {
    setAccidents(prev => [...prev, data]);
    setAddingAccident(false);
  };

  // =============================
  // HAZARD GEOJSON → AFFECTED HOUSEHOLDS
  // =============================
  useEffect(() => {
    window.setHazardGeoJSON = (geojson) => {
      if (!geojson?.features?.length) return;
      setHazardGeoJSON(geojson);
  
      const affected = householdMarkers.filter(house => {
        if (typeof house.lng !== 'number' || typeof house.lat !== 'number') return false;
  
        const point = turf.point([house.lng, house.lat]);
  
        return geojson.features.some(
          feature => feature?.geometry?.coordinates?.length && turf.booleanPointInPolygon(point, feature)
        );
      });
  
      setAffectedHouseholds(affected);
    };
  }, [householdMarkers]);
  
  // =============================
  // DETERMINE SUSCEPTIBILITY FOR AFFECTED HOUSEHOLDS
  // =============================
  useEffect(() => {
    if (!hazardGeoJSON?.features?.length || householdMarkers.length === 0) return;
  
    const affected = householdMarkers
      .map(house => {
        if (typeof house.lng !== 'number' || typeof house.lat !== 'number') return null;
  
        const point = turf.point([house.lng, house.lat]);
  
        const matchingFeature = hazardGeoJSON.features.find(
          feature => feature?.geometry?.coordinates?.length && turf.booleanPointInPolygon(point, feature)
        );
  
        if (matchingFeature) {
          const susceptibility =
            matchingFeature.properties?.Susciptibi ||
            matchingFeature.properties?.susceptibility ||
            matchingFeature.properties?.Susceptibility ||
            'Unknown';
  
          return {
            ...house,
            susceptibility,
          };
        }
  
        return null; // not affected
      })
      .filter(Boolean);
  
    setAffectedHouseholds(affected);
  }, [hazardGeoJSON, householdMarkers]);
  

  // =============================
  // 🧹 CLEAR DATA IF HAZARD CLEARED
  // =============================
  useEffect(() => {
    if (!activeHazard) {
      // Clear hazard data safely
      setHazardGeoJSON(null);
      setAffectedHouseholds([]);
    }
  }, [activeHazard]);

  const clustered = groupNearbyAccidents(accidents, 50);
  const MAX_ACCIDENTS = 5;
  const accidentHeatPoints = clustered
    .filter(c => c.count >= 2)
    .map(c => [c.lat, c.lng, Math.min(c.count / MAX_ACCIDENTS, 1)]);

  // =============================
  // LOADING SCREEN
  // =============================
  if (profile === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-green-600 mb-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-gray-700 font-medium">Loading maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {profile?.role !== 'MDRRMC-Admin' && (
        <div className="mb-4 flex gap-3 z-30 relative">
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
      )}

      {/* Map Controls */}
      {isMDRRMCAdmin && (
        <div className="leaflet-top leaflet-left ml-60">
          <div className="leaflet-control leaflet-bar bg-white shadow rounded p-2 space-y-2">
            <button
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full cursor-pointer"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Set New Boundary
            </button>
          </div>
        </div>
      )}
      {/* ========================= */}
      {/* MAP CONTAINER */}
      {/* ========================= */}
      <MapContainer
        key={profile?.role}
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom
        style={{
          height: profile?.role === 'MDRRMC-Admin' ? '810px' : '750px',
          width: '100%',
          cursor: 'pointer',
          borderRadius: '8px',
        }}
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
      >
        {/* Layers */}
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

        {/* Render uploaded GeoJSON */}
        {boundaryGeoJSON && (
          <GeoJSON
            key={JSON.stringify(boundaryGeoJSON)}
            data={boundaryGeoJSON}
            style={{
              color: 'black',
              weight: 1,
              fillOpacity: 0,
              dashArray: '2 4'
            }}
            onEachFeature={(feature, layer) => {
              if (feature.properties?.name) {
                layer.bindPopup(feature.properties.name);
              }
            }}
          />
        )}

        
        {/* Map click handler (for admin default center) */}
        {isMDRRMCAdmin && <MapClickHandler settingDefault={settingDefault} setPlusMarkers={setPlusMarkers} setDefaultCenter={setDefaultCenter} setSettingDefault={setSettingDefault} />}

        {/* Plus markers */}
        {plusMarkers.map((marker, idx) => (
          <Marker key={idx} position={[marker.lat, marker.lng]} icon={plusMarkerIcon} />
        ))}
        {isMDRRMCAdmin && ( <div className="leaflet-top leaflet-left ml-10"> <div className="leaflet-control leaflet-bar bg-white shadow rounded p-2 space-y-2"> {/* Set New Default Center */} <button onClick={() => { setSettingDefault(true); alert('Click on the map to set a new default center.'); }} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full cursor-pointer" > Set New Default Center </button> </div> </div> )}

        {/* ========================= */}
        {/* HAZARD SELECT (for non-admin) */}
        {/* ========================= */}
        {isHouseholdMap && !isMDRRMCAdmin && (
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

        {isAccidentMap && !isMDRRMCAdmin && (
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

        {isHouseholdMap && !isMDRRMCAdmin &&
        householdMarkers.map((marker) => {
          const isAffected = affectedHouseholds.some(h => h.id === marker.id);
          const iconToUse = isAffected ? affectedIcon : houseIcon;

          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={iconToUse}
              eventHandlers={{
                mouseover: (e) => e.target.openPopup(),
                mouseout: (e) => e.target.closePopup(),
                click: () => {
                  setSelectedHousehold(marker); // pass the marker data
                  setIsModalOpen(true);         // open modal
                }
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
          );
        })}


        {isAccidentMap && addingAccident && !isMDRRMCAdmin && (
          <AccidentMapForm onSubmit={handleAccidentSubmit} />
        )}

        {isAccidentMap && !isMDRRMCAdmin &&
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
                <div className="text-sm">
                  {/* ✅ Display accident image if available */}
                  {acc.imageUrl && (
                    <div className="mt-2 flex justify-center">
                      <img
                        src={acc.imageUrl}
                        alt="Accident"
                        width={160}
                        height={112}
                        className="w-40 h-28 object-cover rounded-md border"
                      />
                    </div>
                  )}
                  <p><strong>Type:</strong> {acc.type}</p>
                  <p><strong>Severity:</strong> {acc.severity}</p>
                  <p><strong>Description:</strong> {acc.description}</p>
                  <p><strong>Date & Time:</strong> {acc.datetime}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        {isHouseholdMap && activeHazard && !isMDRRMCAdmin && (
          <MapWithHazards activeHazard={activeHazard} setLoading={setLoading} />
        )}

        {isAccidentMap && !isMDRRMCAdmin &&(
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

        {isHouseholdMap && affectedHouseholds.length > 0 && !isMDRRMCAdmin && (
          <div className="absolute bottom-4 left-4 z-[1000] p-4 bg-white  rounded shadow max-h-[300px] overflow-auto w-[90vw] max-w-sm sm:max-w-md text-sm">
            <h3 className="font-semibold mb-2 text-lg">
              Affected Households ({affectedHouseholds.length})
            </h3>
            {activeHazard && (
              <p className="text-sm text-gray-600 mb-2">
                💡 Hazard: <strong>{activeHazard}</strong>
              </p>
              
            )}
            <ul className="list-disc ml-5">
              {affectedHouseholds.map((h) => (
                <li key={h.id} className="mb-2">
                  <strong>{h.name || 'Unnamed'}</strong><br />
                  📍 Barangay: {h.barangay || 'N/A'}<br />
                  📞 Contact: {h.contactNumber || 'N/A'}<br />
                  🌐 Location: Lat: {h.lat}, Lng: {h.lng}<br />
                  🌋Susceptibility: {formatSusceptibility(h.susceptibility)}
                </li>
              ))}
            </ul>
          </div>
        )}
        

      </MapContainer>

      {isModalOpen && selectedHousehold && !isMDRRMCAdmin && (
        <div className="fixed inset-0 flex items-center justify-center z-10000">
          <div className="bg-white p-4 rounded shadow-lg w-80 relative border border-gray-200">
            {/* Close icon button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
            >
              <FiX className="text-xl" />
            </button>

            <p className="mb-1 font-semibold text-center">
              {selectedHousehold.name || 'Unnamed Household'}&apos;s Residence
            </p>
            <p className="mb-2 text-sm text-center text-gray-700">
              Contact Number: {selectedHousehold.contactNumber || 'N/A'}
            </p>

            <div className="text-sm text-gray-800 ml-9">
              <strong>Members:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                {selectedHousehold.members?.length > 0 ? (
                  selectedHousehold.members.map((member, index) => (
                    <li key={index}>{member}</li>
                  ))
                ) : (
                  <li>No members listed</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && isMDRRMCAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Upload GeoJSON Boundary
            </h2>

            {/* Upload Area */}
            <label
              htmlFor="geojsonUpload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <FiUploadCloud className="text-5xl text-green-500 mb-3" />
              <p className="text-gray-700 font-medium">
                {geojsonFile ? geojsonFile.name : 'Click to upload GeoJSON file'}
              </p>
              <input
                id="geojsonUpload"
                type="file"
                accept=".geojson,application/geo+json"
                onChange={(e) => setGeojsonFile(e.target.files[0])}
                className="hidden"
              />
            </label>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handleFileUpload}
              >
                Save
              </button>
            </div>

            {/* Loading Spinner */}
            {loading && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-2xl z-50">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
