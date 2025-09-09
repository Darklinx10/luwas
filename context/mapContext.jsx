// src/context/mapContext.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from './authContext';

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const { user } = useAuth();  // 🔹 check if signed in
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState(null);
  const [defaultCenter, setDefaultCenter] = useState([9.941975, 124.033194]);
  const [plusMarkers, setPlusMarkers] = useState([]);

  // Fetch default center (real-time)
  useEffect(() => {
    if (!user) return; // 🔹 skip if logged out

    const docRef = doc(db, 'settings', 'mapCenter');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lat && data.lng) setDefaultCenter([data.lat, data.lng]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch boundary once
  useEffect(() => {
    if (!user) return; // 🔹 skip if logged out

    const fetchBoundary = async () => {
      try {
        const docRef = doc(db, 'settings', 'boundaryFile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const geojson = JSON.parse(docSnap.data().data);
          setBoundaryGeoJSON(geojson);
        }
      } catch (err) {
        console.error('Error fetching boundary:', err);
      }
    };
    fetchBoundary();
  }, [user]);

  // Optional: refresh default center manually
  const refreshMapCenter = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'settings', 'mapCenter');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lat && data.lng) setDefaultCenter([data.lat, data.lng]);
      }
    } catch (err) {
      console.error('Error refreshing default center:', err);
    }
  };

  return (
    <MapContext.Provider value={{ boundaryGeoJSON, setBoundaryGeoJSON, defaultCenter, setDefaultCenter, refreshMapCenter, plusMarkers, setPlusMarkers }}>
      {children}
    </MapContext.Provider>
  );
};

// ✅ Correct hook export
export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMap must be used within a MapProvider');
  return context;
};
