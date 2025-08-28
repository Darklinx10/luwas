'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';

const AccidentMarkers = ({ isAccidentMap, isMDRRMCAdmin, accidents, accidentIcon }) => {
  if (!isAccidentMap || isMDRRMCAdmin) return null;

  return (
    <>
      {accidents.map((acc, idx) => (
        <Marker
          key={acc.id || idx}
          position={acc.position}
          icon={accidentIcon}
          eventHandlers={{
            mouseover: (e) => e.target.openPopup(),
            mouseout: (e) => e.target.closePopup(),
          }}
        >
          <Popup>
            <div className="text-sm">
              {/* ✅ Display accident image if available */}
              {acc.imageUrl && (
                <div className="mt-2 flex justify-center">
                  <img
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
      ))}
    </>
  );
};

export default AccidentMarkers;
