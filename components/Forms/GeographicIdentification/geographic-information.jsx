
'use client';

import { geoData } from '@/app/utils/geoData';
import { db } from '@/firebase/config';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'react-toastify';
import AddressFields from './AddressFields';
import HouseholdHeadFields from './HouseholdHeadFields';
import LocationFields from './LocationFields';
import MapCoordinates from './MapCoordinates';

const MapPopup = dynamic(() => import('@/components/householdComp/mapPopUP'), { ssr: false });
// Initial form state
const initialForm = {
  region: '',
  province: '',
  city: '',
  barangay: '',
  sitio: '',
  eaNumber: '',
  buildingSerial: '',
  housingUnitSerial: '',
  householdSerial: '',
  respondentLineNo: '',
  contactNumber: '',
  email: '',
  headLastName: '',
  headFirstName: '',
  headSuffix: '',
  headMiddleName: '',
  headAge: '',
  headSex: '',
  floorNo: '',
  houseNo: '',
  blockLotNo: '',
  streetName: '',
  subdivision: '',
  latitude: '',
  longitude: '',
};

export default function GeographicIdentification({ householdId, goToNext }) {
  const [form, setForm] = useState({ ...initialForm });
  const [mapOpen, setMapOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState({});

  // Handle cascading dropdowns
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'region') {
      setForm((prev) => ({ ...prev, region: value, province: '', city: '', barangay: '' }));
    } else if (name === 'province') {
      setForm((prev) => ({ ...prev, province: value, city: '', barangay: '' }));
    } else if (name === 'city') {
      setForm((prev) => ({ ...prev, city: value, barangay: '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Save location from map
  const handleSaveLocation = (location) => {
    setForm((prev) => ({
      ...prev,
      latitude: location.lat.toFixed(6),
      longitude: location.lng.toFixed(6),
    }));
    setMapOpen(false);
  };

  // Validation
  const validateForm = () => {
    const requiredFields = [
      'region', 'province', 'city', 'barangay', 'sitio', 'eaNumber', 'buildingSerial',
      'housingUnitSerial', 'householdSerial', 'respondentLineNo', 'contactNumber', 'email',
      'headLastName', 'headFirstName', 'headSex', 'headAge'
    ];

    const errors = {};
    requiredFields.forEach((field) => {
      if (!form[field]?.trim()) {
        errors[field] = true;
      }
    });

    setShowErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill out all required fields.');
      return;
    }

    setIsSaving(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        toast.error('User not authenticated.');
        return;
      }

      const ref = doc(db, 'households', householdId, 'geographicIdentification', 'main');
      await setDoc(ref, {
        ...form,
        uid: user.uid,
      });

      toast.success('Geographic information saved!');
      goToNext();
    } catch (error) {
      console.error('Error saving geographic form:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pr-2 space-y-6">
      <LocationFields form={form} handleChange={handleChange} showErrors={showErrors} geoData={geoData} />
      <HouseholdHeadFields form={form} handleChange={handleChange} showErrors={showErrors} />
      <AddressFields form={form} handleChange={handleChange} />
      <MapCoordinates form={form} setMapOpen={setMapOpen} />

      <div className="pt-6 flex justify-end">
        <button type="submit" disabled={isSaving} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          {isSaving ? 'Saving...' : 'Save & Continue >'}
        </button>
      </div>

      <MapPopup isOpen={mapOpen} onClose={() => setMapOpen(false)} onSave={handleSaveLocation} />
    </form>
  );
}
