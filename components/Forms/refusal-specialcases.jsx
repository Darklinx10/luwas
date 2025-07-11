'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const relationships = [
  'Member of the family/occupant of the housing unit',
  'Nonrelative/Household staff',
  'Other, not elsewhere classified',
];

const refusalReasons = [
  'Privacy concerns',
  'No time',
  'Not interested',
  'Other',
];

const buildingTypes = [
  'Single house',
  'Duplex house',
  'Apartment/Flat',
  'Condominum/CondoTel',
  'Other Multi-Unit Residential',
  'Commercial/Industrial/Agricultural',
  'Institutional Living Quarter',
  'None(Homeless, Cart)',
  'Other types of building',
  'Temporary evacuation center',
];

const roofMaterials = [
  'Galvanized Iron/Aluminum',
  'Concrete/Clay Tile',
  'Half Galvanized Iron and Half Concrete',
  'Wood/Bamboo',
  'Cogon/Nipa/Anahaw',
  'Asbestos',
  'Makeshift/Salvaged/Improvised materials',
  'Other',
];

const wallMaterials = [
  'Concrete/Brick/Stone',
  'Half Concrete/Brick/Stone and Half Wood',
  'Wood',
  'Galvanized Iron/Aluminum',
  'Bamboo/Sawali/cogon/nipa',
  'Asbestos',
  'Glass',
  'Makeshift/Salvaged/Improvised materials',
  'None',
  'Concrete Hollow Blocks',
  'Concrete Hollow Blocks/Wood',
  'Shear Walls',
  'Other',
];

const floorMaterials = [
  'Ceramic Tile/Marble/Granite',
  'Cement/Brick/Stone',
  'Wood Plank',
  'Wood Tile/Parquet',
  'Vinyl/Carpet Tile',
  'Linoleum',
  'None',
  'Other',
];

