'use client';

import RoleGuard from '@/components/roleGuard';
import { db, storage } from '@/firebase/config';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import HazardPreviewModal from './components/HazardPreviewModal';
import HazardTable from './components/HazardTable';
import { reprojectGeoJSON } from '@/utils/geoJsonProjection';
import { hazardTypes } from '@/utils/hazardTypes';

const AddHazardModal = dynamic(() => import('./components/AddHazardModal'), { ssr: false });


export default function HazardsPage() {
  const [hazards, setHazards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [geojsonFile, setGeojsonFile] = useState(null);
  const [legendProp, setLegendProp] = useState(null);
  const [colorSettings, setColorSettings] = useState({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  /** 🔹 Fetch all hazards grouped by type */
  const fetchHazards = async () => {
    setLoading(true);
    try {
      const hazardsByType = await Promise.all(
        hazardTypes.map(async (hazardType) => {
          const infoSnap = await getDocs(collection(db, 'hazards', hazardType, 'hazardInfo'));

          const hazardsData = await Promise.all(
            infoSnap.docs.map(async (infoDoc) => {
              const infoData = infoDoc.data();
              let fileUrl = null;

              if (infoData.fileId) {
                const fileSnap = await getDoc(
                  doc(db, 'hazards', hazardType, 'hazardFiles', infoData.fileId)
                );
                if (fileSnap.exists()) {
                  fileUrl = fileSnap.data().fileUrl || null;
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
              };
            })
          );

          return hazardsData;
        })
      );

      setHazards(hazardsByType.flat());
    } catch (error) {
      console.error('Error fetching hazards:', error);
      toast.error('Failed to load hazard layers.');
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Delete hazard info + file */
  const handleDeleteHazard = async (hazard) => {
    if (!confirm('Are you sure you want to delete this hazard layer?')) return;

    try {
      await deleteDoc(doc(db, 'hazards', hazard.type, 'hazardInfo', hazard.id));
      if (hazard.fileId) {
        await deleteDoc(doc(db, 'hazards', hazard.type, 'hazardFiles', hazard.fileId));
      }

      toast.success('Hazard layer deleted successfully.');
      fetchHazards();
    } catch (error) {
      console.error('Error deleting hazard:', error);
      toast.error('Failed to delete hazard.');
    }
  };

  /** 🔹 Preview hazard (load geojson + legend/color) */
  const handlePreview = async (hazard) => {
    try {
      const fileRef = doc(db, 'hazards', hazard.type, 'hazardFiles', hazard.fileId);
      const fileSnap = await getDoc(fileRef);
      if (!fileSnap.exists()) throw new Error('Hazard file not found');

      const fileData = fileSnap.data();
      if (!fileData.geojsonString) throw new Error('GeoJSON data missing');

      let geojsonData;
      try {
        geojsonData = JSON.parse(fileData.geojsonString);
      } catch {
        throw new Error('Invalid GeoJSON format');
      }

      const infoRef = doc(db, 'hazards', hazard.type, 'hazardInfo', hazard.id);
      const infoSnap = await getDoc(infoRef);

      let legendProp = null;
      let colorSettings = {};
      if (infoSnap.exists()) {
        const infoData = infoSnap.data();
        legendProp = infoData.legendProp || null;
        colorSettings = infoData.colorSettings || {};
      }

      setSelectedHazard({
        ...hazard,
        geojson: geojsonData,
        legendProp,
        colorSettings,
      });

      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error loading GeoJSON preview:', error);
      toast.error(error.message || 'Failed to load GeoJSON preview.');
    }
  };

  /** 🔹 Upload & save new hazard */
  const handleUploadAndSave = async (legendProp, colorSettings) => {
    if (!hazardType || !description || !geojsonFile) {
      toast.error('Please fill all fields and select a valid GeoJSON file.');
      return;
    }
  
    if (geojsonFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }
  
    setLoadingUpload(true);
  
    try {
      // 1️⃣ Read raw file and parse
      const content = await geojsonFile.text();
      const geojsonData = JSON.parse(content);
  
      // 2️⃣ Validate structure
      if (
        !geojsonData.type ||
        (geojsonData.type !== 'FeatureCollection' && geojsonData.type !== 'Feature')
      ) {
        throw new Error('Invalid GeoJSON: Must be a Feature or FeatureCollection');
      }
      if (
        geojsonData.type === 'FeatureCollection' &&
        (!geojsonData.features || !Array.isArray(geojsonData.features))
      ) {
        throw new Error('Invalid GeoJSON: FeatureCollection must have a features array');
      }
  
      // 3️⃣ Reproject GeoJSON
      const geojson = reprojectGeoJSON(geojsonData);
  
      // 4️⃣ Prepare safe filename
      const safeFileName = geojsonFile.name
        .replace(/[\s\/\\:*?"<>|]+/g, '_')
        .replace(/\.geojson$/i, '')
        .substring(0, 100);
  
      const storagePath = `hazards/${hazardType}/${Date.now()}-${safeFileName}.geojson`;
      const storageRef = ref(storage, storagePath);
  
      // 5️⃣ Upload file to Firebase Storage
      const blob = new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' });
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
  
      // 6️⃣ Save metadata in Firestore
      const hazardFilesCollection = collection(db, 'hazards', hazardType, 'hazardFiles');
      const hazardInfoCollection = collection(db, 'hazards', hazardType, 'hazardInfo');
  
      const hazardFileRef = await addDoc(hazardFilesCollection, {
        name: geojsonFile.name,
        geojsonString: JSON.stringify(geojson), // save reprojected
        fileUrl: downloadURL,
        createdAt: serverTimestamp(),
      });
  
      await addDoc(hazardInfoCollection, {
        fileId: hazardFileRef.id,
        type: hazardType,
        description,
        legendProp: legendProp || null,
        colorSettings: colorSettings || {},
        createdAt: serverTimestamp(),
      });
  
      // 7️⃣ UI updates
      toast.success('Hazard uploaded, reprojected, and saved successfully!');
      setHazardType('');
      setDescription('');
      setGeojsonFile(null);
      setLegendProp(null);
      setColorSettings({});
      setIsModalOpen(false);
  
      await fetchHazards();
    } catch (error) {
      console.error('Error uploading hazard:', error);
      toast.error(error.message || 'Failed to upload hazard');
    } finally {
      setLoadingUpload(false);
    }
  };
  
  const filteredHazards = hazards.filter((hazard) =>
    `${hazard.type || ''} ${hazard.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchHazards();
  }, []);

  return (
    <RoleGuard allowedRoles={['MDRRMC-Admin']}>
      <div className="p-4">
        <div className="text-sm text-right text-gray-500 mb-2">
          Home / Hazard Management
        </div>

        <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg flex justify-between items-center">
          <span>Hazard Layers</span>
        </div>

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
            disabled={loading}
            className="
              group relative flex items-center justify-center gap-2
              px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            <FiPlus className="text-lg transform group-hover:scale-110 transition-transform duration-200" />

            {/* Visible label for md+, tooltip for small screens */}
            <span className="hidden md:inline">Add Hazard Layer</span>

            {/* Tooltip below the button on mobile */}
            <span
              className="
                absolute top-full mt-2 px-2 py-1 rounded-md bg-gray-800 text-white text-xs
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                whitespace-nowrap md:hidden
              "
            >
              Add Hazard Layer
            </span>
          </button>



          </div>
        </div>

        <HazardTable
          loading={loading}
          filteredHazards={filteredHazards}
          handlePreview={handlePreview}
          handleDeleteHazard={handleDeleteHazard}
        />

        <AddHazardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hazardType={hazardType}
          setHazardType={setHazardType}
          description={description}
          setDescription={setDescription}
          geojsonFile={geojsonFile}
          setGeojsonFile={setGeojsonFile}
          legendProp={legendProp}
          setLegendProp={setLegendProp}
          colorSettings={colorSettings}
          setColorSettings={setColorSettings}
          handleUploadAndSave={handleUploadAndSave}
          loadingUpload={loadingUpload}
        />

        <HazardPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          hazard={selectedHazard}
        />
      </div>
    </RoleGuard>
  );
}
