'use client';

import React from 'react';
import MapWithHazards from './MapWithHazards';

const HouseholdHazardMap = ({ 
  isHouseholdMap,
  activeHazard,
  isMDRRMCAdmin,
  setLoading,
  setLegendProp,
  setColorSettings,
  setHazardGeoJSON
  
}) => {
  if (!isHouseholdMap || !activeHazard || isMDRRMCAdmin) return null;

  return (
    <MapWithHazards
      activeHazard={activeHazard}
      setLoading={setLoading}
      setLegendProp={setLegendProp}
      setColorSettings={setColorSettings}
      setHazardGeoJSON={setHazardGeoJSON}
    />
  );
};

export default HouseholdHazardMap;
