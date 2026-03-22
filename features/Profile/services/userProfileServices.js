// services/userProfileService.js
import { db, storage } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

/**
 * Fetch user profile by UID
 */
export async function fetchUserProfile(uid) {
  if (!uid) return null;
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? userDoc.data() : null;
}

/**
 * Update user profile with optional photo upload
 */
export async function updateUserProfile(uid, formData, photoFile) {
  if (!uid) throw new Error('Missing user UID.');

  const userRef = doc(db, 'users', uid);
  const currentSnap = await getDoc(userRef);
  const currentData = currentSnap.exists() ? currentSnap.data() : {};

  let profilePhotoUrl = formData.profilePhoto || currentData.profilePhoto || '';

  if (photoFile) {
    const storageRef = ref(storage, `profile_photos/${uid}`);
    await uploadBytes(storageRef, photoFile);
    profilePhotoUrl = await getDownloadURL(storageRef);
  }

  const updatedFields = {
    firstName: formData.firstName || '',
    middleName: formData.middleName || '',
    lastName: formData.lastName || '',
    dateOfBirth: formData.dateOfBirth || '',
    gender: formData.gender || '',
    contactNumber: formData.contactNumber || '',
    email: formData.email || '',
    barangay: formData.barangay || '',
    profilePhoto: profilePhotoUrl,
  };
  await setDoc(userRef, updatedFields, { merge: true });

  return {
    uid,
    ...currentData,
    ...updatedFields,
  };
}