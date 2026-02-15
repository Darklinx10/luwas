import { collection, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

/**
 * Fetch seniors from all households, batching to reduce load.
 */
export const fetchSeniors = async (batchSize = 250) => {
  const householdsSnap = await getDocs(collection(db, 'households'));
  const seniorsList = [];

  for (let i = 0; i < householdsSnap.docs.length; i += batchSize) {
    const batch = householdsSnap.docs.slice(i, i + batchSize);

    const batchSeniors = await Promise.all(
      batch.map(async (householdDoc) => {
        const householdId = householdDoc.id;

        try {
          const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
          const membersColRef = collection(db, 'households', householdId, 'members');

          const [geoSnap, membersSnap] = await Promise.all([getDoc(geoDocRef), getDocs(membersColRef)]);
          const geoData = geoSnap.exists() ? geoSnap.data() : {};
          const barangay = geoData?.barangay || '—';
          const sitio = geoData?.sitio || '—';

          const memberSeniors = await Promise.all(
            membersSnap.docs.map(async (memberDoc) => {
              const demoRef = doc(
                db,
                'households',
                householdId,
                'members',
                memberDoc.id,
                'demographicCharacteristics',
                'main'
              );
              const demoSnap = await getDoc(demoRef);
              if (!demoSnap.exists()) return null;

              const demo = demoSnap.data();
              const age = parseInt(demo.age);
              if (!isNaN(age) && age >= 60) {
                const fullName = [
                  demo.firstName,
                  demo.middleName,
                  demo.lastName,
                  demo.suffix && demo.suffix.trim().toLowerCase() !== 'n/a' ? demo.suffix : null
                ].filter(Boolean).join(' ');

                return {
                  id: memberDoc.id,
                  name: fullName || 'Unnamed',
                  age,
                  sex: demo.sex || '—',
                  barangay,
                  sitio,
                  contact: demo.contactNumber || '—',
                  householdId,
                };
              }
              return null;
            })
          );

          return memberSeniors.filter(Boolean);

        } catch (err) {
          console.warn(`⚠️ Error processing household ${householdId}:`, err);
          return [];
        }
      })
    );

    batchSeniors.forEach(s => seniorsList.push(...s));
  }

  return seniorsList;
};

/**
 * Update senior demographic + geo info
 */
export const updateSenior = async ({ householdId, id, name, sex, age, contact, barangay, sitio }) => {
  const demographicRef = doc(db, 'households', householdId, 'members', id, 'demographicCharacteristics', 'main');
  const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');

  await updateDoc(demographicRef, { name, sex, age, contactNumber: contact });
  await updateDoc(geoRef, { barangay, sitio });
};

/**
 * Remove senior status
 */
export const removeSeniorStatus = async ({ householdId, id }) => {
  const demographicRef = doc(db, 'households', householdId, 'members', id, 'demographicCharacteristics', 'main');
  await updateDoc(demographicRef, { isSenior: false, seniorCitizenId: '' });
};
