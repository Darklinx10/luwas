/**
 * Hook for Hazards report data management
 * Loads hazard GeoJSON and affected households
 */

import { useEffect, useState } from 'react';
import { fetchHazardReport } from '../services/reportApi';
import * as turf from '@turf/turf';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy, startAfter, limit } from 'firebase/firestore';
import { toast } from 'react-toastify';

export const useHazardsReport = (selectedHazardType) => {
  const [affectedHouseholds, setAffectedHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [legendProp, setLegendProp] = useState(null);
  const [hazardGeoJSON, setHazardGeoJSON] = useState(null);

  // Fetch hazard data and affected households
  const fetchHazardData = async (hazardType) => {
    setLoading(true);

    try {
      console.log(`🔄 Loading affected households for ${hazardType}...`);

      // Fetch hazard GeoJSON
      const geojson = await fetchHazardReport(hazardType);

      if (!geojson?.features?.length) {
        setAffectedHouseholds([]);
        setLegendProp(null);
        setHazardGeoJSON(null);
        setLoading(false);
        return;
      }

      setHazardGeoJSON(geojson);

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

      // Batch fetch households
      const batchSize = 100;
      let lastDoc = null;
      const households = [];

      while (true) {
        const q = lastDoc
          ? query(
              collection(db, 'households'),
              orderBy('__name__'),
              startAfter(lastDoc),
              limit(batchSize)
            )
          : query(collection(db, 'households'), orderBy('__name__'), limit(batchSize));

        const snapshot = await getDocs(q);
        if (snapshot.empty) break;

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        console.log(`➡ Processing batch of ${snapshot.docs.length} households`);

        await Promise.all(
          snapshot.docs.map(async (hhDoc) => {
            const geoSnap = await getDocs(
              collection(db, 'households', hhDoc.id, 'geographicIdentification')
            );

            geoSnap.forEach((geoDoc) => {
              const data = geoDoc.data();
              const homes = Array.isArray(data.homes)
                ? data.homes
                : [{ latitude: data.latitude, longitude: data.longitude, sitio: data.sitio }];

              homes.forEach((home, index) => {
                const lat = Number(home.latitude);
                const lng = Number(home.longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                  households.push({
                    name: `${data.headFirstName || ''} ${data.headLastName || ''}`.trim(),
                    barangay: data.barangay || 'N/A',
                    sitio: home.sitio || data.sitio || 'N/A',
                    contactNumber: data.contactNumber || 'N/A',
                    location: { lat, lng },
                    homeLabel: home.label || (index === 0 ? 'Primary Home' : `Secondary Home ${index + 1}`),
                  });
                }
              });
            });
          })
        );
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
      toast.error(`Failed to load ${hazardType} hazard data.`);
      setAffectedHouseholds([]);
      setLegendProp(null);
      setHazardGeoJSON(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when hazard type changes
  useEffect(() => {
    if (selectedHazardType) {
      fetchHazardData(selectedHazardType);
    }
  }, [selectedHazardType]);

  return {
    affectedHouseholds,
    loading,
    legendProp,
    hazardGeoJSON,
    refetch: () => selectedHazardType && fetchHazardData(selectedHazardType),
  };
};
