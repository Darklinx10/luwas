// lib/firestore.js
import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

// Add a new document to a collection
export const addData = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

// Get all documents from a collection belonging to the current user
export const getData = async (collectionName, uid) => {
  const q = query(collection(db, collectionName), where('uid', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get a single document
export const getSingleData = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

// Update a document
export const updateData = async (collectionName, id, newData) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, newData);
};



export async function deleteData(collectionName, docId) {
  const docRef = doc(db, collectionName, docId);

  // Delete known subcollections manually
  const subColNames = ['members', 'assets']; // <-- put actual subcollection names here
  for (const subCol of subColNames) {
    const subColRef = collection(docRef, subCol);
    const subDocs = await getDocs(subColRef);
    for (const subDoc of subDocs.docs) {
      await deleteDoc(subDoc.ref);
    }
  }

  // Delete the main document
  await deleteDoc(docRef);
}


// Add or update a household document (top-level doc)
export const setHouseholdData = async (householdId, data) => {
  const householdRef = doc(db, 'households', householdId);
  await updateDoc(householdRef, data).catch(async (err) => {
    // If doc doesn't exist, create it:
    await setDoc(householdRef, data);
  });
};

// Add or update a member in a household
export const setHouseholdMember = async (householdId, memberId, memberData) => {
  const memberRef = doc(db, 'households', householdId, 'members', memberId);
  await updateDoc(memberRef, memberData).catch(async (err) => {
    await setDoc(memberRef, memberData);
  });
};

// Fetch one household with members subcollection
export const getHouseholdWithMembers = async (householdId) => {
  const householdRef = doc(db, 'households', householdId);
  const householdSnap = await getDoc(householdRef);
  if (!householdSnap.exists()) return null;
  const householdData = householdSnap.data();

  const membersCol = collection(db, 'households', householdId, 'members');
  const membersSnap = await getDocs(membersCol);
  const members = membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { id: householdId, ...householdData, members };
};