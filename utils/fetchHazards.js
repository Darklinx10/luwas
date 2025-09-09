import { db } from '@/firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export const fetchHazardFromFirebase = async (hazardType) => {
  try {
    const infoSnap = await getDocs(
      collection(db, 'hazards', hazardType, 'hazardInfo')
    );

    if (infoSnap.empty) {
      console.warn(`No hazard info found for ${hazardType}`);
      return [];
    }

    const hazardsData = await Promise.all(
      infoSnap.docs.map(async (infoDoc) => {
        const infoData = infoDoc.data();
        let fileUrl = null;
        let features = [];

        if (infoData.fileId) {
          const fileSnap = await getDoc(
            doc(db, 'hazards', hazardType, 'hazardFiles', infoData.fileId)
          );
          if (fileSnap.exists()) {
            const fileData = fileSnap.data();
            fileUrl = fileData.fileUrl || null;
            if (fileData.geojsonString) {
              const geojson = JSON.parse(fileData.geojsonString);
              features = geojson.features || [];
            }
          }
        }

        return {
          id: infoDoc.id,
          type: infoData.type || hazardType,
          description: infoData.description || '',
          createdAt: infoData.createdAt || null,
          fileId: infoData.fileId || null,
          fileUrl,
          legendProp: infoData.legendProp || null,
          colorSettings: infoData.colorSettings || {},
          features, // ✅ include parsed GeoJSON features
        };
      })
    );

    // If multiple hazardInfo docs exist, merge features for the activeHazard
    const merged = hazardsData.reduce(
      (acc, item) => ({
        ...item,
        features: [...(acc.features || []), ...(item.features || [])],
      }),
      { features: [] }
    );

    return merged;
  } catch (err) {
    console.error(`Error fetching hazard data for ${hazardType}:`, err);
    toast.error('Failed to load hazard layers.');
    return null;
  }
};