export default function RefusalAndHousingForm({ householdId }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    suffix: '',
    middleName: '',
    relationship: '',
    ladderStep: '',
    refusalReason: '',
    buildingType: '',
    floorsCount: '',
    roofMaterial: '',
    outerWallMaterial: '',
    floorFinishMaterial1: '',
    floorFinishMaterial2: '',
    mainFloorMaterial1: '',
    mainFloorMaterial2: '',
    estimatedFloorArea: '',
  });

  const saveTimeout = useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaving(true);
    setSaveMessage('Saving...');

    saveTimeout.current = setTimeout(() => {
      saveData({ ...formData, [field]: value });
    }, 1500);
  };

  const saveData = async (data) => {
    try {
      // Simulated autosave delay
      await new Promise(r => setTimeout(r, 300));
      setSaving(false);
      setSaveMessage('All changes saved.');
    } catch {
      setSaving(false);
      setSaveMessage('Failed to save.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('Saving...');

    try {
      const ref = doc(db, 'households', householdId, 'refusalAndSpecialCases', 'main');

      await setDoc(ref, {
        ...formData,
        timestamp: new Date(),
      });

      toast.success('Refusal & Housing info saved!');
      setSaving(false);
      setSaveMessage('All changes saved.');
      router.push('/household');
    } catch (error) {
      console.error('Failed to save refusal and housing info:', error);
      toast.error('Failed to save data.');
      setSaving(false);
      setSaveMessage('Failed to save.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">Household Member & Housing Characteristics</h2>

      {/* Names */}
      <label className="block">
        LAST NAME
        <input
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.lastName}
          onChange={e => handleChange('lastName', e.target.value)}
          placeholder="Enter last name"
        />
      </label>

      <label className="block mt-4">
        FIRST NAME
        <input
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.firstName}
          onChange={e => handleChange('firstName', e.target.value)}
          placeholder="Enter first name"
        />
      </label>

      <label className="block mt-4">
        SUFFIX
        <input
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.suffix}
          onChange={e => handleChange('suffix', e.target.value)}
          placeholder="Enter suffix (optional)"
        />
      </label>

      <label className="block mt-4">
        MIDDLE NAME
        <input
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.middleName}
          onChange={e => handleChange('middleName', e.target.value)}
          placeholder="Enter middle name"
        />
      </label>

      {/* Relationship */}
      <label className="block mt-4">
        How are you related to the occupants of the housing unit/household?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.relationship}
          onChange={e => handleChange('relationship', e.target.value)}
        >
          <option value="">Select Relationship to household</option>
          {relationships.map(rel => (
            <option key={rel} value={rel}>{rel}</option>
          ))}
        </select>
      </label>

      {/* Ladder */}
      <fieldset className="mt-6 border p-3 rounded">
        <legend className="font-semibold mb-2">Imagine a ladder with ten steps.<br/>1 = poorest, 10 = richest.<br/>On what step of the ladder would the household be?</legend>
        <div className="flex items-center justify-between max-w-md mx-auto">
          <span className="text-xs">Poorest</span>
          {[...Array(10)].map((_, i) => {
            const step = i + 1;
            return (
              <label key={step} className="flex flex-col items-center">
                <input
                  type="radio"
                  name="ladderStep"
                  value={step}
                  checked={formData.ladderStep == step}
                  onChange={e => handleChange('ladderStep', e.target.value)}
                />
                <span className="text-sm">{step}</span>
              </label>
            );
          })}
          <span className="text-xs">Richest</span>
        </div>
      </fieldset>

      {/* Refusal Reason */}
      <label className="block mt-6">
        What is the reason for the refusal of the household?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.refusalReason}
          onChange={e => handleChange('refusalReason', e.target.value)}
        >
          <option value="">Select the reasons</option>
          {refusalReasons.map(reason => (
            <option key={reason} value={reason}>{reason}</option>
          ))}
        </select>
      </label>

      {/* Housing Characteristics */}
      <label className="block mt-6">
        What is the type of building occupied by your household?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.buildingType}
          onChange={e => handleChange('buildingType', e.target.value)}
        >
          <option value="">Select type of building</option>
          {buildingTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        How many floors are there in this building?
        <input
          type="number"
          min="1"
          className="w-full border p-2 rounded mt-1"
          value={formData.floorsCount}
          onChange={e => handleChange('floorsCount', e.target.value)}
          placeholder="Enter number of floors"
        />
      </label>

      <label className="block mt-4">
        What is the main construction material of the roof of this building/housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.roofMaterial}
          onChange={e => handleChange('roofMaterial', e.target.value)}
        >
          <option value="">Select type of roof building</option>
          {roofMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the construction material of the outer walls of this building/housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.outerWallMaterial}
          onChange={e => handleChange('outerWallMaterial', e.target.value)}
        >
          <option value="">Select type of outer walls building</option>
          {wallMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the finishing material of the floor of the housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.floorFinishMaterial1}
          onChange={e => handleChange('floorFinishMaterial1', e.target.value)}
        >
          <option value="">Select type of floor material</option>
          {floorMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the finishing material of the floor of the housing unit? (Second)
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.floorFinishMaterial2}
          onChange={e => handleChange('floorFinishMaterial2', e.target.value)}
        >
          <option value="">Select type of floor material</option>
          {floorMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the main construction material of the floor of this housing unit?
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.mainFloorMaterial1}
          onChange={e => handleChange('mainFloorMaterial1', e.target.value)}
        >
          <option value="">Select type of floor material</option>
          {floorMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the main construction material of the floor of this housing unit? (Second)
        <select
          className="w-full border p-2 rounded mt-1"
          value={formData.mainFloorMaterial2}
          onChange={e => handleChange('mainFloorMaterial2', e.target.value)}
        >
          <option value="">Select type of floor material</option>
          {floorMaterials.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label className="block mt-4">
        What is the estimated floor area of this housing unit? (square meters)
        <input
          type="number"
          min="0"
          className="w-full border p-2 rounded mt-1"
          value={formData.estimatedFloorArea}
          onChange={e => handleChange('estimatedFloorArea', e.target.value)}
          placeholder="Enter estimated floor area"
        />
      </label>

      {/* Save buttons */}
      <div className="pt-6 flex justify-end">
        <button
          className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
          type="submit"
        >
          Save &amp; Continue &gt;
        </button>
      </div>
    </form>
  );
}
