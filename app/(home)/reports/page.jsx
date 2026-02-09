'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import * as turf from '@turf/turf';
import { collection, getDocs, query, orderBy, startAfter, limit } from 'firebase/firestore';

import AccidentTable from './components/accidentReport';
import HazardTable from './components/hazardReport';
import PWDTable from './components/pwdReport';
import SeniorTable from './components/seniorReport';
import RoleGuard from '@/components/roleGuard';
import { useAuth } from '@/context/authContext';
import { fetchHazardFromFirebase } from '@/utils/fetchHazards';
import { hazardTypes } from '@/utils/hazardTypes';

const titleMap = {
  pwd: 'List of Persons with Disability',
  senior: 'List of Senior Citizens',
  accident: 'List of Reported Accidents',
  ...hazardTypes.reduce((map, type) => {
    map[type] = `Reported Hazards: ${type}`;
    return map;
  }, {}),
};

function ReportsPageContent() {
  const [selectedReport, setSelectedReport] = useState('pwd');
  const [affectedHouseholds, setAffectedHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [legendProp, setLegendProp] = useState(null);
  const profile = useAuth();

  // Load hazards if selected
  useEffect(() => {
    const loadAffectedHouseholds = async () => {
      if (!hazardTypes.includes(selectedReport)) return;
  
      setLoading(true);
  
      try {
        console.log(`🔄 Loading affected households for ${selectedReport}...`);
  
        const geojson = await fetchHazardFromFirebase(selectedReport);
        if (!geojson?.features?.length) {
          setAffectedHouseholds([]);
          setLegendProp(null);
          setLoading(false);
          return;
        }
  
        // Detect legend property
        const detectedLegendProp = geojson.legendProp?.key
          ? geojson.legendProp
          : {
              key: Object.keys(geojson.features[0].properties || {})[0] || 'Unknown',
              type: typeof Object.values(geojson.features[0].properties || {})[0] === 'number'
                ? 'numeric'
                : 'categorical',
            };
        setLegendProp(detectedLegendProp);
  
        // Batch fetching households
        const batchSize = 100;
        let lastDoc = null;
        const households = [];
  
        while (true) {
          const q = lastDoc
            ? query(collection(db, 'households'), orderBy('__name__'), startAfter(lastDoc), limit(batchSize))
            : query(collection(db, 'households'), orderBy('__name__'), limit(batchSize));
  
          const snapshot = await getDocs(q);
          if (snapshot.empty) break;
  
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
          console.log(`➡ Processing batch of ${snapshot.docs.length} households`);
  
          await Promise.all(snapshot.docs.map(async (hhDoc) => {
            const geoSnap = await getDocs(collection(db, 'households', hhDoc.id, 'geographicIdentification'));
  
            geoSnap.forEach((geoDoc) => {
              const data = geoDoc.data();
              const homes = Array.isArray(data.homes)
                ? data.homes
                : [{ latitude: data.latitude, longitude: data.longitude }];
  
              homes.forEach((home, index) => {
                const lat = Number(home.latitude);
                const lng = Number(home.longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                  households.push({
                    name: `${data.headFirstName || ''} ${data.headLastName || ''}`.trim(),
                    barangay: data.barangay || 'N/A',
                    contactNumber: data.contactNumber || 'N/A',
                    location: { lat, lng },
                    homeLabel: home.label || (index === 0 ? 'Primary Home' : `Secondary Home ${index + 1}`),
                  });
                }
              });
            });
          }));
        }
  
        console.log(`✅ All households fetched: ${households.length}`);
  
        // Filter households affected by hazard polygons
        const affected = households
          .map((h) => {
            const point = turf.point([h.location.lng, h.location.lat]);
            const matchingFeature = geojson.features.find((feature) =>
              turf.booleanPointInPolygon(point, turf.feature(feature.geometry))
            );
            if (!matchingFeature) return null;
            return {
              ...h,
              [detectedLegendProp.key]: matchingFeature.properties[detectedLegendProp.key] ?? 'N/A',
            };
          })
          .filter(Boolean);
  
        console.log(`🎯 Affected households: ${affected.length}`);
        setAffectedHouseholds(affected);
      } catch (err) {
        console.error('❌ Error loading hazard data:', err);
        setAffectedHouseholds([]);
        setLegendProp(null);
      } finally {
        setLoading(false);
      }
    };
  
    loadAffectedHouseholds();
  }, [selectedReport]);
  


  const renderTable = () => {
    const title = titleMap[selectedReport];

    // PWD Table
    if (selectedReport === 'pwd') {
      return (
        <PWDTable
          title={title}
          barangay={profile.role === 'Brgy-Secretary' ? profile.barangay : null}
        />
      );
    }

    // Senior Table
    if (selectedReport === 'senior') {
      return (
        <SeniorTable
          title={title}
          barangay={profile.role === 'Brgy-Secretary' ? profile.barangay : null}
        />
      );
    }

    // Accident Table
    if (selectedReport === 'accident') {
      return <AccidentTable title={title} />;
    }

    // Hazard Table
    if (hazardTypes.includes(selectedReport)) {
      return (
        <HazardTable
          data={affectedHouseholds}
          title={title}
          loading={loading}
          legendProp={legendProp}
          formatValue={(val) => val ?? 'N/A'}
        />
      );
    }

    return null;
  };

  return (
    <div className="p-4">
      {/* Report selection buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['pwd', 'senior', 'accident']
          .filter((key) => profile?.role !== 'Brgy-Secretary' || key !== 'accident')
          .map((key) => (
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

        {profile?.role !== 'Brgy-Secretary' && (
          <select
            onChange={(e) => setSelectedReport(e.target.value)}
            value={hazardTypes.includes(selectedReport) ? selectedReport : ''}
            className={`px-2 py-1 rounded cursor-pointer outline-none transition-all duration-200 ${
              hazardTypes.includes(selectedReport)
                ? 'bg-green-600 text-white font-bold'
                : 'bg-gray-300 text-gray-800 hover:bg-green-400'
            }`}
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
        )}
      </div>

      {/* Render table */}
      <div className="bg-white rounded shadow p-4 overflow-x-auto print:border print:border-gray-300">
        {renderTable()}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <RoleGuard allowedRoles={['MDRRMC-Personnel', 'Brgy-Secretary']}>
      <ReportsPageContent />
    </RoleGuard>
  );
}
