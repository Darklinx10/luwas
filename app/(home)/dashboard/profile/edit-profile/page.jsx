'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { auth, db, storage } from '@/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import RoleGuard from '@/components/roleGuard'; // ✅ RoleGuard import

export default function EditProfilePage() {
  return (
    <RoleGuard allowedRoles={['SeniorAdmin', 'OfficeStaff', 'Secretary']}>
      <EditProfileContent />
    </RoleGuard>
  );
}

// Separated profile editing logic to this component
function EditProfileContent() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    email: '',
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setForm({
              firstName: data.firstName || '',
              middleName: data.middleName || '',
              lastName: data.lastName || '',
              dateOfBirth: data.dateOfBirth || '',
              gender: data.gender || '',
              contactNumber: data.contactNumber || '',
              email: data.email || '',
            });
            if (data.profilePhoto) {
              setPhotoPreview(data.profilePhoto);
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          toast.error('Failed to load profile.');
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid) return;

    setLoading(true);
    try {
      let profilePhotoUrl = photoPreview;

      if (photo) {
        const storageRef = ref(storage, `profile_photos/${uid}`);
        await uploadBytes(storageRef, photo);
        profilePhotoUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'users', uid), {
        ...form,
        profilePhoto: profilePhotoUrl,
      });

      toast.success('Profile updated!');
      router.push('/dashboard/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <button
        onClick={() => router.back()}
        className="text-green-600 hover:underline mb-4 inline-block"
      >
        &lt; Back
      </button>

      <h2 className="text-2xl font-semibold mb-4 text-center">Edit Profile</h2>

      <div className="flex flex-col items-center mb-6">
        {photoPreview ? (
          <img
            src={photoPreview}
            alt="Profile Preview"
            className="w-32 h-32 object-cover rounded-full border"
          />
        ) : (
          <FaUserCircle className="w-32 h-32 text-gray-400" />
        )}

        <label className="mt-2 text-sm text-blue-600 cursor-pointer hover:underline">
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          Change Photo
        </label>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <InputField name="firstName" label="First Name" value={form.firstName} onChange={handleChange} required />
        <InputField name="middleName" label="Middle Name" value={form.middleName} onChange={handleChange} />
        <InputField name="lastName" label="Last Name" value={form.lastName} onChange={handleChange} required />
        <InputField type="date" name="dateOfBirth" label="Date of Birth" value={form.dateOfBirth} onChange={handleChange} required />
        <div>
          <label className="text-sm text-gray-600">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <InputField name="contactNumber" label="Contact Number" value={form.contactNumber} onChange={handleChange} required />
        <div className="col-span-2">
          <InputField type="email" name="email" label="Email Address" value={form.email} onChange={handleChange} required />
        </div>

        <div className="col-span-2 mt-4 flex justify-end">
          <button
            type="submit"
            className="w-[200px] bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition flex justify-center items-center"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({ name, label, value, onChange, required, type = 'text' }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}
