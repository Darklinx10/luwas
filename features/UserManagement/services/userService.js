import { db } from '@/lib/firebaseConfig';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const ALLOWED_ROLES = ['Brgy-Secretary', 'MDRRMC-Personnel'];

const buildFullName = (data) => {
  const { lastName, firstName, middleName } = data;

  const firstPart = [firstName, middleName].filter(Boolean).join(' ');
  return [lastName, firstPart].filter(Boolean).join(', ').trim();
};

export const userService = {
  async fetchUsers() {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));

    const users = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .filter((user) => ALLOWED_ROLES.includes(user.role))
      .map((user) => ({
        ...user,
        fullName: buildFullName(user),
      }))
      .sort((a, b) => {
        const lastA = (a.lastName || '').toLowerCase();
        const lastB = (b.lastName || '').toLowerCase();

        if (lastA < lastB) return -1;
        if (lastA > lastB) return 1;

        const firstA = (a.firstName || '').toLowerCase();
        const firstB = (b.firstName || '').toLowerCase();

        if (firstA < firstB) return -1;
        if (firstA > firstB) return 1;
        return 0;
      });

    return users;
  },

  async createUser(user) {
    const res = await fetch('/api/createUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        displayName: [user.firstName, user.middleName, user.lastName]
          .filter(Boolean)
          .join(' ')
          .trim(),
        role: user.role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || 'Failed to create user.');
    }

    await setDoc(doc(db, USERS_COLLECTION, data.uid), {
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      barangay: user.barangay,
      role: user.role,
    });

    return data;
  },

  async updateUser(user) {
    if (!user?.id) throw new Error('User ID is required.');

    const userRef = doc(db, USERS_COLLECTION, user.id);
    const { id, fullName, password, ...dataToUpdate } = user;

    await updateDoc(userRef, dataToUpdate);
  },

  async deleteUser(userId) {
    const res = await fetch('/api/deleteUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || 'Failed to delete user.');
    }

    return data;
  },
};