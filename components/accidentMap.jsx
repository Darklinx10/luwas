'use client';

import { useState } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { db } from '@/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function AccidentMapForm({ onSubmit }) {
  const [position, setPosition] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    description: '',
    datetime: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return;

    try {
      const data = {
        type: formData.type,
        severity: formData.severity,
        description: formData.description,
        datetime: formData.datetime,
        position: {
          lat: position.lat,
          lng: position.lng,
        },
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'accidents'), data);

      toast.success('Accident data submitted successfully!');
      if (onSubmit) onSubmit(data);

      setPosition(null);
      setFormData({ type: '', severity: '', description: '', datetime: '' });
    } catch (error) {
      console.error('Error submitting accident:', error);
      toast.error('Failed to submit accident.');
    }
  };

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })}
    >
      <Popup>
        <div className="w-72">
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="type" className="block text-sm font-medium">Type</label>
              <input
                id="type"
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="border w-full p-1 rounded"
              />
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium">Severity</label>
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
              <label htmlFor="description" className="block text-sm font-medium">Description</label>
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
              <label htmlFor="datetime" className="block text-sm font-medium">Date & Time</label>
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

            <button
              type="submit"
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Submit
            </button>
          </form>

        </div>
      </Popup>
    </Marker>
  );
}
