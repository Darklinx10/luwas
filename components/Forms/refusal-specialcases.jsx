'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

// Relationship options for the dropdown
const relationships = [
  'Member of the family/occupant of the housing unit',
  'Nonrelative/Household staff',
  'Other, not elsewhere classified',
];

// Refusal reason options for the dropdown
const refusalReasons = [
  'Privacy concerns',
  'No time',
  'Not interested',
  'Other',
];

// Building types for the dropdown
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

// Roof materials options
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

// Wall materials options
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

// Floor materials options
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

const mainFloorMaterial = [
  'Concrete',
  'Coconut Lumber',
  'Bamboo',
  'Earth/Sand/Mud',
  'Vinyl/Carpet Tiles',
  'Makeshift/Salvaged/Improvised Materials',
  'Others, Specify',
]

export default function RefusalAndHousingForm({ householdId }) {
  const router = useRouter(); // For redirecting after submission
  const [formData, setFormData] = useState({
    lastName: '',                  // Respondent's last name
    firstName: '',                 // Respondent's first name
    suffix: '',                    // Respondent's suffix (e.g., Jr.)
    middleName: '',                // Respondent's middle name
    relationship: '',              // Relationship to head
    ladderStep: '',                // Interview ladder step level
    refusalReason: '',             // Reason for refusal (if any)
    buildingType: '',              // Type of building
    floorsCount: '',               // Number of floors
    roofMaterial: '',              // Main roof material
    outerWallMaterial: '',         // Main wall material
    floorFinishMaterial1: '',      // First floor finishing material
    floorFinishMaterial2: '',      // Second floor finishing material
    mainFloorMaterial1: '',        // Main floor material (primary)
    mainFloorMaterial2: '',        // Main floor material (secondary)
    estimatedFloorArea: '',        // Estimated floor area in square meters
  });

  const [isSaving, setIsSaving] = useState(false); // Track form saving state

  // Update form data when input fields change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Submit form data to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();           
    setIsSaving(true);            

    try {
      // Reference to subcollection document for refusal/housing info
      const ref = doc(db, 'households', householdId, 'refusalAndSpecialCases', 'main');

      // Save form data + timestamp
      await setDoc(ref, {
        ...formData,
        timestamp: new Date(),
      });

      // Mark the household document as completed
      const householdRef = doc(db, 'households', householdId);
      await setDoc(householdRef, {
        isComplete: true,
        updatedAt: new Date(),
      }, { merge: true });

      toast.success('Refusal & Housing info saved!'); // Show success toast
      router.push('/household'); // Redirect to household listing/dashboard
    } catch (error) {
      // Handle and log errors
      console.error('Failed to save refusal and housing info:', error);
      toast.error('Failed to save data.');
    } finally {
      setIsSaving(false); // Re-enable buttons and inputs
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">Household Member & Housing Characteristics</h2>

      {/* Names */}
      <label htmlFor='lastName' className="block">
        Last Name
        <input
          id='lastName'
          name='lastName'
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.lastName}
          onChange={e => handleChange('lastName', e.target.value)}
          placeholder="Enter last name"
        />
      </label>

      <label htmlFor='firstName' className="block mt-4">
        First Name
        <input
          id='firstName'
          name='firstName'
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.firstName}
          onChange={e => handleChange('firstName', e.target.value)}
          placeholder="Enter first name"
        />
      </label>

      <label htmlFor='suffix' className="block mt-4">
        Suffix
        <input
          id='suffix'
          name='suffix'
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.suffix}
          onChange={e => handleChange('suffix', e.target.value)}
          placeholder="Enter suffix (optional)"
        />
      </label>

      <label htmlFor='middleName' className="block mt-4">
        Middle Name
        <input
          id='middleName'
          name='middleName'
          type="text"
          className="w-full border p-2 rounded mt-1"
          value={formData.middleName}
          onChange={e => handleChange('middleName', e.target.value)}
          placeholder="Enter middle name"
        />
      </label>

      {/* Relationship */}
      <label htmlFor='relationship' className="block mt-4">
        How are you related to the occupants of the housing unit/household?
        <select
          id='relationship'
          name='relationship'
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
              <label htmlFor='ladderStep' key={step} className="flex flex-col items-center">
                <input
                  id='ladderStep'
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
      <label htmlFor='refusalReason' className="block mt-6">
        What is the reason for the refusal of the household?
        <select
          id='refusalReason'
          name='refusalReason'
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
      <label htmlFor='buildingType' className="block mt-6">
        What is the type of building occupied by your household?
        <select
          id='buildingType'
          name='buildingType'
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

      <label htmlFor='floorsCount' className="block mt-4">
        How many floors are there in this building?
        <input
          id='floorsCount'
          name='floorsCount'
          type="number"
          min="1"
          className="w-full border p-2 rounded mt-1"
          value={formData.floorsCount}
          onChange={e => handleChange('floorsCount', e.target.value)}
          placeholder="Enter number of floors"
        />
      </label>

      <label htmlFor='roofMaterial' className="block mt-4">
        What is the main construction material of the roof of this building/housing unit?
        <select
          id='roofMaterial'
          name='roofMaterial'
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

      <label htmlFor='outerWallMaterial' className="block mt-4">
        What is the construction material of the outer walls of this building/housing unit?
        <select
          id='outerWallMaterial'
          name='outerWallMaterial'
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

      <label htmlFor='floorFinishMaterial1' className="block mt-4">
        What is the finishing material of the floor of the housing unit?
        <select
          id='floorFinishMaterial1'
          name='floorFinishMaterial1'
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

      <label htmlFor='floorFinishMaterial2' className="block mt-4">
        What is the finishing material of the floor of the housing unit? (Second)
        <select
          id='floorFinishMaterial2'
          name='floorFinishMaterial2'
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

      <label htmlFor='mainFloorMaterial1' className="block mt-4">
        What is the main construction material of the floor of this housing unit?
        <select
          id='mainFloorMaterial1'
          name='mainFloorMaterial1'
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

      <label htmlFor='mainFloorMaterial2' className="block mt-4">
        What is the main construction material of the floor of this housing unit? (Second)
        <select
          id='mainFloorMaterial2'
          name='mainFloorMaterial2'
          className="w-full border p-2 rounded mt-1"
          value={formData.mainFloorMaterial2}
          onChange={e => handleChange('mainFloorMaterial2', e.target.value)}
        >
          <option value="">Select type of floor material</option>
          {mainFloorMaterial.map(material => (
            <option key={material} value={material}>{material}</option>
          ))}
        </select>
      </label>

      <label htmlFor='estimatedFloorArea' className="block mt-4">
        What is the estimated floor area of this housing unit? (square meters)
        <input
          id='estimatedFloorArea'
          name='estimatedFloorArea'
          type="number"
          min="0"
          className="w-full border p-2 rounded mt-1"
          value={formData.estimatedFloorArea}
          onChange={e => handleChange('estimatedFloorArea', e.target.value)}
          placeholder="Enter estimated floor area"
        />
      </label>

      {/* ✅ Submit button */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>Save & Continue &gt;</>
          )}
        </button>
      </div>
    </form>
  );
}
