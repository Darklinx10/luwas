'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp, getDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { FiSearch, FiTrash2, FiPlus, FiUploadCloud } from 'react-icons/fi';
import RoleGuard from '@/components/roleGuard';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';



const HazardMapPreview = dynamic(
  () => import('@/components/hazardMapPreview'),
  { ssr: false } // important: disable server-side rendering
);


export default function HazardsPage() {
  const [hazards, setHazards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [geojsonFile, setGeojsonFile] = useState(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const mapRef = useRef(null);

  
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
      const geojson = JSON.parse(content);
  
      if (!geojson.type || (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature')) {
        throw new Error('Invalid GeoJSON structure');
      }
  
      // 2️⃣ Upload to Firebase Storage
      const safeFileName = geojsonFile.name.replace(/\s+/g, '_');
      const storageRef = ref(storage, `hazards/${hazardType}/${Date.now()}-${safeFileName}`);
      const blob = new Blob([JSON.stringify(geojson)], { type: 'application/geo+json' });
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
  
      // 3️⃣ Save raw GeoJSON + metadata in hazardFiles (Firestore)
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
  
      // 5️⃣ UI Updates
      toast.success('Hazard uploaded and saved successfully!');
      setHazardType('');
      setDescription('');
      setGeojsonFile(null);
      setIsModalOpen(false);
  
      fetchHazards(); // Refresh list after upload
  
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
    <RoleGuard allowedRoles={['SeniorAdmin']}>
      <div className="p-4">
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
        <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading...</p>
          ) : filteredHazards.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No hazard layers found.</p>
          ) : (
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Date Uploaded</th>
                  <th className="p-2 border">View</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
              {filteredHazards.map((hazard) => (
                  <tr key={hazard.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{hazard.type}</td>
                    <td className="p-2 border">{hazard.description}</td>
                    <td className="p-2 border">
                      {hazard.createdAt
                        ? new Date(hazard.createdAt.seconds * 1000).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td className="p-2 border">
                      <button
                        onClick={() => handlePreview(hazard)}
                        className="px-2 py-1 text-white bg-green-600 hover:bg-green-700 rounded"
                      >
                        Preview
                      </button>
                    </td>
                    <td className="p-2 border">
                      <button
                        onClick={() => handleDeleteHazard(hazard)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Hazard Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md">
              <h2 className="text-xl font-bold mb-4 text-center">Add Hazard Layer</h2>

              {/* Type */}
              <label className="block text-sm font-medium mb-1">Hazard Type</label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select type</option>
                <option value="Active Faults">Active Faults</option>
                <option value="Landslide">Landslide</option>
                <option value="Earthquake Induced Landslide">Earthquake Induced Landslide</option>
                <option value="Storm Surge">Storm Surge</option>
                <option value="Tsunami">Tsunami</option>
                <option value="Rain Induced Landslide">Rain Induced Landslide</option>
                <option value="Ground Shaking">Ground Shaking</option>
                <option value="Liquefaction">Liquefaction</option>
                <option value="Other">Other</option>
              </select>

              {/* Description */}
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter hazard description..."
              />

              {/* Upload */}
              <label
                htmlFor="hazardGeojsonUpload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <FiUploadCloud className="text-4xl text-green-600 mb-2" />
                <p className="text-gray-700 font-medium">
                  {geojsonFile ? geojsonFile.name : 'Click to upload GeoJSON file'}
                </p>
                <input
                  id="hazardGeojsonUpload"
                  type="file"
                  accept=".geojson,application/geo+json"
                  className="hidden"
                  onChange={(e) => setGeojsonFile(e.target.files[0])}
                />
              </label>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={handleUploadAndSave}
                  disabled={loadingUpload}
                >
                  {loadingUpload ? 'Uploading...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {isPreviewOpen && selectedHazard && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-4xl p-4">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-bold">Preview Hazard Layer</h2>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>
              <div className="h-[500px] w-full">
              <HazardMapPreview geojson={selectedHazard.geojson} />
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}

// 'use client';

// import { useEffect, useState } from 'react';
// import { FiSearch, FiPlus } from 'react-icons/fi';
// import RoleGuard from '@/components/roleGuard';
// import { toast } from 'react-toastify';

// // Services
// import { fetchHazards, deleteHazard, addHazard } from '@/lib/hazardsServices';

// // Components
// import HazardTable from '@/components/hazards/HazardTable';
// import HazardModal from '@/components/hazards/HazardModal';
// import HazardPreview from '@/components/hazards/HazardPreview';

// export default function HazardsPage() {
//   const [hazards, setHazards] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Modal states
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [hazardType, setHazardType] = useState('');
//   const [description, setDescription] = useState('');
//   const [geojsonFile, setGeojsonFile] = useState(null);

//   // Preview states
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);
//   const [selectedHazard, setSelectedHazard] = useState(null);

//   // Fetch hazard list
//   const loadHazards = async () => {
//     setLoading(true);
//     try {
//       const data = await fetchHazards();
//       setHazards(data);
//     } catch (err) {
//       toast.error('Failed to load hazards.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle delete
//   const handleDelete = async (id) => {
//     if (!confirm('Delete this hazard layer?')) return;
//     try {
//       await deleteHazard(id);
//       toast.success('Hazard layer deleted.');
//       loadHazards();
//     } catch {
//       toast.error('Failed to delete hazard.');
//     }
//   };

//   // Handle add new hazard
//   const handleSaveHazard = async () => {
//     if (!hazardType || !description || !geojsonFile) {
//       toast.error('Please fill all fields.');
//       return;
//     }
//     try {
//       await addHazard(hazardType, description, geojsonFile);
//       toast.success('Hazard layer added.');
//       setIsModalOpen(false);
//       setHazardType('');
//       setDescription('');
//       setGeojsonFile(null);
//       loadHazards();
//     } catch {
//       toast.error('Failed to add hazard.');
//     }
//   };

//   // Handle preview
//   const handlePreview = async (hazard) => {
//     try {
//       const response = await fetch(hazard.fileUrl);
//       const geojsonData = await response.json();
//       setSelectedHazard({ ...hazard, geojson: geojsonData });
//       setIsPreviewOpen(true);
//     } catch {
//       toast.error('Failed to load preview.');
//     }
//   };

//   // Filtered hazards
//   const filteredHazards = hazards.filter((hazard) =>
//     `${hazard.type} ${hazard.description}`.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   useEffect(() => {
//     loadHazards();
//   }, []);

//   return (
//     <RoleGuard allowedRoles={['SeniorAdmin']}>
//       <div className="p-4">
//         <div className="text-sm text-right text-gray-500 mb-2">Home / Hazard Management</div>

//         {/* Header */}
//         <div className="bg-green-600 text-white px-4 py-3 rounded-t-md font-semibold text-lg flex justify-between items-center">
//           <span>Hazard Layers</span>
//         </div>

//         {/* Search + Add */}
//         <div className="flex items-center justify-between bg-white shadow px-4 py-3">
//           <div className="relative w-full max-w-md">
//             <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search by type or description"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//             />
//           </div>
//           <div className="ml-4">
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-500"
//             >
//               <FiPlus /> Add Hazard Layer
//             </button>
//           </div>
//         </div>

//         {/* Hazard Table */}
//         <div className="overflow-x-auto shadow border-t-0 rounded-b-md bg-white p-4">
//           {loading ? (
//             <p className="text-center text-gray-500 py-6">Loading...</p>
//           ) : filteredHazards.length === 0 ? (
//             <p className="text-center text-gray-500 py-6">No hazard layers found.</p>
//           ) : (
//             <HazardTable
//               hazards={filteredHazards}
//               onPreview={handlePreview}
//               onDelete={handleDelete}
//             />
//           )}
//         </div>

//         {/* Add Modal */}
//         {isModalOpen && (
//           <HazardModal
//             hazardType={hazardType}
//             setHazardType={setHazardType}
//             description={description}
//             setDescription={setDescription}
//             geojsonFile={geojsonFile}
//             setGeojsonFile={setGeojsonFile}
//             onClose={() => setIsModalOpen(false)}
//             onSave={handleSaveHazard}
//           />
//         )}

//         {/* Preview Modal */}
//         {isPreviewOpen && selectedHazard && (
//           <HazardPreview
//             hazard={selectedHazard}
//             onClose={() => setIsPreviewOpen(false)}
//           />
//         )}
//       </div>
//     </RoleGuard>
//   );
// }
