import * as XLSX from 'xlsx';
import { db } from '@/lib/firebaseConfig';
import {
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore';


/**
 * Batch upload households and members
 * Pattern:
 * 1. Write parent household doc with top-level fields
 * 2. Write nested subcollections (geographicIdentification, members, demographicCharacteristics)
 * 3. Calculate and update totals in parent household doc after members are saved
 */
export async function uploadHouseholdsFromFile(file, onProgress) {
  const ext = file.name.split('.').pop().toLowerCase();
  let householdRows = [];
  let memberRows = [];

  // Progress: File reading (10%)
  if (onProgress) onProgress({ percentage: 5, stage: 'reading', message: 'Reading file...', currentBatch: 0, totalBatches: 0 });

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

  // Progress: File parsed (15%)
  if (onProgress) onProgress({ percentage: 15, stage: 'parsing', message: 'Parsing data...', currentBatch: 0, totalBatches: 0 });

  if (!householdRows.length) throw new Error('Households sheet is empty');
  if (!memberRows.length) throw new Error('Members sheet is empty');

  // Build household map with top-level fields
  const householdsMap = {};
  householdRows.forEach(row => {
    const householdId = (row['Household ID'] || '').toString().trim();
    if (!householdId) return;
    householdsMap[householdId] = {
      householdId,
      // Top-level fields for parent doc
      headFirstName: row.headFirstName || row['Head FirstName'] || '',
      headMiddleName: row.headMiddleName || row['Head MiddleName'] || '',
      headLastName: row.headLastName || row['Head LastName'] || '',
      headSuffix: row.headSuffix || row['Head Suffix'] || '',
      headSex: row.headSex || row['Head Sex'] || '',
      headAge: Number(row.headAge || row['Head Age']) || 0,
      contactNumber: row.headContactNumber || row['Contact Number'] || 'N/A',
      barangay: row.barangay || row['Barangay'] || '',
      sitio: row.sitio || row['Sitio'] || '',
      // Nested geoData for geographicIdentification subcollection
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

  // Progress: Households mapped (25%)
  if (onProgress) onProgress({ percentage: 25, stage: 'mapping', message: 'Mapping households...', currentBatch: 0, totalBatches: 0 });

  // Build members array
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
      isPWD: row.isPWD === 'true' || row.isPWD === true || row['Is PWD'] === 'true' || false,
    });
  });

  // Progress: Data structure built (35%)
  if (onProgress) onProgress({ percentage: 35, stage: 'building', message: 'Building member data...', currentBatch: 0, totalBatches: 0 });

  // Upload in batches
  const allHouseholds = Object.values(householdsMap);
  const batchSize = 400;
  const totalHouseholds = allHouseholds.length;
  const totalBatches = Math.ceil(totalHouseholds / batchSize);
  
  // Calculate how much progress to allocate to uploads (35% to 95%)
  const uploadProgressRange = 95 - 35;
  
  for (let i = 0; i < allHouseholds.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = allHouseholds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    chunk.forEach(({ householdId, headFirstName, headMiddleName, headLastName, headSuffix, headSex, headAge, contactNumber, barangay, sitio, geoData, members }) => {
      // Step 1: Write parent household doc with top-level fields + calculated totals
      const hhRef = doc(db, 'households', householdId);
      
      // Calculate totals from members array
      const totalMembers = members.length;
      const totalMale = members.filter(m => m.sex?.toLowerCase() === 'male').length;
      const totalFemale = members.filter(m => m.sex?.toLowerCase() === 'female').length;
      const totalPWDs = members.filter(m => m.isPWD).length;
      const totalSeniors = members.filter(m => m.age >= 60).length;
      
      // Extract homes from geoData if available
      const homes = geoData.homes || [];
      const hasMapLocation = homes.some(
        home => home && home.latitude != null && home.longitude != null
      );
      
      const householdDoc = {
        householdId,
        headFirstName,
        headMiddleName,
        headLastName,
        headSuffix,
        headSex,
        headAge,
        contactNumber,
        barangay,
        sitio,
        homes,
        hasMapLocation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Totals calculated from members
        totalResidents: totalMembers,
        totalMale,
        totalFemale,
        totalPWDs,
        totalSeniors,
        totalFamilies: 1,
      };
      batch.set(hhRef, householdDoc, { merge: true });

      // Step 2: Write nested subcollections
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
    
    // Calculate progress: 35% base + (items processed / total items) * 60%
    const processedItems = Math.min(i + batchSize, totalHouseholds);
    const uploadProgress = 35 + Math.round((processedItems / totalHouseholds) * uploadProgressRange);
    
    if (onProgress) onProgress({ 
      percentage: Math.min(95, uploadProgress), 
      stage: 'uploading', 
      message: `Uploading batch ${batchNumber} of ${totalBatches}...`,
      currentBatch: batchNumber,
      totalBatches: totalBatches
    });
  }

  // Progress: Complete (100%)
  if (onProgress) onProgress({ percentage: 100, stage: 'completed', message: 'Upload completed successfully!', currentBatch: 0, totalBatches: 0 });

  return allHouseholds.length;
}
