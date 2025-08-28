'use client';

import React from 'react';
import MapWithHazards from './MapWithHazards';

const HouseholdHazardMap = ({ isHouseholdMap, activeHazard, isMDRRMCAdmin, setLoading }) => {
  if (!isHouseholdMap || !activeHazard || isMDRRMCAdmin) return null;

  return <MapWithHazards activeHazard={activeHazard} setLoading={setLoading} />;
};

export default HouseholdHazardMap;
