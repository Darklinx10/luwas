'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const HazardsContext = createContext();

export const HazardsProvider = ({ children }) => {
  const [hazards, setHazards] = useState([]);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [geojsonFile, setGeojsonFile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all hazards from Firestore
  const loadHazards = async () => {
    setLoading(true);
    try {
      const hazardTypes = [
        "Active Faults",
        "Landslide",
        "Earthquake Induced Landslide",
        "Storm Surge",
        "Tsunami",
        "Rain Induced Landslide",
        "Ground Shaking",
        "Liquefaction",
      ];

      const hazardsByType = await Promise.all(
        hazardTypes.map(async (hazardType) => {
          const infoSnap = await getDocs(collection(db, "hazards", hazardType, "hazardInfo"));
          const hazardsData = await Promise.all(
            infoSnap.docs.map(async (infoDoc) => {
              const infoData = infoDoc.data();
              let fileUrl = null;

              if (infoData.fileId) {
                const fileSnap = await getDoc(doc(db, "hazards", hazardType, "hazardFiles", infoData.fileId));
                if (fileSnap.exists()) fileUrl = fileSnap.data().fileUrl || null;
              }

              return {
                id: infoDoc.id,
                type: infoData.type || hazardType,
                description: infoData.description || "",
                infoText: infoData.infoText || "",
                createdAt: infoData.createdAt || null,
                fileId: infoData.fileId || null,
                fileUrl,
              };
            })
          );

          return hazardsData;
        })
      );

      setHazards(hazardsByType.flat());
    } catch (error) {
      console.error("Failed to load hazards:", error);
      setHazards([]);
    }
    setLoading(false);
  };

  // Fetch a single hazard's GeoJSON by its fileId
  const loadHazardGeoJSON = async (hazard) => {
    if (!hazard?.fileId || !hazard?.type) return null;
    try {
      const fileSnap = await getDoc(doc(db, "hazards", hazard.type, "hazardFiles", hazard.fileId));
      if (!fileSnap.exists()) throw new Error('Hazard file not found');
      const geojson = JSON.parse(fileSnap.data().geojsonString);
      setSelectedHazard({ ...hazard, geojson });
      return geojson;
    } catch (error) {
      console.error("Failed to load hazard GeoJSON:", error);
      return null;
    }
  };

  useEffect(() => {
    loadHazards();
  }, []);

  // Public method to manually refresh hazards
  const refreshHazards = async () => {
    await loadHazards();
  };

  return (
    <HazardsContext.Provider value={{
      hazards,
      setHazards,
      selectedHazard,
      setSelectedHazard,
      geojsonFile,
      setGeojsonFile,
      loading,
      loadHazardGeoJSON,
      refreshHazards
    }}>
      {children}
    </HazardsContext.Provider>
  );
};

export const useHazards = () => useContext(HazardsContext);
