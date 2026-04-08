'use client';

import { useAuth } from '@/context/authContext';
import { capitalizeWords } from '@/utils/capitalize';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { useUserProfile } from '../hooks/useUserProfile';

export default function EditProfilePageContent() {
  const router = useRouter();
  const { role } = useAuth(); // Get user's role

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
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 md:px-8">
      {/* Page Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Home / Profile / Edit Profile</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-800">Edit Profile</h2>
            <p className="mt-2 text-sm text-slate-500">
              Update your account details and profile picture.
            </p>
          </div>

          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
            Profile Settings
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* Left Panel: Profile Photo & Avatars */}
          <div className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-col items-center text-center">
              {/* Profile Image Wrapper */}
              <div className="relative">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Profile"
                    width={160}
                    height={160}
                    className="h-36 w-36 rounded-full border border-slate-200 object-cover shadow-sm sm:h-40 sm:w-40 md:h-44 md:w-44"
                  />
                ) : (
                  <FaUserCircle className="h-36 w-36 text-slate-300 sm:h-40 sm:w-40 md:h-44 md:w-44" />
                )}

                {/* Upload Button */}
                <label className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-white px-2.5 py-1 text-sm text-emerald-700 shadow-md transition hover:bg-slate-100">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e.target.files[0])}
                    className="hidden"
                  />
                  ✎
                </label>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-slate-800 sm:text-2xl">
                {capitalizeWords(form.firstName)} {capitalizeWords(form.lastName)}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {capitalizeWords(form.barangay) || '—'}
              </p>

              {/* Default Avatars */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {DEFAULT_AVATARS.map((avatar, i) => (
                  <Image
                    key={i}
                    src={avatar}
                    width={64}
                    height={64}
                    alt={`Avatar ${i + 1}`}
                    className={`h-14 w-14 cursor-pointer rounded-full border-2 object-cover transition sm:h-16 sm:w-16 ${photoPreview === avatar
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-transparent hover:ring-2 hover:ring-emerald-100'
                      }`}
                    onClick={() => handleAvatarClick(avatar)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Form Fields */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleCapitalizedChange}
                required
              />
              <FormField
                label="Middle Name"
                name="middleName"
                value={form.middleName}
                onChange={handleCapitalizedChange}
              />
              <FormField
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleCapitalizedChange}
                required
              />
              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleCapitalizedChange}
                required
              />

              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-medium text-slate-700">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={(e) => handleCapitalizedChange('gender', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>

              <FormField
                label="Contact Number"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleCapitalizedChange}
                required
              />

              {/* Barangay field - read-only for Secretaries */}
              {canEditBarangay ? (
                <FormField
                  label="Barangay"
                  name="barangay"
                  value={form.barangay}
                  onChange={handleCapitalizedChange}
                  required
                />
              ) : (
                <FormField
                  label="Barangay (Read-Only)"
                  name="barangay"
                  value={form.barangay}
                  onChange={() => { }}
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
                onChange={() => { }}
                disabled={true}
              />
            </div>

            {/* Info: Email cannot be changed here */}
            <p className="mt-4 text-xs italic text-slate-500">
              💡 To change your email, please use the account settings in your profile.
            </p>

            {/* Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`rounded-xl px-6 py-2.5 text-sm font-medium text-white transition ${loading
                    ? 'cursor-not-allowed bg-emerald-400'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Form Field Component
function FormField({
  label,
  name,
  value,
  onChange,
  required = false,
  type = 'text',
  disabled = false,
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1.5 text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        disabled={disabled}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
            : 'border-slate-300 bg-white text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
          }`}
      />
    </div>
  );
}