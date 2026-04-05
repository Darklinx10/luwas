'use client';

import { useState } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { mapApi } from '../../services/mapApi';

export default function AccidentMapForm({ onSubmit }) {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    description: '',
    datetime: '',
  });

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return;
    if (!formData.type || !formData.severity || !formData.datetime) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;

      // Upload image if provided
      if (file) {
        const storageRef = ref(storage, `accidents/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      // ✅ FIXED: Use API instead of direct Firestore - includes auth, audit trail, server timestamp
      const accidentData = {
        ...formData,
        lat: position.lat,
        lng: position.lng,
        barangay: '', // Will be set by API based on user's barangay or coordinates
        imageUrl,
      };

      const result = await mapApi.createAccident(accidentData);
      toast.success('Accident reported successfully!');
      if (onSubmit) onSubmit(result.accident);

      // reset form
      setPosition(null);
      setFormData({ type: '', severity: '', description: '', datetime: '' });
      setFile(null);
    } catch (error) {
      console.error('Error submitting accident:', error);
      toast.error(error.message || 'Failed to report accident.');
    } finally {
      setLoading(false);
    }
  };

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={L.icon({
        iconUrl: '/leaflet-icons/accident-icon.svg',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })}
    >
      <Popup>
        <div className="w-72">
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Accident Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="border w-full p-2 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="">Select accident type</option>
                <option value="car-collision">Car Collision</option>
                <option value="truck-accident">Truck Accident</option>
                <option value="bus-accident">Bus Accident</option>
                <option value="motorcycle-accident">Motorcycle Accident</option>
                <option value="tricycle-accident">Tricycle Accident</option>
                <option value="bicycle-accident">Bicycle Accident</option>
                <option value="pedestrian-accident">Pedestrian Accident</option>
                <option value="hit-and-run">Hit and Run</option>
                <option value="vehicle-overturn">Vehicle Overturn / Rollover</option>
                <option value="rear-end-collision">Rear-End Collision</option>
                <option value="head-on-collision">Head-On Collision</option>
                <option value="side-impact">Side-Impact / T-Bone</option>
                <option value="multiple-vehicle-collision">Multiple Vehicle Collision</option>
                <option value="road-obstruction">Road Obstruction</option>
                <option value="fallen-tree">Fallen Tree / Debris</option>
                <option value="slippery-road">Slippery / Oil Spill Incident</option>
                <option value="pothole-accident">Pothole / Poor Road Condition</option>
                <option value="bridge-collapse">Bridge Collapse / Road Damage</option>
                <option value="landslide">Landslide</option>
                <option value="flooding">Flooding</option>
                <option value="earthquake-damage">Earthquake Damage</option>
                <option value="vehicle-fire">Vehicle Fire</option>
                <option value="fuel-spill">Fuel Spill</option>
                <option value="explosion">Explosion / Chemical Accident</option>
                <option value="animal-crossing">Animal Crossing Accident</option>
                <option value="unknown">Other / Unspecified</option>
              </select>
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium">Accident Severity</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
                className="border w-full p-1 rounded"
              >
                <option value="">Select</option>
                <option value="Minor">Minor</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium">Accident Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="border w-full p-1 rounded"
              />
            </div>

            <div>
              <label htmlFor="datetime" className="block text-sm font-medium">Accident Date & Time</label>
              <input
                id="datetime"
                type="datetime-local"
                name="datetime"
                value={formData.datetime}
                onChange={handleChange}
                required
                className="border w-full p-1 rounded"
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium">Upload Accident Picture</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
                className="border w-full p-1 rounded"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`bg-green-600 text-white px-3 py-1 rounded w-full flex justify-center items-center hover:bg-green-700 transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>
      </Popup>
    </Marker>
  );
}
