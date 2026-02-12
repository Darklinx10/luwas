// householdService.js
import { db } from '@/lib/firebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  startAfter,
  limit,
  writeBatch,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

/**
 * Fetch households in batches
 */
export async function fetchHouseholdsBatch(batchSize = 400) {
  let lastDoc = null;
  const allHouseholds = [];
  let nonEmptyHouseholdCount = 0;

  while (true) {
    const q = lastDoc
      ? query(collection(db, 'households'), orderBy('__name__'), startAfter(lastDoc), limit(batchSize))
      : query(collection(db, 'households'), orderBy('__name__'), limit(batchSize));

    const snapshot = await getDocs(q);
    if (snapshot.empty) break;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    const batchResults = await Promise.all(
      snapshot.docs.map(async (hhDoc) => {
        const householdId = hhDoc.id;

        const geoSnap = await getDoc(doc(db, 'households', householdId, 'geographicIdentification', 'main'));
        const geoData = geoSnap.exists() ? geoSnap.data() : {};

        let headData = {};
        const uniqueResidentIds = new Set();
        let headFoundInMembers = false;

        const membersSnap = await getDocs(collection(db, 'households', householdId, 'members'));

        for (const m of membersSnap.docs) {
          const base = m.data();
          const demoSnap = await getDoc(
            doc(db, 'households', householdId, 'members', m.id, 'demographicCharacteristics', 'main')
          );
          const demo = demoSnap.exists() ? demoSnap.data() : {};
          const rel = demo.relationshipToHead || base.relationshipToHead || '';

          if (rel.toLowerCase() === 'head') {
            headFoundInMembers = true;
            uniqueResidentIds.add(m.id);
            headData = {
              headFirstName: base.firstName || '',
              headMiddleName: base.middleName || '',
              headLastName: base.lastName || '',
              headSuffix: base.suffix || '',
              headSex: demo.sex || '',
              headAge: demo.age || '',
              contactNumber: demo.contactNumber || '',
            };
          } else {
            uniqueResidentIds.add(m.id);
          }
        }

        if (!headFoundInMembers && geoData?.headFirstName) {
          headData = {
            headFirstName: geoData.headFirstName,
            headMiddleName: geoData.headMiddleName,
            headLastName: geoData.headLastName,
            headSuffix: geoData.headSuffix,
            headSex: geoData.headSex,
            headAge: geoData.headAge,
            contactNumber: geoData.contactNumber,
          };
          uniqueResidentIds.add(`head-${householdId}`);
        }

        const hasData =
          headData.headFirstName || headData.headLastName || geoData?.barangay || geoData?.sitio || membersSnap.size > 0;

        if (hasData) nonEmptyHouseholdCount++;

        return { householdId, ...geoData, ...headData, hasData, residentCount: uniqueResidentIds.size };
      })
    );

    allHouseholds.push(...batchResults.filter((r) => r.hasData !== false));
  }

  const validHouseholds = allHouseholds.filter((h) => h.hasData);
  const totalResidents = validHouseholds.reduce((sum, h) => sum + h.residentCount, 0);

  return { households: validHouseholds, totalHouseholds: nonEmptyHouseholdCount, totalResidents };
}

/**
 * Realtime listener for household members
 */
export function listenMembers(householdId, callback) {
  const unsubscribe = onSnapshot(collection(db, 'households', householdId, 'members'), async (snap) => {
    const members = await Promise.all(
      snap.docs.map(async (d) => {
        const base = d.data();
        const demoSnap = await getDoc(doc(db, 'households', householdId, 'members', d.id, 'demographicCharacteristics', 'main'));
        const demo = demoSnap.exists() ? demoSnap.data() : {};
        return { id: d.id, ...base, ...demo, householdId };
      })
    );
    callback(members);
  });

  return unsubscribe;
}

export async function deleteHousehold(householdId) {
  try {
    // 1️⃣ Delete all members in this household
    const membersRef = collection(db, 'households', householdId, 'members');
    const membersSnap = await getDocs(membersRef);

    const batch = writeBatch(db);
    membersSnap.forEach((memberDoc) => {
      batch.delete(memberDoc.ref);
    });

    // 2️⃣ Commit batch deletion of members
    await batch.commit();

    // 3️⃣ Delete the household document itself
    await deleteDoc(doc(db, 'households', householdId));

    console.log(`Household ${householdId} deleted successfully`);
  } catch (err) {
    console.error('Failed to delete household:', err);
    throw err;
  }
}
/**
 * Delete a member
 */
export async function deleteMember(householdId, memberId) {
  await deleteDoc(doc(db, 'households', householdId, 'members', memberId));
}

/**
 * Update a member
 */
export async function updateMember(householdId, memberId, data) {
  await updateDoc(doc(db, 'households', householdId, 'members', memberId), data);
}

