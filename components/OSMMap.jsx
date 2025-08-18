'use client';

import { useEffect, useState, useRef} from 'react';
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
import * as turf from '@turf/turf';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, storage } from '@/firebase/config';
import { ref, uploadBytes, getBytes, deleteObject, getDownloadURL } from "firebase/storage";
import AccidentMapForm from '@/components/accidentMapForm';
import HazardLayers from '@/components/hazards/hazardLayers';
import { formatSusceptibility } from '@/app/utils/susceptibility';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FiX, FiUploadCloud } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



// =============================
// HEATMAP COMPONENT
// Handles rendering of accident heatmap points
// =============================
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

// =============================
// MAP WITH HAZARDS COMPONENT
// Displays hazard layers based on active hazard type
// =============================
function MapWithHazards({ activeHazard, setLoading }) {
  const map = useMap();
  return <HazardLayers activeHazard={activeHazard} map={map} setLoading={setLoading} />;
}


// =============================
// LEAFLET ICON OVERRIDES
// Sets custom marker icons for households, accidents, affected areas, and plus marker
// =============================
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

const affectedIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4539/4539472.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32]
});

const plusMarkerIcon = L.divIcon({
  className: 'custom-plus-icon',
  html: '<div style="color: red; font-size: 24px;">➕</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});


const { BaseLayer } = LayersControl;
const defaultPosition = [9.941975, 124.033194]; // Default map center


// =============================
// MAIN MAP PAGE COMPONENT
// Handles households, accidents, hazard overlays, and admin tools
// =============================
export default function OSMMapPage() {
  const [activeMap, setActiveMap] = useState('Household Map');
  const [activeHazard, setActiveHazard] = useState('');
  const [householdMarkers, setHouseholdMarkers] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [addingAccident, setAddingAccident] = useState(false);
  const [clarinBoundary, setClarinBoundary] = useState(null);
  const [loading, setLoading] = useState(false);
  const isHouseholdMap = activeMap === 'Household Map';
  const isAccidentMap = activeMap === 'Accident Map';
  const [affectedHouseholds, setAffectedHouseholds] = useState([]);
  const [hazardGeoJSON, setHazardGeoJSON] = useState({});
  const [profile, setProfile] = useState(null);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [defaultCenter, setDefaultCenter] = useState(defaultPosition);
  const [settingDefault, setSettingDefault] = useState(false);
  const [plusMarkers, setPlusMarkers] = useState([]);
  const [geojsonFile, setGeojsonFile] = useState(null); // the raw File
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const mapRef = useRef(null);


  // --- Fetch GeoJSON from Firestore on load ---
  useEffect(() => {
    const fetchBoundary = async () => {
      try {
        const docRef = doc(db, 'settings', 'boundaryFile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const geojsonString = docSnap.data().data;
          const data = JSON.parse(geojsonString); // Parse string to object
          setBoundaryGeoJSON(data);

          // Zoom map to boundary
          if (mapRef.current && data) {
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

  // --- Handle GeoJSON upload ---
  const handleFileUpload = async () => {
    if (!geojsonFile) {
      toast.error('Please select a GeoJSON file');
      return;
    }
    setLoading(true);
  
    // ✅ Check file extension
    if (!geojsonFile.name.endsWith('.geojson')) {
      toast.error('Please upload a valid .geojson file');
      return;
    }
  
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const geojson = JSON.parse(event.target.result);
  
        if (!geojson.type || (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature')) {
          throw new Error('Invalid GeoJSON structure');
        }
  
        // Update map
        setBoundaryGeoJSON(geojson);
        if (mapRef.current) {
          const leafletGeoJSON = L.geoJSON(geojson);
          mapRef.current.fitBounds(leafletGeoJSON.getBounds());
        }
  
        // Upload to Firebase Storage
        const storageRef = ref(storage, `boundary/${geojsonFile.name}`);
        const blob = new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' });
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
  
        // Save metadata + GeoJSON string to Firestore
        await setDoc(doc(db, 'settings', 'boundaryFile'), {
          name: geojsonFile.name,
          data: JSON.stringify(geojson), // store as string
          url: downloadURL,
          uploadedAt: new Date(),
        });
  
        toast.success('GeoJSON uploaded and map updated!');
        setIsUploadModalOpen(false);
        setGeojsonFile(null); // reset file input
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload GeoJSON');
      } finally {
        // ✅ Stop loading only after everything is done
        setLoading(false);
      }
    };
  
    reader.readAsText(geojsonFile);
    
  };
  


  

  
  

  // =============================
  // MAP CLICK HANDLER FOR SETTING DEFAULT CENTER
  // =============================
  function MapClickHandler() {
    const map = useMap();
  
    useEffect(() => {
      const onClick = async (e) => {
        if (!settingDefault) return;
  
        const { lat, lng } = e.latlng;
  
        // Show marker + update center state
        setPlusMarkers([{ lat, lng }]);
        setDefaultCenter([lat, lng]);
        map.setView([lat, lng], map.getZoom());
  
        try {
          await setDoc(doc(db, "settings", "mapCenter"), { lat, lng });
  
          toast.success("New default center added successfully!", {
            position: "top-right",
            autoClose: 2000,
          });
  
          // ✅ Instead of reloading the page, just re-fetch Firestore data
          fetchMapCenter?.(); // optional: refetch in parent if you have this function
        } catch (err) {
          console.error("Error saving default center:", err);
          toast.error("Failed to save new default center.");
        }
  
        setSettingDefault(false);
      };
  
      map.on("click", onClick);
      return () => map.off("click", onClick);
    }, [map, settingDefault]);
  
    return null;
  }
  
  // =============================
  // FETCH DEFAULT MAP CENTER FROM FIRESTORE
  // =============================
  useEffect(() => {
    const fetchDefaultCenter = async () => {
      try {
        const docRef = doc(db, 'settings', 'mapCenter');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.lat && data.lng) {
            setDefaultCenter([data.lat, data.lng]);
          }
        }
      } catch (error) {
        console.error('Error fetching default center:', error);
      }
    };

    fetchDefaultCenter();
  }, []);

  // =============================
  // AUTH STATE LISTENER + PROFILE FETCH
  // =============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          setProfile(null); // Prevents hanging if user doc doesn't exist
        }
      } else {
        setProfile(null); // User signed out
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isSeniorAdmin = profile?.role === 'SeniorAdmin';

  // =============================
  // REDIRECT IF NO PROFILE OR ROLE
  // =============================
  useEffect(() => {
    if (profile === null) return; // Still loading
    if (!profile || !profile.role) {
      router.push('/unauthorized'); // No profile or role found
    }
  }, [profile]);

  // =============================
  // 🌍 FETCH CLARIN BOUNDARY GEOJSON
  // =============================
  // useEffect(() => {
  //   fetch('/data/Clarin_Boundary.geojson')
  //     .then((res) => res.json())
  //     .then((data) => setClarinBoundary(data))
  //     .catch((err) => console.error('Failed to load GeoJSON:', err));
  // }, []);

  // =============================
  // HAZARD LAYER → UPDATE AFFECTED HOUSEHOLDS
  // =============================
  useEffect(() => {
    window.setHazardGeoJSON = (geojson) => {
      if (!geojson || !geojson.features) return;
      setHazardGeoJSON(geojson);

      const affected = householdMarkers.filter(house => {
        const point = turf.point([house.lng, house.lat]);

        return geojson.features.some(feature =>
          turf.booleanPointInPolygon(point, feature)
        );
      });

      setAffectedHouseholds(affected);
    };
  }, [householdMarkers]);

  // =============================
  // DETERMINE SUSCEPTIBILITY FOR AFFECTED HOUSEHOLDS
  // =============================
  useEffect(() => {
    if (!hazardGeoJSON || householdMarkers.length === 0) return;

    const affected = householdMarkers
      .map((house) => {
        const point = turf.point([house.lng, house.lat]);

        const matchingFeature = hazardGeoJSON.features.find((feature) =>
          turf.booleanPointInPolygon(point, feature)
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
      setHazardGeoJSON(null);
      setAffectedHouseholds([]);
    }
  }, [activeHazard]);


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

              const headFullName = `${data.headFirstName || ''} ${data.headLastName || ''}`.trim();

              if (!isNaN(lat) && !isNaN(lng)) {
                // Fetch members under this household
                const membersSnap = await getDocs(
                  collection(db, 'households', doc.id, 'members')
                );

                const memberNames = membersSnap.docs
                  .map(memberDoc => {
                    const member = memberDoc.data();
                    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
                    return fullName;
                  })
                  .filter(fullName => fullName && fullName !== headFullName); // Exclude the head

                return {
                  id: `${doc.id}_${geoDoc.id}`,
                  name: headFullName,
                  lat,
                  lng,
                  barangay: data.barangay || 'N/A',
                  contactNumber: data.contactNumber || 'N/A',
                  members: memberNames,
                };
              }

              return null;
            })
          );
        });

        const results = await Promise.all(promises);
        const locations = results.flat().filter(Boolean);

        setHouseholdMarkers(locations);
      } catch (error) {
        console.error('Error fetching households:', error);
      }
    };

    fetchHouseholds();
  }, []);

  
  // =============================
  // FETCH ACCIDENT LOCATIONS
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
    setAccidents((prev) => [...prev, data]);
    setAddingAccident(false);
  };

  // =============================
  // GROUP NEARBY ACCIDENTS FOR HEATMAP
  // =============================
  function groupNearbyAccidents(accidents, radius = 50) {
    const clusters = [];

    accidents.forEach(acc => {
      const { position } = acc;
      if (!position) return;

      // Handle both [lat, lng] and { lat: ..., lng: ... }
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
    
  // =============================
  // LOADING SCREEN WHILE FETCHING PROFILE
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
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <p className="text-gray-700 font-medium">Loading maps...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="relative">
      {profile?.role !== 'SeniorAdmin' && (
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
      {isSeniorAdmin && (
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
        
      <MapContainer
        key={profile?.role} 
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom
        style={{
          height: profile?.role === 'SeniorAdmin' ? '810px' : '750px',
          width: '100%',
          cursor: 'pointer',
          borderRadius: '8px',
        }}
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
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

        {/* {clarinBoundary && profile?.role !== 'SeniorAdmin' && (
          <GeoJSON
            data={clarinBoundary}
            style={{
                  color: 'black',        
                  weight: 1,             
                  fillOpacity: 0,
                  dashArray: '2 4',        
                }}
          />
        )} */}

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

        
        {isSeniorAdmin && <MapClickHandler />}

        {/* Render plus markers */}
        {plusMarkers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.lat, marker.lng]}
            icon={plusMarkerIcon}
          />
        ))}

        {isSeniorAdmin && (
          <div className="leaflet-top leaflet-left ml-10">
            <div className="leaflet-control leaflet-bar bg-white shadow rounded p-2 space-y-2">
              {/* Set New Default Center */}
              <button
                onClick={() => {
                  setSettingDefault(true);
                  alert('Click on the map to set a new default center.');
                }}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full cursor-pointer"
              >
                Set New Default Center
              </button>
            </div>
          </div>
        )}





        {isHouseholdMap && !isSeniorAdmin && (
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

        {isAccidentMap && !isSeniorAdmin && (
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

        {isHouseholdMap && !isSeniorAdmin &&
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


        {isAccidentMap && addingAccident && !isSeniorAdmin && <AccidentMapForm onSubmit={handleAccidentSubmit} />}

        {isAccidentMap && !isSeniorAdmin &&
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

        {isHouseholdMap && activeHazard && !isSeniorAdmin && (
          <MapWithHazards activeHazard={activeHazard} setLoading={setLoading} />
        )}

        {isAccidentMap && !isSeniorAdmin &&(
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

        {isHouseholdMap && affectedHouseholds.length > 0 && !isSeniorAdmin && (
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

      {isModalOpen && selectedHousehold && !isSeniorAdmin && (
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
              {selectedHousehold.name || 'Unnamed Household'}'s Residence
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
      {isUploadModalOpen && isSeniorAdmin && (
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
