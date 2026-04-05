'use client';

import { db } from '@/lib/firebaseConfig';
import * as turf from '@turf/turf';
import { doc, setDoc } from 'firebase/firestore';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  LayersControl,
  MapContainer,
  Marker,
  TileLayer
} from 'react-leaflet';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from '@/context/authContext';
import { useMap } from '@/context/mapContext';
import { reprojectGeoJSON } from '@/utils/geoJsonProjection';
import { mapApi } from '../../services/mapApi';

// Feature-based Map imports
import { useMapState } from '../../hooks/useMapState';
import { useHouseholdMarkers } from '../../hooks/useHouseholdMarkers';
import { useAccidents } from '../../hooks/useAccidents';
import { MAP_TYPES, ACCIDENT_HEAT_MAX, ACCIDENT_CLUSTERING_RADIUS } from '../../utils/mapConstants';
import { groupNearbyAccidents } from '../../utils/groupNearbyAccidents';
import { accidentIcon, affectedIcon, houseIcon, plusMarkerIcon } from '../../utils/icons';

// Component imports (organized by functional area)
import HouseholdMarkers from '../Household/HouseholdMarkers';
import HouseholdModal from '../Household/HouseholdModal';
import AccidentMapControls from '../Accident/AccidentMapControls';
import AccidentMapForm from '../Accident/accidentMapForm';
import AccidentMapOverlay from '../Accident/AccidentMapOverlay';
import AccidentMarkers from '../Accident/AccidentMarkers';
import HazardSelectControls from '../Hazard/HazardSelectionControls';
import HouseholdHazardMap from '../Hazard/HouseholdHazardMap';
import AffectedHouseholdsPanel from '../Hazard/AffectedHouseholdsPanel';
import BoundaryLayer from '../Map/BoundaryLayer';
import MapClickHandler from '../Admin/MapClickHandler';
import SetDefaultCenterControl from '../Admin/SetDefaultCenter';
import GeojsonUploadModal from '../Admin/UploadBoundaryModal';
import LoadingScreen from '../Shared/LoadingScreen';

const { BaseLayer } = LayersControl;

/**
 * MapContainer - Main map orchestrator component
 *
 * Coordinates:
 * - Household marker fetching and display
 * - Accident data and visualization
 * - Hazard layer management
 * - Map UI (modals, controls, etc.)
 * - Admin boundary and default center management
 */
