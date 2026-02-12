import { db } from '@/lib/firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';

export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));

  return snapshot.docs
    .filter(doc => 
      ['Brgy-Secretary', 'MDRRMC-Personnel'].includes(doc.data().role)
    )
    .map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        fullName: [data.firstName, data.middleName, data.lastName]
          .filter(Boolean)
          .join(' ')
      };
    });
};

export const updateUser = (id, data) =>
  updateDoc(doc(db, 'users', id), data);

export const createUserProfile = (uid, data) =>
  setDoc(doc(db, 'users', uid), data);