/**
 * Batch upload households and members
 */
export async function uploadHouseholdsFromFile(file, onProgress) {
  const ext = file.name.split('.').pop().toLowerCase();
  let householdRows = [];
  let memberRows = [];

  if (ext === 'json') {
    const text = await file.text();
    const data = JSON.parse(text);
    householdRows = data.households || [];
    memberRows = data.members || [];
  } else if (['csv', 'xlsx', 'xls'].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', raw: true });
    const householdSheetName = workbook.SheetNames.find(name =>
      ['household','households'].includes(name.trim().toLowerCase())
    );
    const memberSheetName = workbook.SheetNames.find(name =>
      ['member','members'].includes(name.trim().toLowerCase())
    );
    if (!householdSheetName || !memberSheetName) throw new Error('Missing sheets');
    householdRows = XLSX.utils.sheet_to_json(workbook.Sheets[householdSheetName], { defval: '' });
    memberRows = XLSX.utils.sheet_to_json(workbook.Sheets[memberSheetName], { defval: '' });
  } else {
    throw new Error('Unsupported file type');
  }

  if (!householdRows.length) throw new Error('Households sheet is empty');
  if (!memberRows.length) throw new Error('Members sheet is empty');

  // Build household map
  const householdsMap = {};
  householdRows.forEach(row => {
    const householdId = (row['Household ID'] || '').toString().trim();
    if (!householdId) return;
    householdsMap[householdId] = {
      householdId,
      geoData: {
        headFirstName: row.headFirstName || row['Head FirstName'] || '',
        headMiddleName: row.headMiddleName || row['Head MiddleName'] || '',
        headLastName: row.headLastName || row['Head LastName'] || '',
        headSuffix: row.headSuffix || row['Head Suffix'] || '',
        headSex: row.headSex || row['Head Sex'] || '',
        headAge: Number(row.headAge || row['Head Age']) || 0,
        contactNumber: row.headContactNumber || row['Contact Number'] || 'N/A',
        barangay: row.barangay || row['Barangay'] || '',
        sitio: row.sitio || row['Sitio'] || '',
        homes: [
          { label: 'Primary Home', latitude: row.home1_latitude || row['Home1 Latitude'], longitude: row.home1_longitude || row['Home1 Longitude'] },
          { label: 'Secondary Home 1', latitude: row.home2_latitude || row['Home2 Latitude'], longitude: row.home2_longitude || row['Home2 Longitude'] },
          { label: 'Secondary Home 2', latitude: row.home3_latitude || row['Home3 Latitude'], longitude: row.home3_longitude || row['Home3 Longitude'] },
          { label: 'Secondary Home 3', latitude: row.home4_latitude || row['Home4 Latitude'], longitude: row.home4_longitude || row['Home4 Longitude'] },
        ].filter(h => h.latitude && h.longitude),
      },
      members: [],
    };
  });

  memberRows.forEach(row => {
    const householdId = (row['Household ID'] || '').toString().trim();
    const memberId = (row['Member ID'] || '').toString().trim();
    if (!householdId || !memberId) return;
    if (!householdsMap[householdId]) return;

    householdsMap[householdId].members.push({
      id: memberId,
      firstName: row.firstName || row['FirstName'] || '',
      middleName: row.middleName || row['MiddleName'] || '',
      lastName: row.lastName || row['LastName'] || '',
      suffix: row.suffix || row['Suffix'] || '',
      relationshipToHead: row.relationshipToHead || row['Relationship To Head'] || '',
      sex: row.sex || row['Sex'] || '',
      age: Number(row.age || row['Age']) || 0,
      contactNumber: row.memberContactNumber || row['Member Contact Number'] || '',
    });
  });

  // Upload in batches
  const allHouseholds = Object.values(householdsMap);
  const batchSize = 400;
  for (let i = 0; i < allHouseholds.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = allHouseholds.slice(i, i + batchSize);
    chunk.forEach(({ householdId, geoData, members }) => {
      const hhRef = doc(db, 'households', householdId);
      batch.set(hhRef, { householdId, createdAt: serverTimestamp() }, { merge: true });

      if (geoData.headFirstName) {
        const geoRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
        batch.set(geoRef, geoData, { merge: true });
      }

      members.forEach(member => {
        const memberRef = doc(db, 'households', householdId, 'members', member.id);
        batch.set(memberRef, member, { merge: true });

        const demoRef = doc(db, 'households', householdId, 'members', member.id, 'demographicCharacteristics', 'main');
        batch.set(demoRef, { ...member }, { merge: true });
      });
    });
    await batch.commit();
    if (onProgress) onProgress(Math.min(100, Math.round(((i + chunk.length) / allHouseholds.length) * 100)));
  }

  return allHouseholds.length;
}
