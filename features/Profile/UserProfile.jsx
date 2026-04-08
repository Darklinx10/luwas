'use client';

import { useAuth } from '@/context/authContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { FiEdit2, FiMail, FiMapPin, FiPhone, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function UserProfile() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !profile) {
      toast.error('You must be logged in to view this page.');
      router.push('/dashboard');
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-14 shadow-sm">
        <div className="flex flex-col items-center">
          <svg
            className="mb-3 h-10 w-10 animate-spin text-emerald-600"
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
          <p className="text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Home / Profile</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-800">Profile Information</h1>
            <p className="mt-2 text-sm text-slate-500">
              View your personal account details and contact information.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              Account Details
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          <div className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-col items-center text-center">
              {profile.profilePhoto ? (
                <Image
                  src={profile.profilePhoto}
                  alt="Profile"
                  width={160}
                  height={160}
                  className="h-36 w-36 rounded-full border border-slate-200 object-cover shadow-sm"
                />
              ) : (
                <FaUserCircle className="h-36 w-36 text-slate-300" />
              )}

              <h2 className="mt-4 text-xl font-semibold text-slate-800">
                {profile.firstName} {profile.lastName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {profile.barangay || '—'}
              </p>

              <button
                onClick={() => router.push('/profile/edit-profile')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <FiEdit2 size={16} />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProfileCard label="First Name" value={profile.firstName} icon={<FiUser />} />
              <ProfileCard label="Middle Name" value={profile.middleName} icon={<FiUser />} />
              <ProfileCard label="Last Name" value={profile.lastName} icon={<FiUser />} />
              <ProfileCard label="Date of Birth" value={profile.dateOfBirth} icon={<FiUser />} />
              <ProfileCard label="Gender" value={profile.gender} icon={<FiUser />} />
              <ProfileCard label="Contact Number" value={profile.contactNumber} icon={<FiPhone />} />
              <ProfileCard label="Barangay" value={profile.barangay} icon={<FiMapPin />} />
              <ProfileCard label="Email Address" value={profile.email} icon={<FiMail />} />
            </div>

            <div className="mt-6 flex justify-start">
              <button
                onClick={() => router.back()}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {value || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}