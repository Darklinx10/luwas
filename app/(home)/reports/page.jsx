'use client';

import { db } from '@/firebase/config';
import * as turf from '@turf/turf';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import AccidentTable from '@/app/(home)/reports/components/accidentReport';
import HazardTable from '@/app/(home)/reports/components/hazardReport';
import PWDTable from '@/app/(home)/reports/components/pwdReport';
import SeniorTable from '@/app/(home)/reports/components/seniorReport';
import RoleGuard from '@/components/roleGuard';
import { useAuth } from '@/context/authContext';
import { fetchHazardFromFirebase } from "@/utils/fetchHazards";
import { hazardTypes } from '@/utils/hazardTypes';

const reportData = {};

const titleMap = {
  pwd: 'List of Person with Disability (2025)',
  senior: 'List of Senior Citizens (2025)',
  accident: 'List of Reported Accidents (2025)',
  ...hazardTypes.reduce((map, type) => {
    map[type] = `Reported Hazards: ${type} (2025)`;
    return map;
  }, {}),
};

function ReportsPageContent() {
  const [selectedReport, setSelectedReport] = useState('pwd');
  const [affectedHouseholds, setAffectedHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [legendProp, setLegendProp] = useState(null); // default
  const profile = useAuth();

  useEffect(() => {
    const loadAffectedHouseholds = async () => {
      if (!hazardTypes.includes(selectedReport)) return;
  
      setLoading(true);
      try {
        const geojson = await fetchHazardFromFirebase(selectedReport);
  
        if (!geojson?.features?.length) {
          setAffectedHouseholds([]);
          setLegendProp(null);
          setLoading(false);
          return;
        }
  
        // Automatically determine legendProp (first property key)
        let detectedLegendProp = geojson.legendProp?.key ? geojson.legendProp : null;
        if (!detectedLegendProp) {
          const firstFeatureProps = geojson.features[0].properties || {};
          const keys = Object.keys(firstFeatureProps);
          if (keys.length) {
            const key = keys[0];
            detectedLegendProp = {
              key,
              type: typeof firstFeatureProps[key] === 'number' ? 'numeric' : 'categorical',
            };
          } else {
            detectedLegendProp = { key: 'Unknown', type: 'categorical' };
          }
        }
        setLegendProp(detectedLegendProp);
  
        // Fetch households
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
                contactNumber: data.contactNumber || 'N/A',
                location: { lat, lng },
              });
            }
          });
        }
  
        // Determine affected households
        const affected = [];
  
        households.forEach((h) => {
          const point = turf.point([h.location.lng, h.location.lat]);
  
          for (const feature of geojson.features) {
            const polygon = turf.feature(feature.geometry);
  
            if (turf.booleanPointInPolygon(point, polygon)) {
              affected.push({
                ...h,
                ...feature.properties,
              });
              break; // stop checking other features once matched
            }
          }
        });
  
        setAffectedHouseholds(affected);
      } catch (err) {
        console.error('Error loading hazard data:', err);
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

    // Filter data for Brgy-Secretary by their barangay
    let filteredData = undefined;
    if (profile?.role === 'Brgy-Secretary') {
      if (selectedReport === 'pwd') {
        filteredData = reportData.pwd?.filter(item => item.barangay === profile.barangay);
        return <PWDTable title={title} data={filteredData} />;
      }
      if (selectedReport === 'senior') {
        filteredData = reportData.senior?.filter(item => item.barangay === profile.barangay);
        return <SeniorTable title={title} data={filteredData} />;
      }
      return null;
    }

    // For other roles, show all reports
    if (selectedReport === 'pwd') return <PWDTable title={title} data={reportData.pwd} />;
    if (selectedReport === 'senior') return <SeniorTable title={title} data={reportData.senior} />;
    if (selectedReport === 'accident') return <AccidentTable data={reportData.accident} title={title} />;
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
        )}
      </div>

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
