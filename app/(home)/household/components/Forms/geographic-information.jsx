'use client';

import RequiredField from '@/components/Required';
import { db } from '@/firebase/config';
import geoData from '@/utils/geoData-ph.json';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'react-toastify';

// Dynamically import the Map component (client-side only)
const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });

// Maps input field names to autocomplete hints
const autocompleteMap = {
  region: 'address-level1',
  province: 'address-level1',
  city: 'address-level2',
  barangay: 'address-level3',
  sitio: 'address-level3',
  eaNumber: 'off',
  buildingSerial: 'off',
  housingUnitSerial: 'off',
  householdSerial: 'off',
  respondentLineNo: 'off',
  contactNumber: 'tel',
  email: 'email',
  headLastName: 'family-name',
  headFirstName: 'given-name',
  headSuffix: 'honorific-suffix',
  headMiddleName: 'additional-name',
  headSex: 'sex',
  headAge: 'bday',
  floorNo: 'address-line1',
  houseNo: 'street-address',
  blockLotNo: 'address-line2',
  streetName: 'address-line1',
  subdivision: 'address-line3',
};

export default function GeographicIdentification({ householdId, goToNext }) {
  const [mapOpen, setMapOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState({});

  const [form, setForm] = useState({
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
  });

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
      if (!form[field]?.toString().trim()) {
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

  // Dynamic dropdowns
  const selectedRegion = geoData.regions.find(r => r.name === form.region);
  const provinceOptions = selectedRegion?.provinces || [];

  const selectedProvince = provinceOptions.find(p => p.name === form.province);

  let cityOptions = [];
  if (selectedProvince?.cities?.length) {
    cityOptions = selectedProvince.cities;
  } else if (!selectedProvince && selectedRegion?.cities?.length) {
    cityOptions = selectedRegion.cities;
  }

  const selectedCity = cityOptions.find(c => c.name === form.city);
  const barangayOptions = selectedCity?.barangays || [];

  return (
    <form onSubmit={handleSubmit} className="pr-2 space-y-6">

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RequiredField htmlFor="region" label="Region" required showError={showErrors.region}>
          <select
            id="region"
            name="region"
            value={form.region}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Region</option>
            {geoData.regions.map(region => (
              <option key={region.name} value={region.name}>{region.name}</option>
            ))}
          </select>
        </RequiredField>

        <RequiredField htmlFor="province" label="Province" required showError={showErrors.province}>
          <select
            id="province"
            name="province"
            value={form.province}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            disabled={!selectedRegion}
          >
            <option value="">Select Province</option>
            {provinceOptions.map(prov => (
              <option key={prov.name} value={prov.name}>{prov.name}</option>
            ))}
          </select>
        </RequiredField>

        <RequiredField htmlFor="city" label="Municipality / City" required showError={showErrors.city}>
          <select
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            disabled={!(selectedProvince || (selectedRegion && selectedRegion.cities?.length))}
          >
            <option value="">Select City / Municipality</option>
            {cityOptions.map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
          </select>
        </RequiredField>

        <RequiredField htmlFor="barangay" label="Barangay" required showError={showErrors.barangay}>
          <select
            id="barangay"
            name="barangay"
            value={form.barangay}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            disabled={!selectedCity}
          >
            <option value="">Select Barangay</option>
            {barangayOptions.map(bgy => (
              <option key={bgy.name} value={bgy.name}>{bgy.name}</option>
            ))}
          </select>
        </RequiredField>

        <RequiredField htmlFor="sitio" label="Sitio / Purok" required showError={showErrors.sitio}>
          <input id="sitio" name="sitio" type="text" value={form.sitio} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Sitio / Purok" />
        </RequiredField>

        <RequiredField htmlFor="eaNumber" label="Enumeration Area Number" required showError={showErrors.eaNumber}>
          <input id="eaNumber" name="eaNumber" type="text" value={form.eaNumber} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Enumeration Area Number" />
        </RequiredField>

        <RequiredField htmlFor="buildingSerial" label="Building Serial Number" required showError={showErrors.buildingSerial}>
          <input id="buildingSerial" name="buildingSerial" type="text" value={form.buildingSerial} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Building Serial Number" />
        </RequiredField>

        <RequiredField htmlFor="housingUnitSerial" label="Housing Unit Serial Number" required showError={showErrors.housingUnitSerial}>
          <input id="housingUnitSerial" name="housingUnitSerial" type="text" value={form.housingUnitSerial} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Housing Unit Serial Number" />
        </RequiredField>

        <RequiredField htmlFor="householdSerial" label="Household Serial Number" required showError={showErrors.householdSerial}>
          <input id="householdSerial" name="householdSerial" type="text" value={form.householdSerial} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Household Serial Number" />
        </RequiredField>

        <RequiredField htmlFor="respondentLineNo" label="Respondent Line No." required showError={showErrors.respondentLineNo}>
          <input id="respondentLineNo" name="respondentLineNo" type="text" value={form.respondentLineNo} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Respondent Line No." />
        </RequiredField>

        <RequiredField htmlFor="contactNumber" label="Contact Number" required showError={showErrors.contactNumber}>
          <input id="contactNumber" name="contactNumber" type="tel" maxLength={11} value={form.contactNumber} onChange={handleChange} className="border p-2 rounded w-full" placeholder="e.g., 09123456789" />
        </RequiredField>

        <RequiredField htmlFor="email" label="Email Address" required showError={showErrors.email}>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Email Address" />
        </RequiredField>
      </div>

      {/* Household Head */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Household Head</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RequiredField htmlFor="headLastName" label="Last Name" required showError={showErrors.headLastName}>
          <input id="headLastName" name="headLastName" type="text" value={form.headLastName} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Last Name" />
        </RequiredField>

        <RequiredField htmlFor="headFirstName" label="First Name" required showError={showErrors.headFirstName}>
          <input id="headFirstName" name="headFirstName" type="text" value={form.headFirstName} onChange={handleChange} className="border p-2 rounded w-full" placeholder="First Name" />
        </RequiredField>

        <div className="flex flex-col">
          <label htmlFor="headSuffix" className="mb-1 text-sm font-medium text-gray-700">Suffix</label>
          <input id="headSuffix" name="headSuffix" type="text" value={form.headSuffix} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Suffix" />
        </div>

        <div className="flex flex-col">
          <label htmlFor="headMiddleName" className="mb-1 text-sm font-medium text-gray-700">Middle Name</label>
          <input id="headMiddleName" name="headMiddleName" type="text" value={form.headMiddleName} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Middle Name" />
        </div>

        <RequiredField htmlFor="headSex" label="Sex" required showError={showErrors.headSex}>
          <select id="headSex" name="headSex" value={form.headSex} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </RequiredField>

        <RequiredField htmlFor="headAge" label="Age" required showError={showErrors.headAge}>
          <input id="headAge" name="headAge" type="number" value={form.headAge} onChange={handleChange} className="border p-2 rounded w-full" placeholder="Age" min={0} />
        </RequiredField>
      </div>

      {/* Address */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Address</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {['floorNo', 'houseNo', 'blockLotNo', 'streetName', 'subdivision'].map((field) => (
          <div key={field} className="flex flex-col">
            <label htmlFor={field} className="mb-1 text-sm font-medium text-gray-700">{field.replace(/([A-Z])/g, ' $1')}</label>
            <input id={field} name={field} type="text" value={form[field]} onChange={handleChange} className="border p-2 rounded w-full" placeholder={field.replace(/([A-Z])/g, ' $1')} />
          </div>
        ))}
      </div>

      {/* Map Coordinates */}
      <h2 className="text-xl font-semibold text-green-600 pt-4">Map Coordinates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label htmlFor="latitude" className="mb-1 text-sm font-medium text-gray-700">Latitude</label>
          <input id="latitude" name="latitude" type="text" value={form.latitude} readOnly className="border p-2 rounded w-full" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="longitude" className="mb-1 text-sm font-medium text-gray-700">Longitude</label>
          <input id="longitude" name="longitude" type="text" value={form.longitude} readOnly className="border p-2 rounded w-full" />
        </div>
        <div className="sm:col-span-2">
          <button type="button" onClick={() => setMapOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Pick Location from Map
          </button>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save & Continue >'}
        </button>
      </div>

      {/* Map Popup */}
      <MapPopup isOpen={mapOpen} onClose={() => setMapOpen(false)} onSave={handleSaveLocation} />
    </form>
  );
}
