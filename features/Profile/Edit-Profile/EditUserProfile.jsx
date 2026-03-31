'use client';

import { useAuth } from '@/context/authContext';
import { capitalizeWords } from '@/utils/capitalize';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { useUserProfile } from '../hooks/useUserProfile';

export default function EditProfilePageContent() {
  const router = useRouter();
  const { role } = useAuth();  // Get user's role

  const {
    form,
    photoPreview,
    loading,
    DEFAULT_AVATARS,
    handleChange,
    handlePhotoChange,
    handleAvatarClick,
    handleSubmit,
  } = useUserProfile();

  // Wrapper to capitalize inputs in real time
  const handleCapitalizedChange = (name, value) => {
    // Only capitalize certain fields
    const fieldsToCapitalize = ['firstName', 'middleName', 'lastName', 'barangay'];
    if (fieldsToCapitalize.includes(name)) {
      handleChange(name, capitalizeWords(value));
    } else {
      handleChange(name, value);
    }
  };

  // Check if user can edit barangay (Secretaries cannot change their barangay)
  const canEditBarangay = role !== 'Brgy-Secretary';

  return (
    <div className="w-full max-w-8xl mx-auto p-4 sm:p-6 md:p-10 mt-10">

      {/* Page Title */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-10 text-center">
        Edit Profile
      </h2>

      {/* Card Container */}
      <div className="flex flex-col md:flex-row gap-8 bg-white shadow-lg border border-gray-100 rounded-xl overflow-hidden">

        {/* Left Panel: Profile Photo & Avatars */}
        <div className="flex flex-col items-center bg-green-200 border border-green-100 p-8 w-full md:w-1/3 rounded-xl shadow-md">

          {/* Profile Image Wrapper */}
          <div className="relative">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Profile"
                width={160}
                height={160}
                className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full object-cover shadow-md border border-gray-200"
              />
            ) : (
              <FaUserCircle className="text-gray-300 w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44" />
            )}

            {/* Upload Button */}
            <label className="absolute bottom-0 right-1 text-blue-600 bg-white rounded-full px-2 py-1 shadow-md cursor-pointer hover:bg-gray-100 transition">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e.target.files[0])}
                className="hidden"
              />
              ✎
            </label>
          </div>

          <h3 className="mt-4 text-xl sm:text-2xl font-semibold text-gray-800 text-center">
            {capitalizeWords(form.firstName)} {capitalizeWords(form.lastName)}
          </h3>

          <p className="mt-1 text-gray-500 text-sm text-center">
            {capitalizeWords(form.barangay) || '—'}
          </p>

          {/* Default Avatars */}
          <div className="flex gap-4 mt-6 flex-wrap justify-center">
            {DEFAULT_AVATARS.map((avatar, i) => (
              <Image
                key={i}
                src={avatar}
                width={64}
                height={64}
                alt={`Avatar ${i + 1}`}
                className={`w-16 h-16 rounded-full cursor-pointer border-2 border-transparent hover:ring-2 hover:ring-green-300 transition ${
                  photoPreview === avatar ? 'ring-2 ring-green-500' : ''
                }`}
                onClick={() => handleAvatarClick(avatar)}
              />
            ))}
          </div>
        </div>

        {/* Right Panel: Form Fields */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField label="First Name" name="firstName" value={form.firstName} onChange={handleCapitalizedChange} required />
            <FormField label="Middle Name" name="middleName" value={form.middleName} onChange={handleCapitalizedChange} />
            <FormField label="Last Name" name="lastName" value={form.lastName} onChange={handleCapitalizedChange} required />
            <FormField label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleCapitalizedChange} required />
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={(e) => handleCapitalizedChange('gender', e.target.value)}
                className="w-full border border-gray-500 text-sm text-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-100 focus:outline-none transition"
                required
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>

            <FormField label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={handleCapitalizedChange} required />
            
            {/* Barangay field - read-only for Secretaries */}
            {canEditBarangay ? (
              <FormField label="Barangay" name="barangay" value={form.barangay} onChange={handleCapitalizedChange} required />
            ) : (
              <FormField 
                label="Barangay (Read-Only)" 
                name="barangay" 
                value={form.barangay} 
                onChange={() => {}}  // No-op for secretaries
                disabled={true}
                required 
              />
            )}

            {/* Email field - read-only (use Firebase Auth to change) */}
            <FormField 
              label="Email (Read-Only)" 
              name="email" 
              type="email" 
              value={form.email || ''} 
              onChange={() => {}}  // No-op
              disabled={true}
            />
          </div>

          {/* Info: Email cannot be changed here */}
          <p className="mt-4 text-xs text-gray-500 italic">
            💡 To change your email, please use the account settings in your profile.
          </p>

          {/* Buttons */}
          <div className="mt-6 flex justify-between gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-md"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-md ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Form Field Component
function FormField({ label, name, value, onChange, required = false, type = 'text', disabled = false }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        disabled={disabled}
        className={`w-full border border-gray-500 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-gray-100 focus:outline-none transition ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}