'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import Image from 'next/image';

const AccidentMarkers = ({ isAccidentMap, isMDRRMCAdmin, accidents, accidentIcon }) => {
  // ✅ FIXED: Show accidents to all authenticated users, not blocked for admin
  if (!isAccidentMap) return null;

  return (
    <>
      {accidents.map((acc, idx) => {
        // ✅ FIXED: Normalize position from {lat, lng} structure used by API
        const position = acc.position || { lat: acc.lat, lng: acc.lng };
        if (!position.lat || !position.lng) return null; // Skip if no valid coordinates
        
        return (
        <Marker
          key={acc.id || idx}
          position={position}
          icon={accidentIcon}
          eventHandlers={{
            mouseover: (e) => e.target.openPopup(),
            mouseout: (e) => e.target.closePopup(),
          }}
        >
          <Popup>
            <div className="text-sm">
              {acc.imageUrl && (
                <div className="mt-2 flex justify-center">
                  <Image
                    src={acc.imageUrl}
                    alt="Accident"
                    width={160}
                    height={112}
                    className="w-40 h-28 object-cover rounded-md border"
                  />
                </div>
              )}
              <p><strong>Type:</strong> {acc.type}</p>
              <p><strong>Severity:</strong> {acc.severity}</p>
              <p><strong>Description:</strong> {acc.description}</p>
              <p><strong>Date & Time:</strong> {acc.datetime}</p>
            </div>
          </Popup>
        </Marker>
        );
      })}
    </>
  );
};

export default AccidentMarkers;
