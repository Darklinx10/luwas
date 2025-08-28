'use client';

import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import AccidentHeatmap from './AccidentHeatmap';

const AccidentMapOverlay = ({
  isAccidentMap,
  isMDRRMCAdmin,
  accidentHeatPoints,
  clustered,
}) => {
  if (!isAccidentMap || isMDRRMCAdmin) return null;

  return (
    <>
      {/* Accident Heatmap */}
      <AccidentHeatmap points={accidentHeatPoints} />

      {/* Cluster Labels */}
      {clustered
        .filter((c) => c.count >= 2)
        .map((c, index) => (
          <CircleMarker
            key={`label-${index}`}
            center={[c.lat, c.lng]}
            radius={10}
            pathOptions={{
              color: 'transparent',
              fillOpacity: 0,
            }}
            eventHandlers={{
              mouseover: (e) => e.target.openTooltip(),
              mouseout: (e) => e.target.closeTooltip(),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              <div
                style={{
                  background:
                    c.count >= 5
                      ? 'rgba(255,0,0,0.8)' // Red for 5+
                      : c.count >= 3
                      ? 'rgba(255,255,0,0.8)' // Yellow for 3–4
                      : 'rgba(0,128,0,0.8)', // Green for 2
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: 'black',
                  border: '1px solid #222',
                  textAlign: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  pointerEvents: 'auto',
                }}
              >
                ⚠️ {c.count} Accident{c.count > 1 ? 's' : ''}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
    </>
  );
};

export default AccidentMapOverlay;
