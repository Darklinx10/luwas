// hooks/useUserProfile.js
/**
 * Hook for managing user profile edit form and submission
 *
 * Handles:
 * - Form state management
 * - Photo preview state
 * - Submission to server-side /api/profile/update
 * - AuthContext synchronization after update
 */

import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { updateUserProfile } from '../services/userProfileServices';

const DEFAULT_AVATARS = [
  'https://cdn-icons-png.flaticon.com/512/706/706799.png',
  'https://cdn-icons-png.flaticon.com/512/13482/13482227.png',
];

function isBlobUrl(value = '') {
  return typeof value === 'string' && value.trim().startsWith('blob:');
}

export function useUserProfile() {
  const router = useRouter();
  const { profile, setProfile, refreshSession } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    barangay: '',
    profilePhoto: '',
  });

  const [photoFile, setPhotoFile] = useState(null);  // Actual file for upload
  const [photoPreview, setPhotoPreview] = useState('');  // Preview URL
  const [loading, setLoading] = useState(false);

  // Populate form when profile is available
  useEffect(() => {
    console.log('[useUserProfile] profile changed:', profile);
    if (!profile) return;

    setForm({
      firstName: profile.firstName || '',
      middleName: profile.middleName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || '',
      contactNumber: profile.contactNumber || '',
      barangay: profile.barangay || '',
      profilePhoto: profile.profilePhoto || '',
    });
    setPhotoPreview(profile.profilePhoto || '');
  }, [profile]);

  const handleChange = (name, value) => {
    console.log('[useUserProfile] handleChange:', name, value);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (file) => {
    if (!file) return;
    console.log('[useUserProfile] new photo selected:', file);

    // Validate file
    if (file.size > 5 * 1024 * 1024) {  // 5MB limit
      toast.error('Photo must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    // Keep the saved profilePhoto unchanged until a real upload backend exists.
    toast.info('Custom photo is preview-only for now and will not be saved yet.');
  };

  const handleAvatarClick = (avatarUrl) => {
    console.log('[useUserProfile] avatar selected:', avatarUrl);
    setPhotoFile(null);  // Clear file if any
    setPhotoPreview(avatarUrl);
    // Avatar URL will be sent as profilePhoto in form
    setForm((prev) => ({ ...prev, profilePhoto: avatarUrl }));
    toast.info('Default avatar selected.');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    console.log('[useUserProfile] submitting profile update');

    if (!profile?.uid) {
      toast.error('User ID is missing. Please log in again.');
      console.error('[useUserProfile] missing profile UID', profile);
      return;
    }

    setLoading(true);
    try {
      const persistedProfilePhoto = isBlobUrl(form.profilePhoto)
        ? ''
        : (form.profilePhoto || '').trim();

      // 1. Prepare form data for submission
      const profileData = {
        ...form,
        profilePhoto: persistedProfilePhoto,
      };

      // 2. Call server-side update endpoint
      const updatedProfile = await updateUserProfile(profileData, photoFile);

      console.log('[useUserProfile] profile updated successfully:', updatedProfile);

      // 3. Update AuthContext with new profile
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      // 4. Reload session to ensure fresh data from server
      // This will call /api/auth/me and update context with fresh profile
      const sessionData = await refreshSession();
      const needsProfileCompletion = !!sessionData?.user?.needsProfileCompletion;

      toast.success('Profile updated successfully!');

      // 5. Keep incomplete users on the completion form.
      if (!needsProfileCompletion) {
        router.push('/profile');
      }
    } catch (error) {
      console.error('[useUserProfile] Profile update failed:', error);
      
      // Parse error message
      const errorMsg = error.message || 'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    photoPreview,
    loading,
    DEFAULT_AVATARS,
    handleChange,
    handlePhotoChange,
    handleAvatarClick,
    handleSubmit,
  };
}
