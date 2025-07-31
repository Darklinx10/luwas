'use client';

import { useEffect, useState } from 'react';
import * as turf from '@turf/turf';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

import PWDTable from '@/components/Tables/pwdTable';
import SeniorTable from '@/components/Tables/seniorTable';
import HazardTable from '@/components/Tables/hazardTable';
import AccidentTable from '@/components/Tables/accidentTable';

const hazardTypes = [
  'Active Faults',
  'Liquefaction',
  'Rain Induced Landslide',
  'Earthquake Induced Landslide',
  'Ground Shaking',
  'Storm Surge',
  'Tsunami',
  'Landslide',
];

const geoJsonFileMap = {
  'Tsunami': '/data/Clarin_Tsunami_converted.geojson',
  'Storm Surge': '/data/Clarin_StormSurge_converted.geojson',
  'Rain Induced Landslide': '/data/Clarin_RIL_converted.geojson',
  'Liquefaction': '/data/Clarin_Liquefaction_converted.geojson',
  'Earthquake Induced Landslide': '/data/Clarin_EIL_converted.geojson',
  'Active Faults': '/data/Clarin_AF_converted.geojson',
  'Ground Shaking': '/data/Clarin_GS_converted.geojson',
  'Landslide': '/data/Clarin_Landslide_converted.geojson',
};

const reportData = {
    
};

const titleMap = {
  pwd: 'List of Person with Disability (2025)',
  senior: 'List of Senior Citizens (2025)',
  accident: 'List of Reported Accidents (2025)',
  ...hazardTypes.reduce((map, type) => {
    map[type] = `Reported Hazards: ${type} (2025)`;
    return map;
  }, {}),
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('pwd');
  const [affectedHouseholds, setAffectedHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAffectedHouseholds = async () => {
      if (!hazardTypes.includes(selectedReport)) return;

      setLoading(true);
      try {
        const geoJsonFile = geoJsonFileMap[selectedReport];
        const res = await fetch(geoJsonFile);
        const geojson = await res.json();

        const householdsSnap = await getDocs(collection(db, 'households'));
        const households = [];

        for (const doc of householdsSnap.docs) {
          const geoSnap = await getDocs(collection(db, 'households', doc.id, 'geographicIdentification'));
          geoSnap.forEach((geoDoc) => {
            const data = geoDoc.data();
            const lat = Number(data.latitude);
            const lng = Number(data.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
              households.push({
                name: `${data.headFirstName || ''} ${data.headLastName || ''}`.trim(),
                barangay: data.barangay || 'N/A',
                contactnumber: data.contactNumber || 'N/A',
                location: { lat, lng },
              });
            }
          });
        }

        // Filter affected households
        const affected = households.filter(h => {
          const point = turf.point([h.location.lng, h.location.lat]);
          return geojson.features.some(feature => {
            const polygon = turf.feature(feature.geometry);
            return turf.booleanPointInPolygon(point, polygon);
          });
        });

        setAffectedHouseholds(affected);
      } catch (err) {
        console.error('Error loading hazard data:', err);
        setAffectedHouseholds([]);
      } finally {
        setLoading(false);
      }
    };

    loadAffectedHouseholds();
  }, [selectedReport]);

  const renderTable = () => {
    const title = titleMap[selectedReport];

    if (selectedReport === 'pwd') return <PWDTable title={title} />;
    if (selectedReport === 'senior') return <SeniorTable title={title} />;
    if (selectedReport === 'accident') {
      return <AccidentTable data={reportData.accident} title={title} />;
    }

    if (hazardTypes.includes(selectedReport)) {
      return <HazardTable data={affectedHouseholds} title={title} loading={loading} />;
    }

    return null;
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4 flex-wrap">
        {['pwd', 'senior', 'accident'].map((key) => (
          <button
            key={key}
            onClick={() => setSelectedReport(key)}
            className={`px-4 py-2 rounded cursor-pointer ${
              selectedReport === key
                ? 'bg-green-600 text-white font-bold'
                : 'bg-gray-300 text-gray-800 hover:bg-green-300'
            }`}
          >
            {titleMap[key].split('(')[0].replace('List of ', '').trim()}
          </button>
        ))}

        <select
          onChange={(e) => setSelectedReport(e.target.value)}
          value={hazardTypes.includes(selectedReport) ? selectedReport : ''}
          className={`px-2 py-1 rounded cursor-pointer outline-none transition-all duration-200
            ${hazardTypes.includes(selectedReport)
              ? 'bg-green-600 text-white font-bold'
              : 'bg-gray-300 text-gray-800 hover:bg-green-400'}
          `}
        >
          <option value="" disabled className="text-gray-500 bg-white">
            Select Hazard
          </option>
          {hazardTypes.map((hazard) => (
            <option key={hazard} value={hazard} className="text-black bg-white">
              {hazard}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded shadow p-4 overflow-x-auto print:border print:border-gray-300">
        {renderTable()}
      </div>
    </div>
  );
}
