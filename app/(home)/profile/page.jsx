'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import RoleGuard from '@/components/roleGuard';
import Image from 'next/image';
import { useAuth } from '@/context/authContext';

export default function UserProfile() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  // -------------------------
  // Redirect if user is not logged in
  // -------------------------
  useEffect(() => {
    if (!loading && !profile) {
      // ✅ Delay the redirect inside useEffect to avoid "setState during render" error
      toast.error('You must be logged in to view this page.');
      router.push('/');
    }
  }, [loading, profile, router]);

  // -------------------------
  // Show loading state
  // -------------------------
  if (loading) return <p className="text-center mt-10">Loading profile...</p>;

  // -------------------------
  // Prevent render if profile doesn't exist yet
  // -------------------------
  if (!profile) return null;

  // -------------------------
  // Render profile
  // -------------------------
  return (
    <RoleGuard allowedRoles={['Brgy-Secretary', 'MDRRMC-Personnel', 'MDRRMC-Admin']}>
      <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="text-green-600 hover:underline mb-4 inline-block"
        >
          &lt; Back
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold mb-4 text-center">Profile Information</h2>

        {/* Profile image */}
        <div className="flex justify-center mb-6">
          {profile.profilePhoto ? (
            <Image
              src={profile.profilePhoto}
              alt="Profile"
              width={120}
              height={120}
              className="rounded-full object-cover border border-gray-300"
            />
          ) : (
            <FaUserCircle className="text-gray-400 w-40 h-40" />
          )}
        </div>

        {/* User information */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <ProfileField label="First Name" value={profile.firstName} />
          <ProfileField label="Middle Name" value={profile.middleName} />
          <ProfileField label="Last Name" value={profile.lastName} />
          <ProfileField label="Date of Birth" value={profile.dateOfBirth} />
          <ProfileField label="Gender" value={profile.gender} />
          <ProfileField label="Contact Number" value={profile.contactNumber} />
          <ProfileField label="Email Address" value={profile.email} />
          <ProfileField label="Barangay" value={profile.barangay} />
        </div>

        {/* Edit button */}
        <div className="mt-6 text-right">
          <button
            onClick={() => router.push('/profile/edit-profile')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </RoleGuard>
  );
}

// -------------------------
// Reusable field component
// -------------------------
function ProfileField({ label, value }) {
  return (
    <div>
      <label className="text-gray-600 text-sm">{label}</label>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}