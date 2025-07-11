'use client';

import React, { useState } from 'react';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import dynamic from 'next/dynamic';

// Map component (client-only)
const MapPopup = dynamic(() => import('@/components/mapPopUP'), { ssr: false });

const geoData = {
  "Region VII – Central Visayas": {
    "Bohol": {
      "Clarin": [
        "Bacani", "Bogtongbod", "Bonbon", "Bontud", "Buacao", "Buangan", "Cabog", "Caboy",
        "Caluwasan", "Candajec", "Cantoyoc", "Comaang", "Danahao", "Katipunan", "Lajog",
        "Mataub", "Nahawan", "Poblacion Centro", "Poblacion Norte", "Poblacion Sur",
        "Tangaran", "Tontunan", "Tubod", "Villaflor"
      ],
      "Tagbilaran City": ["Bool", "Cogon", "Dao", "Manga", "Poblacion I", "Poblacion II", "Taloto", "Tiptip"]
    },
    "Cebu": {
      "Cebu City": ["Lahug", "Mabolo", "Guadalupe"],
      "Mandaue City": ["Centro", "Alang-Alang", "Basak"]
    }
  }
};

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
  floorNo: 'address-line1',
  houseNo: 'street-address',
  blockLotNo: 'address-line2',
  streetName: 'address-line1',
  subdivision: 'address-line3',
};

export default function GeographicIdentification({ householdId, goToNext }) {
  const [mapOpen, setMapOpen] = useState(false);

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
    floorNo: '',
    houseNo: '',
    blockLotNo: '',
    streetName: '',
    subdivision: '',
    latitude: '',
    longitude: '',
  });

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

  const handleSaveLocation = (location) => {
    setForm((prev) => ({
      ...prev,
      latitude: location.lat.toFixed(6),
      longitude: location.lng.toFixed(6),
    }));
    setMapOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    }
  };

  const createInput = (id, label, type = 'text', options = []) => {
    const auto = autocompleteMap[id] || 'off';

    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
        {options.length > 0 ? (
          <select
            id={id}
            name={id}
            value={form[id]}
            onChange={handleChange}
            autoComplete={auto}
            className="border p-2 rounded w-full"
            required
          >
            <option value="">Select {label}</option>
            {options.map((opt, index) => (
              <option key={index} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            name={id}
            type={type}
            value={form[id]}
            onChange={handleChange}
            autoComplete={auto}
            className="border p-2 rounded w-full"
            placeholder={label}
            required
          />
        )}
      </div>
    );
  };

  const regionOptions = Object.keys(geoData);
  const provinceOptions = form.region ? Object.keys(geoData[form.region]) : [];
  const cityOptions = form.province ? Object.keys(geoData[form.region]?.[form.province] || {}) : [];
  const barangayOptions = form.city ? geoData[form.region]?.[form.province]?.[form.city] || [] : [];

  return (
    <form onSubmit={handleSubmit} className="pr-2 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {createInput('region', 'Region', 'text', regionOptions)}
        {createInput('province', 'Province', 'text', provinceOptions)}
        {createInput('city', 'Municipality / City', 'text', cityOptions)}
        {createInput('barangay', 'Barangay', 'text', barangayOptions)}
        {createInput('sitio', 'Sitio / Purok')}
        {createInput('eaNumber', 'Enumeration Area Number')}
        {createInput('buildingSerial', 'Building Serial Number')}
        {createInput('housingUnitSerial', 'Housing Unit Serial Number')}
        {createInput('householdSerial', 'Household Serial Number')}
        {createInput('respondentLineNo', 'Respondent Line No.')}
        {createInput('contactNumber', 'Contact Number')}
        {createInput('email', 'Email Address', 'email')}
      </div>

      <h2 className="text-xl font-semibold text-green-600 pt-4">Household Head</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {createInput('headLastName', 'Last Name')}
        {createInput('headFirstName', 'First Name')}
        {createInput('headSuffix', 'Suffix')}
        {createInput('headMiddleName', 'Middle Name')}
      </div>

      <h2 className="text-xl font-semibold text-green-600 pt-4">Address</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {createInput('floorNo', 'Floor No')}
        {createInput('houseNo', 'House / Building No')}
        {createInput('blockLotNo', 'Block / Lot No')}
        {createInput('streetName', 'Street Name')}
        {createInput('subdivision', 'Subdivision / Village')}
      </div>

      <h2 className="text-xl font-semibold text-green-600 pt-4">Map Coordinates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Pick Location from Map
          </button>
        </div>
      </div>

      <div className="pt-4">
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          Save & Continue &gt;
        </button>
      </div>

      <MapPopup isOpen={mapOpen} onClose={() => setMapOpen(false)} onSave={handleSaveLocation} />
    </form>
  );
}
