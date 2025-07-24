'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { auth, db } from '@/firebase/config'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify'; 

export default function UserProfile() {
  const router = useRouter();

  // Holds user profile data from Firestore
  const [userProfile, setUserProfile] = useState(null);
  // Tracks if data is still loading
  const [loading, setLoading] = useState(true);

  // Fetch user profile when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const profileRef = doc(db, 'users', uid);

        try {
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            // ✅ Existing profile found
            setUserProfile(profileSnap.data());
          } else {
            // ❌ Profile not found — create one based on Firebase Auth
            const defaultProfile = {
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ')[1] || '',
              middleName: '',
              dateOfBirth: '',
              gender: '',
              contactNumber: '',
              email: firebaseUser.email || '',
              profilePhoto: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
            };

            await setDoc(profileRef, defaultProfile);
            setUserProfile(defaultProfile);
            toast.success('Profile created from authentication.');
          }
        } catch (error) {
          toast.error('Failed to load or create profile.');
          console.error('Error fetching/creating profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        toast.error('You must be logged in to view this page.');
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);


  // Show loading message while fetching profile
  if (loading) return <p className="text-center mt-10">Loading profile...</p>;

  // Don't render anything if userProfile is still null (already handled by toast and redirect)
  if (!userProfile) return null;

  return (
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

      {/* Profile image or fallback icon */}
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

      {/* User information displayed in two columns */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <ProfileField label="First Name" value={userProfile.firstName} />
        <ProfileField label="Middle Name" value={userProfile.middleName} />
        <ProfileField label="Last Name" value={userProfile.lastName} />
        <ProfileField label="Date of Birth" value={userProfile.dateOfBirth} />
        <ProfileField label="Gender" value={userProfile.gender} />
        <ProfileField label="Contact Number" value={userProfile.contactNumber} />
        <ProfileField label="Email Address" value={userProfile.email} />
      </div>

      {/* Edit profile button */}
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

// Reusable field component to display label and value
function ProfileField({ label, value }) {
  return (
    <div>
      <label className="text-gray-600 text-sm">{label}</label>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}
