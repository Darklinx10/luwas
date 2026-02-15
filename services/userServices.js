// services/userService.js
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';

// Fetch all users with specific roles
export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .filter(doc => ['Brgy-Secretary', 'MDRRMC-Personnel'].includes(doc.data().role))
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fullName: [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' '),
      };
    });
};

// Update user in Firestore
export const updateUser = async (id, data) => {
  await updateDoc(doc(db, 'users', id), data);
};

// Create Firestore profile for a new user
export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data);
};

// Delete user via API (auth + firestore)
export const deleteUserById = async (userId) => {
  const res = await fetch('/api/deleteUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Delete failed');
  return true;
};