export default function MapContainerComponent() {
  // Core state management
  const mapState = useMapState();
  
  // Auth and context
  const { user, profile, role } = useAuth();
  const { boundaryGeoJSON, defaultCenter, setBoundaryGeoJSON } = useMap();
  const mapRef = useRef(null);
  const router = useRouter();

  const isMDRRMCAdmin = role === 'MDRRMC-Admin';

  // ✅ Fetch household markers only for non-admin users
  const { markers: householdMarkers, loading: markersLoading } = useHouseholdMarkers(!isMDRRMCAdmin);
  
  // ✅ Fetch accidents ONLY when accident map is active AND user is not admin
  const { accidents, addAccident: addAccidentToState } = useAccidents(
    mapState.isAccidentMap && !isMDRRMCAdmin
  );

  // Redirect if no profile or role
  useEffect(() => {
    if (!markersLoading && (!profile || !role)) {
      router.replace('/unauthorized');
    }
  }, [profile, role, markersLoading, router]);

  // ✅ Fetch boundary ONLY when on map page (not on dashboard, reports, or other pages)
  useEffect(() => {
    const fetchBoundary = async () => {
      try {
        console.log('🗺️ Fetching boundary from API (MapContainer mount)...');
        const response = await fetch('/api/maps/boundary', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Boundary response:', {
            hasGeojson: !!data.geojson,
            features: data.features,
            name: data.name,
          });
          if (data.geojson) {
            console.log('✅ Setting boundary GeoJSON');
            setBoundaryGeoJSON(data.geojson);
          } else {
            console.log('⚠️ No GeoJSON in response - boundary not uploaded yet');
          }
        } else if (response.status !== 404) {
          console.error('❌ Error fetching boundary:', response.status);
        }
      } catch (err) {
        console.error('❌ Error fetching boundary:', err);
      }
    };

    fetchBoundary();

    // Cleanup: Clear boundary when leaving map page
    return () => {
      console.log('🗺️ Leaving map page - boundary stays for performance');
    };
  }, []); // Empty dependency array - fetch once on mount

  // Handle accident submission (add to local state)
  const handleAccidentSubmit = (data) => {
    addAccidentToState(data);
    mapState.setAddingAccident(false);
  };

  // Compute affected households when hazard data or markers change
  useEffect(() => {
    if (!mapState.hazardGeoJSON?.features?.length || householdMarkers.length === 0) {
      mapState.setAffectedHouseholds([]);
      return;
    }

    const affected = householdMarkers
      .map(house => {
        if (typeof house.lat !== 'number' || typeof house.lng !== 'number') return null;
        const point = turf.point([house.lng, house.lat]);
        const match = mapState.hazardGeoJSON.features.find(
          f => f?.geometry?.coordinates?.length && turf.booleanPointInPolygon(point, f)
        );
        if (!match) return null;
        const props = match.properties || {};
        const value = mapState.legendProp?.key ? props[mapState.legendProp.key] ?? 'N/A' : undefined;
        return { ...house, ...(mapState.legendProp?.key ? { [mapState.legendProp.key]: value } : {}) };
      })
      .filter(Boolean);

    mapState.setAffectedHouseholds(affected);
  }, [mapState.hazardGeoJSON, householdMarkers, mapState.legendProp]);

  // Clear hazard data if hazard is deselected
  useEffect(() => {
    if (!mapState.activeHazard) {
      mapState.setHazardGeoJSON(null);
      mapState.setAffectedHouseholds([]);
    }
  }, [mapState.activeHazard]);

  // Cluster accidents for heat map
  const clusteredAccidents = groupNearbyAccidents(accidents, ACCIDENT_CLUSTERING_RADIUS);
  const accidentHeatPoints = clusteredAccidents
    .filter(c => c.count >= 2)
    .map(c => [c.lat, c.lng, Math.min(c.count / ACCIDENT_HEAT_MAX, 1)]);

  // Handle GeoJSON file upload (admin only)
  const handleFileUpload = async () => {
    if (!mapState.geojsonFile) return toast.error('Please select a GeoJSON file');

    if (!mapState.geojsonFile.name.endsWith('.geojson')) {
      toast.error('Please upload a valid .geojson file');
      return;
    }

    mapState.setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let geojson = JSON.parse(event.target.result);

        if (!geojson.type || (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature')) {
          throw new Error('Invalid GeoJSON structure');
        }

        // Reproject coordinates to EPSG:4326
        geojson = reprojectGeoJSON(geojson);

        // Update map boundary in context
        setBoundaryGeoJSON(geojson);
        if (mapRef.current) {
          const leafletGeoJSON = L.geoJSON(geojson);
          mapRef.current.fitBounds(leafletGeoJSON.getBounds());
        }

        // Upload via API (server-side handling of stringification and admin validation)
        const formData = new FormData();
        const blob = new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' });
        formData.append('file', new File([blob], mapState.geojsonFile.name, { type: 'application/geo+json' }));

        const response = await fetch('/api/maps/boundary', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        toast.success('GeoJSON uploaded, reprojected, and map updated!');
        mapState.setIsUploadModalOpen(false);
        mapState.setGeojsonFile(null);
      } catch (err) {
        console.error(err);
        if (err.message.includes('403')) {
          toast.error('Only admin can upload boundaries');
        } else if (err.message.includes('Invalid')) {
          toast.error('Invalid GeoJSON file');
        } else {
          toast.error('Failed to upload GeoJSON: ' + err.message);
        }
      } finally {
        mapState.setLoading(false);
      }
    };

    reader.readAsText(mapState.geojsonFile);
  };

  if (profile === null) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative">
      {/* Map type selector (non-admin only) */}
      {!isMDRRMCAdmin && (
        <div className="mb-4 flex gap-3 z-30 relative">
          {[MAP_TYPES.HOUSEHOLD_MAP, MAP_TYPES.ACCIDENT_MAP].map(option => (
            <button
              key={option}
              onClick={() => {
                mapState.setActiveMap(option);
                mapState.setActiveHazard('');
                mapState.setAddingAccident(false);
              }}
              className={`px-4 py-2 rounded cursor-pointer ${
                mapState.activeMap === option
                  ? 'bg-green-600 text-white font-bold'
                  : 'bg-gray-300 text-gray-800 hover:bg-green-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Admin boundary upload button */}
      {isMDRRMCAdmin && (
        <div className="leaflet-top leaflet-left ml-10 mt-14 sm:ml-60 sm:mt-0">
          <div className="leaflet-control leaflet-bar bg-white shadow rounded p-2 space-y-2">
            <button
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full cursor-pointer"
              onClick={() => mapState.setIsUploadModalOpen(true)}
            >
              Set New Boundary
            </button>
          </div>
        </div>
      )}

      {/* Main Leaflet Map */}
      <MapContainer
        key={profile?.role}
        center={defaultCenter}
        zoom={12.5}
        scrollWheelZoom
        style={{
          height: isMDRRMCAdmin ? '810px' : '750px',
          width: '100%',
          cursor: 'pointer',
          borderRadius: '8px',
        }}
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
      >
        {/* Base layers (OpenStreetMap, Satellite) */}
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

        {/* Administrative boundary layer */}
        <BoundaryLayer boundaryGeoJSON={boundaryGeoJSON} />

        {/* Admin-only map controls */}
        {isMDRRMCAdmin && (
          <MapClickHandler
            settingDefault={mapState.settingDefault}
            setPlusMarkers={mapState.setPlusMarkers}
            setSettingDefault={mapState.setSettingDefault}
          />
        )}

        {/* Plus markers for default center setting */}
        {mapState.plusMarkers.map((marker, idx) => (
          <Marker key={idx} position={[marker.lat, marker.lng]} icon={plusMarkerIcon} />
        ))}

        {/* Default center control (admin) */}
        <SetDefaultCenterControl
          isMDRRMCAdmin={isMDRRMCAdmin}
          setSettingDefault={mapState.setSettingDefault}
        />

        {/* Hazard selection controls */}
        <HazardSelectControls
          isHouseholdMap={mapState.isHouseholdMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          loading={mapState.loading}
          activeHazard={mapState.activeHazard}
          setActiveHazard={mapState.setActiveHazard}
        />

        {/* Accident map controls */}
        <AccidentMapControls
          isAccidentMap={mapState.isAccidentMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          addingAccident={mapState.addingAccident}
          setAddingAccident={mapState.setAddingAccident}
        />

        {/* Household markers (for Household Map) */}
        <HouseholdMarkers
          isHouseholdMap={mapState.isHouseholdMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          householdMarkers={householdMarkers}
          affectedHouseholds={mapState.affectedHouseholds}
          affectedIcon={affectedIcon}
          houseIcon={houseIcon}
          setSelectedHousehold={mapState.setSelectedHousehold}
          setIsModalOpen={mapState.setIsModalOpen}
        />

        {/* Accident form (for adding new accidents on map click) */}
        {mapState.isAccidentMap && mapState.addingAccident && !isMDRRMCAdmin && (
          <AccidentMapForm onSubmit={handleAccidentSubmit} />
        )}

        {/* Accident markers */}
        <AccidentMarkers
          isAccidentMap={mapState.isAccidentMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          accidents={accidents}
          accidentIcon={accidentIcon}
        />

        {/* Hazard layer management and loading */}
        <HouseholdHazardMap
          isHouseholdMap={mapState.isHouseholdMap}
          activeHazard={mapState.activeHazard}
          isMDRRMCAdmin={isMDRRMCAdmin}
          setLoading={mapState.setLoading}
          setLegendProp={mapState.setLegendProp}
          setColorSettings={mapState.setColorSettings}
          setHazardGeoJSON={mapState.setHazardGeoJSON}
        />

        {/* Accident heat map overlay */}
        <AccidentMapOverlay
          isAccidentMap={mapState.isAccidentMap}
          isMDRRMCAdmin={isMDRRMCAdmin}
          accidentHeatPoints={accidentHeatPoints}
          clustered={clusteredAccidents}
        />

        {/* Affected households panel */}
        <AffectedHouseholdsPanel
          isHouseholdMap={mapState.isHouseholdMap}
          affectedHouseholds={mapState.affectedHouseholds}
          isMDRRMCAdmin={isMDRRMCAdmin}
          activeHazard={mapState.activeHazard}
          legendProp={mapState.legendProp}
          colorSettings={mapState.colorSettings}
        />
      </MapContainer>

      {/* Household detail modal */}
      <HouseholdModal
        isOpen={mapState.isModalOpen}
        selectedHousehold={mapState.selectedHousehold}
        isMDRRMCAdmin={isMDRRMCAdmin}
        setIsModalOpen={mapState.setIsModalOpen}
      />

      {/* GeoJSON upload modal (admin) */}
      <GeojsonUploadModal
        isOpen={mapState.isUploadModalOpen}
        isMDRRMCAdmin={isMDRRMCAdmin}
        geojsonFile={mapState.geojsonFile}
        setGeojsonFile={mapState.setGeojsonFile}
        setIsUploadModalOpen={mapState.setIsUploadModalOpen}
        handleFileUpload={handleFileUpload}
        loading={mapState.loading}
      />
    </div>
  );
}
