'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';

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
        // Check if this home (marker) is affected
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
                setSelectedHousehold(marker); // includes home info now
                setIsModalOpen(true);
              },
            }}
          >
            <Popup>
              <strong>{marker.name ? `${marker.name} Residence` : 'Unnamed Residence'}</strong>
              <br />
              <span className="text-sm text-gray-700">
                <strong>{marker.homeLabel || `Home ${marker.id}`}</strong>
              </span>
              <br />
              Barangay: {marker.barangay}
              <br />
              📍 {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
              <br />
              {marker.members?.length > 0 && (
                <>
                  Members: {marker.members.join(', ')}
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default HouseholdMarkers;
