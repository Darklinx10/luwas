import { db } from '@/lib/firebaseConfig';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const ALLOWED_ROLES = ['Brgy-Secretary', 'MDRRMC-Personnel'];
const DEFAULT_PAGE_SIZE = 10;

const buildFullName = (data) => {
  const { lastName, firstName, middleName } = data;

  const firstPart = [firstName, middleName].filter(Boolean).join(' ');
  return [lastName, firstPart].filter(Boolean).join(', ').trim();
};

export const userService = {
  async fetchUsers({ page = 1, limitSize = DEFAULT_PAGE_SIZE, search = '' } = {}) {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));

    const normalizedSearch = search.trim().toLowerCase();

    let users = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .filter((user) => ALLOWED_ROLES.includes(user.role))
      .map((user) => ({
        ...user,
        fullName: buildFullName(user),
      }));

    if (normalizedSearch) {
      users = users.filter((user) => {
        const fullName = (user.fullName || '').toLowerCase();
        const firstName = (user.firstName || '').toLowerCase();
        const middleName = (user.middleName || '').toLowerCase();
        const lastName = (user.lastName || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const barangay = (user.barangay || '').toLowerCase();
        const role = (user.role || '').toLowerCase();

        return (
          fullName.includes(normalizedSearch) ||
          firstName.includes(normalizedSearch) ||
          middleName.includes(normalizedSearch) ||
          lastName.includes(normalizedSearch) ||
          email.includes(normalizedSearch) ||
          barangay.includes(normalizedSearch) ||
          role.includes(normalizedSearch)
        );
      });
    }

    users.sort((a, b) => {
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

    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number(limitSize) > 0 ? Number(limitSize) : DEFAULT_PAGE_SIZE;

    const totalCount = users.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
    const startIndex = (safePage - 1) * safeLimit;
    const paginatedUsers = users.slice(startIndex, startIndex + safeLimit);

    return {
      users: paginatedUsers,
      page: safePage,
      limitSize: safeLimit,
      totalCount,
      totalPages,
      hasPrevPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    };
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