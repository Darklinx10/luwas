'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { formatHouseholdResidenceName } from '../../utils/formatHouseholdName';

const HouseholdMarkers = ({
  isHouseholdMap,
  isMDRRMCAdmin,
  householdMarkers,
  affectedHouseholds,
  affectedIcon,
  houseIcon,
  setSelectedHousehold,
  setIsModalOpen,
}) => {
  if (!isHouseholdMap || isMDRRMCAdmin) return null;

  return (
    <>
      {householdMarkers.map((marker) => {
        // Check if this home (marker) is affected by active hazard
        const isAffected = affectedHouseholds.some(
          (h) => h.id === marker.id // each home has unique id
        );

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
                setSelectedHousehold(marker);
                setIsModalOpen(true);
              },
            }}
          >
            <Popup>
              <strong>{formatHouseholdResidenceName(marker)}</strong>
              <br />
              <span className="text-sm text-gray-700">
                <strong>{marker.homeLabel || `Home ${marker.id}`}</strong>
              </span>
              <br />
              Barangay: {marker.barangay} | Sitio: {marker.sitio}
              <br />
              📞 {marker.contactNumber}
              <br />
              Residents: {marker.totalResidents} (M: {marker.totalMale} | F: {marker.totalFemale})
              <br />
              📍 {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default HouseholdMarkers;
