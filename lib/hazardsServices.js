import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';

export const fetchHazards = async () => {
  const querySnapshot = await getDocs(collection(db, 'hazards'));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const deleteHazard = async (id) => {
  await deleteDoc(doc(db, 'hazards', id));
};

export const addHazard = async (hazardType, description, geojsonFile) => {
  const fileRef = ref(storage, `hazards/${Date.now()}-${geojsonFile.name}`);
  await uploadBytes(fileRef, geojsonFile);
  const downloadURL = await getDownloadURL(fileRef);

  await addDoc(collection(db, 'hazards'), {
    type: hazardType,
    description,
    fileUrl: downloadURL,
    createdAt: serverTimestamp(),
  });
};
