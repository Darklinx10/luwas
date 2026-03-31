/**
 * features/Map/index.js
 *
 * Feature-based Map module exports
 * Centralizes imports for the Map feature
 */

// Hooks
export { useMapState } from './hooks/useMapState';
export { useHouseholdMarkers } from './hooks/useHouseholdMarkers';
export { useAccidents } from './hooks/useAccidents';

// Services
export { mapApi } from './services/mapApi';

// Components - Household
export { default as HouseholdMarkers } from './components/Household/HouseholdMarkers';
export { default as HouseholdModal } from './components/Household/HouseholdModal';

// Components - Hazard
export { default as HazardSelectionControls } from './components/Hazard/HazardSelectionControls';
export { default as HouseholdHazardMap } from './components/Hazard/HouseholdHazardMap';
export { default as AffectedHouseholdsPanel } from './components/Hazard/AffectedHouseholdsPanel';

// Components - Accident
export { default as AccidentMapControls } from './components/Accident/AccidentMapControls';
export { default as AccidentMapForm } from './components/Accident/accidentMapForm';
export { default as AccidentMarkers } from './components/Accident/AccidentMarkers';
export { default as AccidentMapOverlay } from './components/Accident/AccidentMapOverlay';
export { default as AccidentHeatmap } from './components/Accident/AccidentHeatmap';

// Components -Map Core
export { default as MapContainer } from './components/Map/MapContainer';
export { default as BoundaryLayer } from './components/Map/BoundaryLayer';

// Components - Admin
export { default as MapClickHandler } from './components/Admin/MapClickHandler';
export { default as SetDefaultCenterControl } from './components/Admin/SetDefaultCenter';
export { default as GeojsonUploadModal } from './components/Admin/UploadBoundaryModal';

// Components - Shared
export { default as LoadingScreen } from './components/Shared/LoadingScreen';

// Utilities
export { formatHouseholdName, formatHouseholdResidenceName } from './utils/formatHouseholdName';
export { groupNearbyAccidents } from './utils/groupNearbyAccidents';
export { houseIcon, accidentIcon, affectedIcon, plusMarkerIcon } from './utils/icons';
export { MAP_TYPES, ROLES, ALLOWED_MAP_ROLES, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from './utils/mapConstants';
