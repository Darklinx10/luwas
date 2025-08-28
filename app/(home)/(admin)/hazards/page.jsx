'use client';

import RoleGuard from '@/components/roleGuard';
import { db, storage } from '@/firebase/config';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import AddHazardModal from './components/AddHazardModal';
import HazardPreviewModal from './components/HazardPreviewModal';
import HazardTable from './components/HazardTable';
import { reprojectGeoJSON } from '@/utils/geoJsonProjection';

export default function HazardsPage() {
  const [hazards, setHazards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoText, setInfoText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [geojsonFile, setGeojsonFile] = useState(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  
  // Delete hazard
  const handleDeleteHazard = async (hazard) => {
    if (!confirm('Delete this hazard layer?')) return;
  
    try {
      // Delete hazardInfo
      await deleteDoc(doc(db, 'hazards', hazard.type, 'hazardInfo', hazard.id));
  
      // Delete the raw GeoJSON file
      await deleteDoc(doc(db, 'hazards', hazard.type, 'hazardFiles', hazard.fileId));
  
      toast.success('Hazard layer deleted.');
      fetchHazards();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete hazard.');
    }
  };
  

  // Preview hazard GeoJSON
const handlePreview = async (hazard) => {
  try {
    // hazard.type = "Tsunami", hazard.fileId = id of hazardFiles doc
    const fileSnap = await getDoc(doc(db, 'hazards', hazard.type, 'hazardFiles', hazard.fileId));
    if (!fileSnap.exists()) throw new Error('Hazard file not found');

    const geojsonData = JSON.parse(fileSnap.data().geojsonString);

    setSelectedHazard({ ...hazard, geojson: geojsonData });
    setIsPreviewOpen(true);

  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    toast.error('Failed to load GeoJSON preview.');
  }
};

  // Save hazard: upload GeoJSON to Storage and store metadata in Firestore



  

  
  const handleUploadAndSave = async () => {
    if (!hazardType || !description || !geojsonFile) {
      toast.error('Please fill all fields and select a GeoJSON file.');
      return;
    }
  
    setLoadingUpload(true);
  
    try {
      // 1️⃣ Read GeoJSON content
      const content = await geojsonFile.text();
      let geojson = JSON.parse(content);
  
      if (!geojson.type || (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature')) {
        throw new Error('Invalid GeoJSON structure');
      }
  
      // 1.5️⃣ Reproject GeoJSON
      geojson = reprojectGeoJSON(geojson);
  
      // 2️⃣ Upload to Firebase Storage
      const safeFileName = geojsonFile.name.replace(/\s+/g, '_');
      const storageRef = ref(storage, `hazards/${hazardType}/${Date.now()}-${safeFileName}`);
      const blob = new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' });
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
  
      // 3️⃣ Save raw GeoJSON + metadata in hazardFiles
      const hazardFileRef = await addDoc(
        collection(db, 'hazards', hazardType, 'hazardFiles'),
        {
          name: geojsonFile.name,
          geojsonString: JSON.stringify(geojson),
          fileUrl: downloadURL,
          createdAt: serverTimestamp(),
        }
      );
  
      // 4️⃣ Save hazard info referencing the uploaded file
      await addDoc(
        collection(db, 'hazards', hazardType, 'hazardInfo'),
        {
          fileId: hazardFileRef.id,
          type: hazardType,
          description,
          createdAt: serverTimestamp(),
        }
      );
  
      // 5️⃣ UI updates
      toast.success('Hazard uploaded, reprojected, and saved successfully!');
      setHazardType('');
      setDescription('');
      setInfoText('');
      setGeojsonFile(null);
      setIsModalOpen(false);
  
      fetchHazards(); // Refresh list
  
    } catch (error) {
      console.error(error);
      toast.error(`Failed to upload and save hazard: ${error.message}`);
    } finally {
      setLoadingUpload(false);
    }
  };
  
  
  
  // Fetch all hazards (by type)
  const fetchHazards = async () => {
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
  
      // Fetch all hazard types concurrently
      const hazardsByType = await Promise.all(
        hazardTypes.map(async (hazardType) => {
          const infoSnap = await getDocs(
            collection(db, "hazards", hazardType, "hazardInfo")
          );
  
          // Fetch files for each hazard info concurrently
          const hazardsData = await Promise.all(
            infoSnap.docs.map(async (infoDoc) => {
              const infoData = infoDoc.data();
              let fileUrl = null;
  
              if (infoData.fileId) {
                const fileSnap = await getDoc(
                  doc(db, "hazards", hazardType, "hazardFiles", infoData.fileId)
                );
                if (fileSnap.exists()) {
                  fileUrl = fileSnap.data().fileUrl || null;
                }
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
  
      // Flatten array of arrays into a single array
      setHazards(hazardsByType.flat());
  
    } catch (error) {
      console.error(error);
      toast.error("Failed to load hazard layers.");
    } finally {
      setLoading(false);
    }
  };
  
  // 🔍 Filtered hazards based on search
  const filteredHazards = hazards.filter((hazard) =>
    `${hazard.type} ${hazard.description}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    fetchHazards();
  }, []);
  

  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
    <div className="p-4 bg-gradient-to-t from-green-50 to-white">
        <div className="text-sm text-right text-gray-500 mb-2">Home / Hazard Management</div>

        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg flex justify-between items-center">
          <span>Hazard Layers</span>
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between bg-white shadow px-4 py-3">
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by type or description"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="ml-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <FiPlus /> Add Hazard Layer
            </button>
          </div>
        </div>

        {/* Table */}
        <HazardTable
          loading={loading}
          filteredHazards={filteredHazards}
          handlePreview={handlePreview}
          handleDeleteHazard={handleDeleteHazard}
        />

        {/* Add Hazard Modal */}
        <AddHazardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hazardType={hazardType}
          setHazardType={setHazardType}
          description={description}
          setDescription={setDescription}
          infoText={infoText}
          setInfoText={setInfoText}
          geojsonFile={geojsonFile}
          setGeojsonFile={setGeojsonFile}
          handleUploadAndSave={handleUploadAndSave}
          loadingUpload={loadingUpload}
        />

        {/* Preview Modal */}
        <HazardPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          hazard={selectedHazard}
        />

      </div>
    </RoleGuard>
  );
}
