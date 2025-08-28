import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export const fetchHazardFromFirebase = async (hazardType) => {
  try {
    const hazardFilesRef = collection(db, 'hazards', hazardType, 'hazardFiles');
    const snapshot = await getDocs(hazardFilesRef);

    if (snapshot.empty) {
      console.warn(`No hazard files found for ${hazardType}`);
      return null;
    }

    // Combine all GeoJSON features from all documents
    const allFeatures = snapshot.docs.flatMap(doc => {
      const data = doc.data();
      if (!data.geojsonString) return [];
      const geojson = JSON.parse(data.geojsonString);
      return geojson.features || [];
    });

    if (allFeatures.length === 0) return null;

    return {
      type: 'FeatureCollection',
      features: allFeatures
    };
  } catch (err) {
    console.error(`Error fetching hazard files for ${hazardType}:`, err);
    return null;
  }
};