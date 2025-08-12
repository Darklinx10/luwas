'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { FiSearch, FiTrash2, FiPlus, FiUploadCloud } from 'react-icons/fi';
import RoleGuard from '@/components/roleGuard';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

//Dynamically import Leaflet map components (client-side only)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });



export default function HazardsPage() {
  // Hazard list state
  const [hazards, setHazards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [geojsonFile, setGeojsonFile] = useState(null);
  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);

  // Preview selected hazard's GeoJSON on map
  const handlePreview = async (hazard) => {
    try {
      const response = await fetch(hazard.fileUrl);
      const geojsonData = await response.json();

      setSelectedHazard({
        ...hazard,
        geojson: geojsonData,
      });
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error loading GeoJSON:', error);
      toast.error('Failed to load GeoJSON preview.');
    }
  };



  // Fetch hazards
  const fetchHazards = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'hazards'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHazards(data);
    } catch (error) {
      console.error('Error fetching hazards:', error);
      toast.error('Failed to load hazard layers.');
    } finally {
      setLoading(false);
    }
  };

  // Delete hazard
  const handleDelete = async (id) => {
    if (!confirm('Delete this hazard layer?')) return;
    try {
      await deleteDoc(doc(db, 'hazards', id));
      toast.success('Hazard layer deleted.');
      fetchHazards();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete hazard.');
    }
  };

  // Save new hazard
  const handleSaveHazard = async () => {
    if (!hazardType || !description || !geojsonFile) {
      toast.error('Please fill all fields and upload a file.');
      return;
    }
    try {
      // Upload GeoJSON to Firebase Storage
      const fileRef = ref(storage, `hazards/${Date.now()}-${geojsonFile.name}`);
      await uploadBytes(fileRef, geojsonFile);
      const downloadURL = await getDownloadURL(fileRef);

      // Save metadata in Firestore
      await addDoc(collection(db, 'hazards'), {
        type: hazardType,
        description,
        fileUrl: downloadURL,
        createdAt: serverTimestamp(),
      });

      toast.success('Hazard layer added.');
      setIsModalOpen(false);
      setHazardType('');
      setDescription('');
      setGeojsonFile(null);
      fetchHazards();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add hazard.');
    }
  };
  //Search Filter
  const filteredHazards = hazards.filter((hazard) =>
    `${hazard.type} ${hazard.description}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //Fetch hazards on first render
  useEffect(() => {
    fetchHazards();
  }, []);

  return (
    <RoleGuard allowedRoles={['SeniorAdmin']}>
      <div className="p-4">
        <div className="text-sm text-right text-gray-500 mb-2">
          Home / Hazard Management
        </div>

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
              onClick={() => {
                setLoading(true);
                setIsModalOpen(true);
                setTimeout(() => setLoading(false), 1000);
              }}
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
                        onClick={() => handleDelete(hazard.id)}
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
                <option value="Flood">Active Faults</option>
                <option value="Landslide">Landslide</option>
                <option value="Earthquake">Earthquake Induced Landslide</option>
                <option value="Storm Surge">Storm Surge</option>
                <option value="Other">Tsunami</option>
                <option value="Other">Rain Induced Landslide</option>
                <option value="Other">Ground Shaking</option>
                <option value="Other">Liquefaction</option>
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
                  onClick={handleSaveHazard}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

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
                <MapContainer center={[12.8797, 121.7740]} zoom={6} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {selectedHazard.geojson && (
                    <GeoJSON data={selectedHazard.geojson} />
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
