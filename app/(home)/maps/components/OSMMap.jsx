
'use client';

import { db, storage } from '@/firebase/config';
import { capitalizeWords } from '@/utils/capitalize';
import * as turf from '@turf/turf';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayersControl,
  MapContainer,
  Marker,
  TileLayer
} from 'react-leaflet';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AccidentMapControls from './AccidentMapControls';
import AccidentMapForm from './accidentMapForm';
import AccidentMapOverlay from './AccidentMapOverlay';
import AccidentMarkers from './AccidentMarkers';
import AffectedHouseholdsPanel from './AffectedHouseholdsPanel';
import BoundaryLayer from './BoundaryLayer';
import HazardSelectControls from './HazardSelectionControls';
import HouseholdHazardMap from './HouseholdHazardMap';
import HouseholdMarkers from './HouseholdMarkers';
import HouseholdModal from './HouseholdModal';
import LoadingScreen from './LoadingScreen';
import MapClickHandler from './MapClickHandler';
import SetDefaultCenterControl from './SetDefaultCenter';
import GeojsonUploadModal from './UploadBoundaryModal';
import { groupNearbyAccidents } from './utils/groupNearbyAccidents';
import { accidentIcon, affectedIcon, houseIcon, plusMarkerIcon } from './utils/icons';
import { useAuth } from '@/context/authContext';
import { useMap } from '@/context/mapContext';


const { BaseLayer } = LayersControl;

