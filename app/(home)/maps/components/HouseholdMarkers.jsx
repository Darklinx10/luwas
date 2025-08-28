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
        const isAffected = affectedHouseholds.some((h) => h.id === marker.id);
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
              },
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
    </>
  );
};

export default HouseholdMarkers;
