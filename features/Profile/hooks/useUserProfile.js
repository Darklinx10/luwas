// hooks/useUserProfile.js
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { updateUserProfile } from '../services/userProfileServices';

const DEFAULT_AVATARS = [
  'https://cdn-icons-png.flaticon.com/512/706/706799.png',
  'https://cdn-icons-png.flaticon.com/512/13482/13482227.png',
];

export function useUserProfile() {
  const router = useRouter();
  const { profile, setProfile } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    email: '',
    barangay: '',
    profilePhoto: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);

  // Populate form when profile is available
  useEffect(() => {
    console.log('[useUserProfile] profile changed:', profile);
    if (!profile) return;
    setForm({
      firstName: profile.firstName || '',
      middleName: profile.middleName || '',
      lastName: profile.lastName || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || '',
      contactNumber: profile.contactNumber || '',
      email: profile.email || '',
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
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    handleChange('profilePhoto', ''); // Clear previous avatar URL
  };

  const handleAvatarClick = (avatarUrl) => {
    console.log('[useUserProfile] avatar selected:', avatarUrl);
    setPhoto(null);
    setPhotoPreview(avatarUrl);
    handleChange('profilePhoto', avatarUrl);
    toast.info('Default avatar selected.');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    console.log('[useUserProfile] submitting form:', form, 'photo:', photo);

    if (!profile?.uid) {
      toast.error('User UID is missing. Please log in again.');
      console.error('[useUserProfile] missing profile UID', profile);
      return;
    }

    setLoading(true);
    try {
      let profilePhotoUrl = photoPreview;

      // Upload new photo if selected
      if (photo) {
        const storageRef = ref(storage, `profile_photos/${profile.uid}`);
        await uploadBytes(storageRef, photo);
        profilePhotoUrl = await getDownloadURL(storageRef);
      }
      
      const updatedProfile = await updateUserProfile(profile.uid, form, photo);
      const mergedProfile = { ...profile, ...updatedProfile };
      console.log('[useUserProfile] profile updated successfully:', updatedProfile);
      setProfile(mergedProfile);
      localStorage.setItem('userProfile', JSON.stringify(mergedProfile));
      toast.success('Profile updated successfully!');
      router.push('/profile');
    } catch (error) {
      console.error('[useUserProfile] Profile update failed:', error);
      toast.error('Failed to update profile.');
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