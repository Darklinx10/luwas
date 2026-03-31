/**
 * features/Map/hooks/useMapState.js
 *
 * Custom hook for managing all map UI state
 * Centralizes state management for map type, modals, selections, etc.
 */

import { useState } from 'react';
import { MAP_TYPES } from '../utils/mapConstants';

export const useMapState = () => {
  const [activeMap, setActiveMap] = useState(MAP_TYPES.HOUSEHOLD_MAP);
  const [activeHazard, setActiveHazard] = useState('');
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingAccident, setAddingAccident] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Hazard/affected households state
  const [hazardGeoJSON, setHazardGeoJSON] = useState({});
  const [affectedHouseholds, setAffectedHouseholds] = useState([]);
  const [legendProp, setLegendProp] = useState(null);
  const [colorSettings, setColorSettings] = useState(null);

  // Plus markers for default center setting (admin)
  const [plusMarkers, setPlusMarkers] = useState([]);

  // File upload state
  const [geojsonFile, setGeojsonFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const isHouseholdMap = activeMap === MAP_TYPES.HOUSEHOLD_MAP;
  const isAccidentMap = activeMap === MAP_TYPES.ACCIDENT_MAP;

  return {
    // Map type
    activeMap,
    setActiveMap,
    isHouseholdMap,
    isAccidentMap,

    // Household selection
    selectedHousehold,
    setSelectedHousehold,
    isModalOpen,
    setIsModalOpen,

    // Hazard state
    activeHazard,
    setActiveHazard,
    hazardGeoJSON,
    setHazardGeoJSON,
    affectedHouseholds,
    setAffectedHouseholds,
    legendProp,
    setLegendProp,
    colorSettings,
    setColorSettings,

    // Accident state
    addingAccident,
    setAddingAccident,

    // Admin state (default center, plus markers)
    settingDefault,
    setSettingDefault,
    plusMarkers,
    setPlusMarkers,

    // Upload state
    isUploadModalOpen,
    setIsUploadModalOpen,
    geojsonFile,
    setGeojsonFile,
    loading,
    setLoading,
  };
};