export default function OSMMapPage() {
  const [activeMap, setActiveMap] = useState('Household Map');
  const [activeHazard, setActiveHazard] = useState('');
  const [householdMarkers, setHouseholdMarkers] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [addingAccident, setAddingAccident] = useState(false);
  const [affectedHouseholds, setAffectedHouseholds] = useState([]);
  const [hazardGeoJSON, setHazardGeoJSON] = useState({});
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [settingDefault, setSettingDefault] = useState(false);
  const [plusMarkers, setPlusMarkers] = useState([]);
  const [geojsonFile, setGeojsonFile] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [legendProp, setLegendProp] = useState(null);
  const [colorSettings, setColorSettings] = useState(null);
  

  const { profile, role } = useAuth();
  const { boundaryGeoJSON, defaultCenter, setBoundaryGeoJSON } = useMap();
  const mapRef = useRef(null);
  const router = useRouter();

  const isHouseholdMap = activeMap === 'Household Map';
  const isAccidentMap = activeMap === 'Accident Map';
  const isMDRRMCAdmin = profile?.role === 'MDRRMC-Admin';

  // Redirect if no profile or role
  useEffect(() => {
    if (!loading && (!profile || !role)) {
      router.replace('/unauthorized');
    }
  }, [profile, role, loading, router]);

  // Fetch household locations
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

              const headFullName = capitalizeWords(
                `${data.headFirstName || ''} ${data.headLastName || ''}`.trim()
              );

              if (!isNaN(lat) && !isNaN(lng)) {
                const membersSnap = await getDocs(
                  collection(db, 'households', doc.id, 'members')
                );
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

  // Fetch accidents
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

  // Compute affected households automatically
    useEffect(() => {
      if (!hazardGeoJSON?.features?.length || householdMarkers.length === 0) {
        setAffectedHouseholds([]);
        return;
      }
  
      const affected = householdMarkers
        .map(house => {
          if (typeof house.lat !== 'number' || typeof house.lng !== 'number') return null;
          const point = turf.point([house.lng, house.lat]);
          const match = hazardGeoJSON.features.find(f => f?.geometry?.coordinates?.length && turf.booleanPointInPolygon(point, f));
          if (!match) return null;
          const props = match.properties || {};
          const value = legendProp?.key ? props[legendProp.key] ?? "N/A" : undefined;
          return { ...house, ...(legendProp?.key ? { [legendProp.key]: value } : {}) };
        })
        .filter(Boolean);
  
      setAffectedHouseholds(affected);
    }, [hazardGeoJSON, householdMarkers, legendProp]);
  
  
  // Clear hazard data if no active hazard
  useEffect(() => {
    if (!activeHazard) {
      setHazardGeoJSON(null);
      setAffectedHouseholds([]);
    }
  }, [activeHazard]);

  const clustered = groupNearbyAccidents(accidents, 50);
  const MAX_ACCIDENTS = 5;
  const accidentHeatPoints = clustered
    .filter(c => c.count >= 2)
    .map(c => [c.lat, c.lng, Math.min(c.count / MAX_ACCIDENTS, 1)]);

  const handleFileUpload = async () => {
    if (!geojsonFile) return toast.error('Please select a GeoJSON file');
    

    if (!geojsonFile.name.endsWith('.geojson')) {
      toast.error('Please upload a valid .geojson file');
      return;
    }

    setLoading(true);

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

  if (profile === null) {
    return <LoadingScreen />;
  }


  return (
    <div className="relative">
      
      {/* Map selector */}
      {profile?.role !== 'MDRRMC-Admin' && (
        <div className="mb-4 flex flex-col sm:flex-row gap-3 z-30 relative">

          {['Household Map', 'Accident Map'].map(option => (
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

      {/* Admin boundary button */}
      {isMDRRMCAdmin && (
        <div className="leaflet-top leaflet-left ml-60">
          <div className="leaflet-control leaflet-bar bg-white shadow rounded p-2 space-y-2 flex flex-col sm:flex-row gap-2 w-64">
            <button
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full cursor-pointer"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Set New Boundary
            </button>
            <SetDefaultCenterControl
              setSettingDefault={setSettingDefault}
            />
          </div>
        </div>
      )}

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

        <BoundaryLayer boundaryGeoJSON={boundaryGeoJSON} />

        {isMDRRMCAdmin && (
          <MapClickHandler
            settingDefault={settingDefault}
            setPlusMarkers={setPlusMarkers}
            setSettingDefault={setSettingDefault}
          />
        )}

        {plusMarkers.map((marker, idx) => (
          <Marker key={idx} position={[marker.lat, marker.lng]} icon={plusMarkerIcon} />
        ))}

        

        <HazardSelectControls
          isHouseholdMap={isHouseholdMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          loading={loading}
          activeHazard={activeHazard}
          setActiveHazard={setActiveHazard}
        />

        <AccidentMapControls
          isAccidentMap={isAccidentMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          addingAccident={addingAccident}
          setAddingAccident={setAddingAccident}
        />

        <HouseholdMarkers
          isHouseholdMap={isHouseholdMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          householdMarkers={householdMarkers}
          affectedHouseholds={affectedHouseholds}
          affectedIcon={affectedIcon}
          houseIcon={houseIcon}
          setSelectedHousehold={setSelectedHousehold}
          setIsModalOpen={setIsModalOpen}
        />

        {isAccidentMap && addingAccident && !isMDRRMCAdmin && (
          <AccidentMapForm onSubmit={handleAccidentSubmit} />
        )}

        <AccidentMarkers
          isAccidentMap={isAccidentMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          accidents={accidents}
          accidentIcon={accidentIcon}
        />

        <HouseholdHazardMap
          isHouseholdMap={isHouseholdMap}
          activeHazard={activeHazard}
          isMDRRMCAdmin={isMDRRMCAdmin}
          setLoading={setLoading}
          setLegendProp={setLegendProp}
          setColorSettings={setColorSettings}
          setHazardGeoJSON={setHazardGeoJSON}
        />

        <AccidentMapOverlay
          isAccidentMap={isAccidentMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          accidentHeatPoints={accidentHeatPoints}
          clustered={clustered}
        />

        <AffectedHouseholdsPanel
          isHouseholdMap={isHouseholdMap}
          affectedHouseholds={affectedHouseholds}
          isMDRRMCAdmin={isMDRRMCAdmin}
          activeHazard={activeHazard}
          legendProp={legendProp}
          colorSettings={colorSettings}
        />
      </MapContainer>

      <HouseholdModal
        isOpen={isModalOpen}
        selectedHousehold={selectedHousehold}
        isMDRRMCAdmin={isMDRRMCAdmin}
        setIsModalOpen={setIsModalOpen}
      />

      <GeojsonUploadModal
        isOpen={isUploadModalOpen}
        isMDRRMCAdmin={isMDRRMCAdmin}
        geojsonFile={geojsonFile}
        setGeojsonFile={setGeojsonFile}
        setIsUploadModalOpen={setIsUploadModalOpen}
        handleFileUpload={handleFileUpload}
        loading={loading}
      />
    </div>
  );
}
