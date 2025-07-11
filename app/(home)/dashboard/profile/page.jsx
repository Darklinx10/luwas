'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { auth, db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';

export default function UserProfile() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data());
          } else {
            toast.error('User profile not found.');
          }
        } catch (error) {
          toast.error('Failed to load profile.');
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        // Not logged in
        toast.error('You must be logged in to view this page.');
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <p className="text-center mt-10">Loading profile...</p>;

  if (!userProfile) return null; // already handled by toast + redirect

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <button
        onClick={() => router.back()}
        className="text-green-600 hover:underline mb-4 inline-block"
      >
        &lt; Back
      </button>

      <h2 className="text-2xl font-semibold mb-4 text-center">Profile Information</h2>

      {/* Profile Photo Section */}
      <div className="flex justify-center mb-6">
        {userProfile.profilePhoto ? (
          <img
            src={userProfile.profilePhoto}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border border-gray-300"
          />
        ) : (
          <FaUserCircle className="text-gray-400 w-32 h-32" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <ProfileField label="First Name" value={userProfile.firstName} />
        <ProfileField label="Middle Name" value={userProfile.middleName} />
        <ProfileField label="Last Name" value={userProfile.lastName} />
        <ProfileField label="Date of Birth" value={userProfile.dateOfBirth} />
        <ProfileField label="Gender" value={userProfile.gender} />
        <ProfileField label="Contact Number" value={userProfile.contactNumber} />
        <ProfileField label="Email Address" value={userProfile.email} />
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={() => router.push('/dashboard/profile/edit-profile')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

// Reusable component for cleaner code
function ProfileField({ label, value }) {
  return (
    <div>
      <label className="text-gray-600 text-sm">{label}</label>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}
