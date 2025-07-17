'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

const MapPopup = dynamic(() => import('@/components/mapPopUp'), { ssr: false });

export default function EditHouseholdModal({ open, onClose, householdId }) {
  const [mapOpen, setMapOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    headFirstName: '',
    headMiddleName: '',
    headLastName: '',
    headSuffix: '',
    barangay: '',
    headSex: '',
    contactNumber: '',
    headAge: '',
    latitude: '',
    longitude: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchHousehold = async () => {
      if (!open || !householdId) return;
      setLoading(true);
      try {
        const ref = doc(db, 'households', householdId, 'geographicIdentification', 'main');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setForm((prev) => ({ ...prev, ...snap.data() }));
        } else {
          toast.error('Household not found');
          onClose();
        }
      } catch (err) {
        toast.error('Failed to fetch household data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHousehold();
  }, [open, householdId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ref = doc(db, 'households', householdId, 'geographicIdentification', 'main');
      await updateDoc(ref, {
        ...form,
        updatedAt: new Date(),
      });

      toast.success('Household updated successfully');
      onClose(); // Close modal after save
    } catch (err) {
      toast.error('Error updating household');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = (position) => {
    setForm((prev) => ({
      ...prev,
      latitude: position.lat.toFixed(6),
      longitude: position.lng.toFixed(6),
    }));
    setMapOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4">Edit Household</h2>

        {loading ? (
          <p className="text-center text-gray-500 mb-4 animate-pulse">Loading data...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-2 gap-4 bg-white p-2"
          >
            {[
              ['headFirstName', 'First Name'],
              ['headMiddleName', 'Middle Name'],
              ['headLastName', 'Last Name'],
              ['headSuffix', 'Suffix'],
              ['barangay', 'Barangay'],
              ['headSex', 'Sex'],
              ['contactNumber', 'Contact Number'],
              ['headAge', 'Age'],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <input
                  type={name === 'headAge' ? 'number' : 'text'}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="mt-1 p-2 w-full border border-gray-300 rounded"
                  required={name !== 'headSuffix'}
                />
              </div>
            ))}

            {/* Coordinates Section */}
            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  value={form.latitude}
                  readOnly
                  className="mt-1 p-2 w-full bg-gray-100 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="text"
                  name="longitude"
                  value={form.longitude}
                  readOnly
                  className="mt-1 p-2 w-full bg-gray-100 border rounded"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Pick Location from Map
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-white rounded ${
                  loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        )}

        <MapPopup
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          onSave={handleSaveLocation}
          location={
            form.latitude && form.longitude
              ? { lat: parseFloat(form.latitude), lng: parseFloat(form.longitude) }
              : null
          }
          readOnly={false}
          mode="household"
        />
      </div>
    </div>
  );
}
