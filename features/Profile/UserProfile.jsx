'use client';

import { useAuth } from '@/context/authContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function UserProfile() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !profile) {
      toast.error('You must be logged in to view this page.');
      router.push('/dashboard');
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-600">
        Loading profile...
      </p>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8 md:mt-10">

      

      {/* Page Title */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
        Profile Information
      </h2>

      {/* Main Card */}
      <div className="flex flex-col md:flex-row gap-6 bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden">

        {/* Left Panel */}
        <div className="flex flex-col items-center justify-center bg-green-100 p-6 sm:p-8 w-full md:w-1/3">

          {profile.profilePhoto ? (
            <Image
              src={profile.profilePhoto}
              alt="Profile"
              width={160}
              height={160}
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full object-cover border border-gray-200 shadow"
            />
          ) : (
            <FaUserCircle className="text-gray-300 w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40" />
          )}

          <h3 className="mt-4 text-xl sm:text-2xl font-semibold text-gray-800 text-center">
            {profile.firstName} {profile.lastName}
          </h3>

          <p className="mt-1 text-gray-500 text-sm text-center">
            {profile.barangay || '—'}
          </p>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-5 sm:p-6 md:p-8">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <ProfileCard label="First Name" value={profile.firstName} />
            <ProfileCard label="Middle Name" value={profile.middleName} />
            <ProfileCard label="Last Name" value={profile.lastName} />
            <ProfileCard label="Date of Birth" value={profile.dateOfBirth} />
            <ProfileCard label="Gender" value={profile.gender} />
            <ProfileCard label="Contact Number" value={profile.contactNumber} />
            <ProfileCard label="Barangay" value={profile.barangay} />
            <ProfileCard label="Email Address" value={profile.email} />
          </div>
    
          {/* Buttons Inline */}
          <div className="mt-6 flex justify-between gap-4">
            {/* Back / Cancel Button */}
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-md"
            >
              Cancel
            </button>

            {/* Edit Profile Button */}
            <button
              onClick={() => router.push('/profile/edit-profile')}
              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
      <span className="text-gray-500 text-sm font-medium">
        {label}
      </span>
      <span className="mt-1 text-gray-800 text-2sm font-semibold text-base">
        {value || '—'}
      </span>
    </div>
  );
}