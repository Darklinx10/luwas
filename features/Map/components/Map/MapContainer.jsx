'use client';

import * as turf from '@turf/turf';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayersControl, MapContainer, Marker, TileLayer } from 'react-leaflet';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiAlertTriangle,
  FiCrosshair,
  FiHome,
  FiLayers,
  FiMap,
  FiMaximize2,
  FiMinimize2,
  FiUpload,
} from 'react-icons/fi';

import { useAuth } from '@/context/authContext';
import { useMap } from '@/context/mapContext';
import { reprojectGeoJSON } from '@/utils/geoJsonProjection';

import { useMapState } from '../../hooks/useMapState';
import { useHouseholdMarkers } from '../../hooks/useHouseholdMarkers';
import { useAccidents } from '../../hooks/useAccidents';
import {
  MAP_TYPES,
  ACCIDENT_HEAT_MAX,
  ACCIDENT_CLUSTERING_RADIUS,
} from '../../utils/mapConstants';
import { groupNearbyAccidents } from '../../utils/groupNearbyAccidents';
import {
  accidentIcon,
  affectedIcon,
  houseIcon,
  plusMarkerIcon,
} from '../../utils/icons';

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

function StatPill({ icon, label, value, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-100',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {value !== undefined && <span className="font-semibold">{value}</span>}
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active = false,
  variant = 'secondary',
  disabled = false,
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50';

  const styles =
    variant === 'primary'
      ? active
        ? 'bg-emerald-700 text-white'
        : 'bg-emerald-600 text-white hover:bg-emerald-700'
      : active
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function SideInfoCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function OverviewItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function MapFullscreenControl({ isFullscreen, onToggle }) {
  return (
    <div className="pointer-events-none absolute right-[10px] bottom-[50px] z-[1000]">
      <div className="pointer-events-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          <span className="hidden md:inline">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function MapContainerComponent() {
  const mapState = useMapState();

  const { profile, role } = useAuth();
  const { boundaryGeoJSON, defaultCenter, setBoundaryGeoJSON } = useMap();

  const mapRef = useRef(null);
  const mapShellRef = useRef(null);
  const resizeTimeoutsRef = useRef([]);
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isMDRRMCAdmin = role === 'MDRRMC-Admin';
  const isPersonnel = role === 'MDRRMC-Personnel';
  const isSecretary = role === 'Brgy-Secretary';

  const { markers: householdMarkers, loading: markersLoading } =
    useHouseholdMarkers(!isMDRRMCAdmin);

  const { accidents, addAccident: addAccidentToState } = useAccidents(
    mapState.isAccidentMap && !isMDRRMCAdmin
  );

  useEffect(() => {
    if (!markersLoading && (!profile || !role)) {
      router.replace('/unauthorized');
    }
  }, [profile, role, markersLoading, router]);

  useEffect(() => {
    const fetchBoundary = async () => {
      try {
        const response = await fetch('/api/maps/boundary', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.geojson) {
            setBoundaryGeoJSON(data.geojson);
          }
        } else if (response.status !== 404) {
          console.error('Error fetching boundary:', response.status);
        }
      } catch (error) {
        console.error('Error fetching boundary:', error);
      }
    };

    fetchBoundary();
  }, [setBoundaryGeoJSON]);

  const invalidateMapSize = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    window.requestAnimationFrame(() => {
      map.invalidateSize({ pan: false, debounceMoveend: true });
    });
  }, []);

  const scheduleMapResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    resizeTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    resizeTimeoutsRef.current = [];

    invalidateMapSize();

    [120, 280, 480].forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        invalidateMapSize();
      }, delay);

      resizeTimeoutsRef.current.push(timeoutId);
    });
  }, [invalidateMapSize]);

  useEffect(() => {
    const getFullscreenElement = () =>
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      null;

    const handleFullscreenChange = () => {
      setIsFullscreen(getFullscreenElement() === mapShellRef.current);
      scheduleMapResize();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [scheduleMapResize]);

  useEffect(() => {
    scheduleMapResize();
  }, [isFullscreen, scheduleMapResize]);

  useEffect(() => {
    const handleWindowResize = () => {
      scheduleMapResize();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [scheduleMapResize]);

  useEffect(() => {
    const mapShell = mapShellRef.current;
    if (!mapShell || typeof ResizeObserver === 'undefined') return undefined;

    const resizeObserver = new ResizeObserver(() => {
      scheduleMapResize();
    });

    resizeObserver.observe(mapShell);

    return () => {
      resizeObserver.disconnect();
    };
  }, [scheduleMapResize]);

  useEffect(
    () => () => {
      resizeTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    },
    []
  );

  const handleAccidentSubmit = (data) => {
    addAccidentToState(data);
    mapState.setAddingAccident(false);
  };

  const toggleFullscreen = async () => {
    const container = mapShellRef.current;
    if (!container) return;

    const fullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      null;

    try {
      if (fullscreenElement === container) {
        const exitFullscreen =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.msExitFullscreen;

        if (exitFullscreen) {
          await exitFullscreen.call(document);
        }
      } else {
        const requestFullscreen =
          container.requestFullscreen ||
          container.webkitRequestFullscreen ||
          container.msRequestFullscreen;

        if (requestFullscreen) {
          await requestFullscreen.call(container);
        }
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
      toast.error('Unable to toggle fullscreen mode right now.');
    }
  };

  useEffect(() => {
    if (!mapState.hazardGeoJSON?.features?.length || householdMarkers.length === 0) {
      mapState.setAffectedHouseholds([]);
      return;
    }

    const affected = householdMarkers
      .map((house) => {
        if (typeof house.lat !== 'number' || typeof house.lng !== 'number') return null;

        const point = turf.point([house.lng, house.lat]);

        const matchedFeature = mapState.hazardGeoJSON.features.find(
          (feature) =>
            feature?.geometry?.coordinates?.length &&
            turf.booleanPointInPolygon(point, feature)
        );

        if (!matchedFeature) return null;

        const props = matchedFeature.properties || {};
        const derivedValue = mapState.legendProp?.key
          ? props[mapState.legendProp.key] ?? 'N/A'
          : undefined;

        return {
          ...house,
          ...(mapState.legendProp?.key
            ? { [mapState.legendProp.key]: derivedValue }
            : {}),
        };
      })
      .filter(Boolean);

    mapState.setAffectedHouseholds(affected);
  }, [
    mapState.hazardGeoJSON,
    householdMarkers,
    mapState.legendProp,
    mapState.setAffectedHouseholds,
  ]);

  useEffect(() => {
    if (!mapState.activeHazard) {
      mapState.setHazardGeoJSON(null);
      mapState.setAffectedHouseholds([]);
    }
  }, [
    mapState.activeHazard,
    mapState.setHazardGeoJSON,
    mapState.setAffectedHouseholds,
  ]);

  const clusteredAccidents = useMemo(
    () => groupNearbyAccidents(accidents, ACCIDENT_CLUSTERING_RADIUS),
    [accidents]
  );

  const accidentHeatPoints = useMemo(
    () =>
      clusteredAccidents
        .filter((cluster) => cluster.count >= 2)
        .map((cluster) => [
          cluster.lat,
          cluster.lng,
          Math.min(cluster.count / ACCIDENT_HEAT_MAX, 1),
        ]),
    [clusteredAccidents]
  );

  const handleFileUpload = async () => {
    if (!mapState.geojsonFile) {
      toast.error('Please select a GeoJSON file');
      return;
    }

    if (!mapState.geojsonFile.name.endsWith('.geojson')) {
      toast.error('Please upload a valid .geojson file');
      return;
    }

    mapState.setLoading(true);

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        let geojson = JSON.parse(event.target.result);

        if (
          !geojson.type ||
          (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature')
        ) {
          throw new Error('Invalid GeoJSON structure');
        }

        geojson = reprojectGeoJSON(geojson);

        setBoundaryGeoJSON(geojson);

        if (mapRef.current) {
          const leafletGeoJSON = L.geoJSON(geojson);
          mapRef.current.fitBounds(leafletGeoJSON.getBounds());
        }

        const formData = new FormData();
        const blob = new Blob([JSON.stringify(geojson)], {
          type: 'application/geo+json',
        });

        formData.append(
          'file',
          new File([blob], mapState.geojsonFile.name, {
            type: 'application/geo+json',
          })
        );

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
      } catch (error) {
        console.error(error);

        if (String(error?.message || '').includes('403')) {
          toast.error('Only admin can upload boundaries');
        } else if (String(error?.message || '').includes('Invalid')) {
          toast.error('Invalid GeoJSON file');
        } else {
          toast.error(`Failed to upload GeoJSON: ${error.message}`);
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

  const currentModeLabel = isMDRRMCAdmin
    ? 'Boundary Administration'
    : mapState.activeMap || 'Map View';

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm text-slate-400">Home / Map</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">Map</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              View location-based household data, hazard overlays, accident
              activity, and administrative boundary settings based on your role.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatPill
              icon={<FiMap size={14} />}
              label="Role"
              value={role || 'User'}
            />
            <StatPill
              icon={<FiLayers size={14} />}
              label="Mode"
              value={currentModeLabel}
              tone="success"
            />
            {!isMDRRMCAdmin && mapState.activeHazard && (
              <StatPill
                icon={<FiAlertTriangle size={14} />}
                label="Hazard"
                value={mapState.activeHazard}
                tone="warning"
              />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          {!isMDRRMCAdmin ? (
            <div className="flex flex-wrap gap-2">
              {[MAP_TYPES.HOUSEHOLD_MAP, MAP_TYPES.ACCIDENT_MAP].map((option) => (
                <ToolbarButton
                  key={option}
                  active={mapState.activeMap === option}
                  onClick={() => {
                    mapState.setActiveMap(option);
                    mapState.setActiveHazard('');
                    mapState.setAddingAccident(false);
                  }}
                >
                  {option}
                </ToolbarButton>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <ToolbarButton
                onClick={() => mapState.setIsUploadModalOpen(true)}
                variant="primary"
                disabled={mapState.loading}
              >
                <span className="mr-2">
                  <FiUpload size={16} />
                </span>
                Set New Boundary
              </ToolbarButton>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {isMDRRMCAdmin ? (
              <>
                <StatPill
                  icon={<FiLayers size={14} />}
                  label="Boundary"
                  value={boundaryGeoJSON ? 'Loaded' : 'Not uploaded'}
                  tone={boundaryGeoJSON ? 'success' : 'warning'}
                />
                <StatPill
                  icon={<FiCrosshair size={14} />}
                  label="Default Center"
                  value={mapState.settingDefault ? 'Selecting...' : 'Ready'}
                  tone="default"
                />
              </>
            ) : (
              <>
                <StatPill
                  icon={<FiHome size={14} />}
                  label="Households"
                  value={householdMarkers?.length || 0}
                />
                <StatPill
                  icon={<FiAlertTriangle size={14} />}
                  label="Affected"
                  value={mapState.affectedHouseholds?.length || 0}
                  tone="warning"
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Interactive Map
                </h2>
                <p className="text-sm text-slate-500">
                  Explore geographic layers, markers, overlays, and operational
                  map tools.
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 md:mt-0">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Base layers available
                </span>
                {!isMDRRMCAdmin && mapState.isHouseholdMap && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                    Household mode active
                  </span>
                )}
                {!isMDRRMCAdmin && mapState.isAccidentMap && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
                    Accident mode active
                  </span>
                )}
                {isMDRRMCAdmin && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                    Admin boundary tools enabled
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <div
              ref={mapShellRef}
              className={`relative overflow-hidden ${
                isFullscreen ? 'bg-slate-950' : 'rounded-2xl'
              }`}
              style={{
                height: isFullscreen ? '100dvh' : '72vh',
                minHeight: isFullscreen ? '100dvh' : '540px',
                width: '100%',
              }}
            >
              <MapContainer
                key={profile?.role}
                center={defaultCenter}
                zoom={12.5}
                scrollWheelZoom
                style={{
                  height: '100%',
                  minHeight: '100%',
                  width: '100%',
                  cursor: 'pointer',
                  borderRadius: isFullscreen ? '0px' : '16px',
                }}
                whenCreated={(mapInstance) => {
                  mapRef.current = mapInstance;
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

              <MapFullscreenControl
                isFullscreen={isFullscreen}
                onToggle={toggleFullscreen}
              />

              <BoundaryLayer boundaryGeoJSON={boundaryGeoJSON} />

              {isMDRRMCAdmin && (
                <MapClickHandler
                  settingDefault={mapState.settingDefault}
                  setPlusMarkers={mapState.setPlusMarkers}
                  setSettingDefault={mapState.setSettingDefault}
                />
              )}

              {mapState.plusMarkers.map((marker, index) => (
                <Marker
                  key={index}
                  position={[marker.lat, marker.lng]}
                  icon={plusMarkerIcon}
                />
              ))}

              <SetDefaultCenterControl
                isMDRRMCAdmin={isMDRRMCAdmin}
                setSettingDefault={mapState.setSettingDefault}
              />

              <HazardSelectControls
                isHouseholdMap={mapState.isHouseholdMap}
                isMDRRMCAdmin={isMDRRMCAdmin}
                loading={mapState.loading}
                activeHazard={mapState.activeHazard}
                setActiveHazard={mapState.setActiveHazard}
              />

              <AccidentMapControls
                isAccidentMap={mapState.isAccidentMap}
                isMDRRMCAdmin={isMDRRMCAdmin}
                addingAccident={mapState.addingAccident}
                setAddingAccident={mapState.setAddingAccident}
              />

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

              {mapState.isAccidentMap &&
                mapState.addingAccident &&
                !isMDRRMCAdmin && (
                  <AccidentMapForm onSubmit={handleAccidentSubmit} />
                )}

              <AccidentMarkers
                isAccidentMap={mapState.isAccidentMap}
                isMDRRMCAdmin={isMDRRMCAdmin}
                accidents={accidents}
                accidentIcon={accidentIcon}
              />

              <HouseholdHazardMap
                isHouseholdMap={mapState.isHouseholdMap}
                activeHazard={mapState.activeHazard}
                isMDRRMCAdmin={isMDRRMCAdmin}
                setLoading={mapState.setLoading}
                setLegendProp={mapState.setLegendProp}
                setColorSettings={mapState.setColorSettings}
                setHazardGeoJSON={mapState.setHazardGeoJSON}
              />

              <AccidentMapOverlay
                isAccidentMap={mapState.isAccidentMap}
                isMDRRMCAdmin={isMDRRMCAdmin}
                accidentHeatPoints={accidentHeatPoints}
                clustered={clusteredAccidents}
              />

              <AffectedHouseholdsPanel
                isHouseholdMap={mapState.isHouseholdMap}
                affectedHouseholds={mapState.affectedHouseholds}
                isMDRRMCAdmin={isMDRRMCAdmin}
                activeHazard={mapState.activeHazard}
                legendProp={mapState.legendProp}
                colorSettings={mapState.colorSettings}
              />
              </MapContainer>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <SideInfoCard title="Map Overview">
            {isMDRRMCAdmin ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  This map is used for boundary administration. Admin can upload
                  or replace the municipal boundary and set the default map
                  center for the rest of the system.
                </p>

                <OverviewItem
                  label="Active Mode"
                  value="Boundary Administration"
                />
                <OverviewItem
                  label="Boundary Status"
                  value={boundaryGeoJSON ? 'Boundary loaded' : 'No boundary uploaded'}
                />
                <OverviewItem
                  label="Default Center"
                  value={mapState.settingDefault ? 'Selecting new center point...' : 'Ready'}
                />
              </div>
            ) : isPersonnel ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  This map helps personnel view household locations, hazard
                  overlays, affected households, and accident activity based on
                  the selected map mode.
                </p>

                <OverviewItem
                  label="Active Mode"
                  value={mapState.activeMap || 'Map View'}
                />
                <OverviewItem
                  label="Selected Hazard"
                  value={mapState.activeHazard || 'No hazard selected'}
                />
                <OverviewItem
                  label="Affected Households"
                  value={mapState.affectedHouseholds?.length || 0}
                />
              </div>
            ) : isSecretary ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  This map provides barangay-level viewing of mapped household
                  locations and related area information based on available
                  access for the current user.
                </p>

                <OverviewItem
                  label="Active Mode"
                  value={mapState.activeMap || 'Map View'}
                />
                <OverviewItem
                  label="Selected Hazard"
                  value={mapState.activeHazard || 'No hazard selected'}
                />
                <OverviewItem
                  label="Visible Households"
                  value={householdMarkers?.length || 0}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Map details are shown here based on the current user role and
                  enabled map access.
                </p>

                <OverviewItem
                  label="Active Mode"
                  value={currentModeLabel}
                />
              </div>
            )}
          </SideInfoCard>

          <SideInfoCard title="Quick Guide">
            {isMDRRMCAdmin ? (
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Upload or replace the municipal boundary using the toolbar.</li>
                <li>• Use the in-map admin controls to set a new default center.</li>
                <li>• Review the boundary using available base layers.</li>
                <li>• Save only valid GeoJSON boundary files.</li>
              </ul>
            ) : isPersonnel ? (
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Switch between household and accident map modes above.</li>
                <li>• Select a hazard layer to view affected households.</li>
                <li>• Use base layers to change between OSM and satellite view.</li>
                <li>• Click map markers to inspect household details.</li>
              </ul>
            ) : isSecretary ? (
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Use the map to review visible household locations.</li>
                <li>• Switch map views when available for your access level.</li>
                <li>• Use base layers to improve location reference.</li>
                <li>• Select markers to inspect available household details.</li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Map guidance changes depending on your current role.</li>
              </ul>
            )}
          </SideInfoCard>
        </aside>
      </div>

      <HouseholdModal
        isOpen={mapState.isModalOpen}
        selectedHousehold={mapState.selectedHousehold}
        isMDRRMCAdmin={isMDRRMCAdmin}
        setIsModalOpen={mapState.setIsModalOpen}
      />

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
