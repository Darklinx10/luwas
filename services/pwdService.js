'use client';
import { collection, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export const pwdService = {
  fetchAllPWDs: async () => {
    const householdsSnap = await getDocs(collection(db, 'households'));

    const data = await Promise.all(
      householdsSnap.docs.map(async (householdDoc) => {
        const householdId = householdDoc.id;

        const geoSnap = await getDoc(
          doc(db, 'households', householdId, 'geographicIdentification', 'main')
        );
        const healthSnap = await getDoc(
          doc(db, 'households', householdId, 'health', 'main')
        );

        const geoData = geoSnap.exists() ? geoSnap.data() : {};
        const health = healthSnap.exists() ? healthSnap.data() : null;

        if (!health?.isPWD || typeof health.pwdLineNumber !== 'string')
          return null;

        const lineNumber = health.pwdLineNumber;
        const barangay = geoData?.barangay || '—';
        const sitio = geoData?.sitio || '—';

        const demoRef =
          lineNumber === 'head'
            ? doc(db, 'households', householdId, 'demographicCharacteristics', 'main')
            : doc(
                db,
                'households',
                householdId,
                'members',
                lineNumber,
                'demographicCharacteristics',
                'main'
              );

        const demoSnap = await getDoc(demoRef);
        if (!demoSnap.exists()) return null;

        const demo = demoSnap.data();

        const name = [
          demo.firstName,
          demo.middleName,
          demo.lastName,
          demo.suffix && demo.suffix.toLowerCase() !== 'n/a'
            ? demo.suffix
            : '',
        ]
          .filter(Boolean)
          .join(' ');

        return {
          id: `${householdId}-${lineNumber}`,
          householdId,
          name,
          age: demo.age || '—',
          sex: demo.sex || '—',
          contact: demo.contactNumber || '—',
          barangay,
          sitio,
          disability: health.pwdDisabilityType || '—',
        };
      })
    );

    return data.filter(Boolean);
  },

  updatePWD: async (item) => {
    const lineNumber = item.id.replace(`${item.householdId}-`, '');
    const isHead = lineNumber === 'head';

    const healthRef = doc(db, 'households', item.householdId, 'health', 'main');
    const geoRef = doc(db, 'households', item.householdId, 'geographicIdentification', 'main');
    const demographicRef = isHead
      ? doc(db, 'households', item.householdId, 'demographicCharacteristics', 'main')
      : doc(
          db,
          'households',
          item.householdId,
          'members',
          lineNumber,
          'demographicCharacteristics',
          'main'
        );

    await Promise.all([
      updateDoc(healthRef, { pwdDisabilityType: item.disability }),
      updateDoc(geoRef, { barangay: item.barangay, sitio: item.sitio }),
      updateDoc(demographicRef, {
        sex: item.sex,
        age: item.age,
        contactNumber: item.contact,
      }),
    ]);
  },

  removePWD: async (item) => {
    const healthRef = doc(db, 'households', item.householdId, 'health', 'main');
    await updateDoc(healthRef, {
      isPWD: false,
      pwdLineNumber: '',
      pwdDisabilityType: '',
    });
  },
};