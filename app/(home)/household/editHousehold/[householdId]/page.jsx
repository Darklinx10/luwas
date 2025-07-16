'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

const MapPopup = dynamic(() => import('@/components/mapPopUp'), { ssr: false });

export default function EditHouseholdPage() {
  const router = useRouter();
  const { householdId } = useParams();
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
      if (!householdId) return;

      setLoading(true);
      try {
        const ref = doc(db, 'households', householdId, 'geographicIdentification', 'main');
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setForm((prev) => ({ ...prev, ...snap.data() }));
        } else {
          toast.error('Household not found');
          router.push('/household');
        }
      } catch (err) {
        toast.error('Failed to fetch household data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHousehold();
  }, [householdId, router]);

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
      router.push('/household');
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Edit Household</h2>

      {loading ? (
        <p className="text-center text-gray-500 mb-4 animate-pulse">Loading data...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 bg-white p-4 rounded shadow"
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
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="text"
                name="latitude"
                value={form.latitude}
                readOnly
                className="border p-2 rounded w-full bg-gray-100"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="text"
                name="longitude"
                value={form.longitude}
                readOnly
                className="border p-2 rounded w-full bg-gray-100"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
              >
                Pick Location from Map
              </button>
            </div>
          </div>

          {/* Submit + Cancel */}
          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => router.push('/household')}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded ${
                loading
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
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
  );
}
