/**
 * Hook for Hazards report data management
 * ✅ FIXED: Added caching, better homes array handling, and error handling
 * Loads hazard GeoJSON and affected households
 */

import { useEffect, useState, useRef } from 'react';
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

  // ✅ FIXED: Cache to avoid re-computing on every render
  const cacheRef = useRef({});

  // Fetch hazard data and affected households
  const fetchHazardData = async (hazardType) => {
    // ✅ FIXED: Check cache first
    if (cacheRef.current[hazardType]) {
      const cached = cacheRef.current[hazardType];
      setAffectedHouseholds(cached.affectedHouseholds);
      setLegendProp(cached.legendProp);
      setHazardGeoJSON(cached.hazardGeoJSON);
      return;
    }

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

      // Batch fetch households from parent docs (new structure)
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

        snapshot.docs.forEach((hhDoc) => {
          const data = hhDoc.data();
          
          // ✅ FIXED: Better homes array handling with fallback
          const homes = Array.isArray(data.homes) ? data.homes : [];

          if (homes.length > 0) {
            // ✅ Preferred: Use homes array structure
            homes.forEach((home, index) => {
              // ✅ Validate coordinates before using
              const lat = Number(home.latitude);
              const lng = Number(home.longitude);
              
              if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                households.push({
                  name: `${data.headFirstName || ''} ${data.headLastName || ''}`.trim(),
                  barangay: data.barangay || 'N/A',
                  sitio: home.sitio || data.sitio || 'N/A',
                  contactNumber: data.contactNumber || 'N/A',
                  location: { lat, lng },
                  homeLabel: home.label || (index === 0 ? 'Primary Home' : `Secondary Home ${index}`),
                });
              }
            });
          } else if (data.latitude !== null && data.longitude !== null && data.latitude !== undefined && data.longitude !== undefined) {
            // ✅ Fallback: Household document has direct latitude/longitude
            const lat = Number(data.latitude);
            const lng = Number(data.longitude);
            
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              households.push({
                name: `${data.headFirstName || ''} ${data.headLastName || ''}`.trim(),
                barangay: data.barangay || 'N/A',
                sitio: data.sitio || 'N/A',
                contactNumber: data.contactNumber || 'N/A',
                location: { lat, lng },
                homeLabel: 'Primary Home',
              });
            }
          }
        });
      }

      console.log(`✅ All households fetched: ${households.length}`);

      // Filter households affected by hazard polygons
      const affected = households
        .map((h) => {
          try {
            const point = turf.point([h.location.lng, h.location.lat]);
            const matchingFeature = geojson.features.find((feature) => {
              try {
                return turf.booleanPointInPolygon(point, turf.feature(feature.geometry));
              } catch (err) {
                console.warn('⚠️ Error checking polygon:', err.message);
                return false;
              }
            });
            
            if (!matchingFeature) return null;
            
            return {
              ...h,
              [detectedLegendProp.key]: matchingFeature.properties[detectedLegendProp.key] ?? 'N/A',
            };
          } catch (err) {
            console.warn(`⚠️ Error processing household ${h.name}:`, err);
            return null;
          }
        })
        .filter(Boolean);

      console.log(`🎯 Affected households: ${affected.length}`);
      setAffectedHouseholds(affected);

      // ✅ FIXED: Cache the results
      cacheRef.current[hazardType] = {
        affectedHouseholds: affected,
        legendProp: detectedLegendProp,
        hazardGeoJSON: geojson,
      };
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

  // ✅ FIXED: Fetch when hazard type changes only, thanks to dependency array
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
