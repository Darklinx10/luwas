import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import admin, { adminDb } from '@/lib/firebaseAdmin';
import { getSessionUser } from '@/lib/auth/getSessionUser';
import {
  normalizeNameComponents,
  processHeadName,
} from '@/lib/utils/nameNormalizer';

export const runtime = 'nodejs';

const SUPPORTED_EXTENSIONS = ['json', 'xlsx', 'xls'];
const MAX_BATCH_OPERATIONS = 450;

function getFileExtension(fileName = '') {
  return String(fileName).split('.').pop().toLowerCase();
}

function parseCoordinate(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  const emptyPatterns = ['n/a', 'na', 'null', 'undefined', '-', '--', 'none', 'no data'];
  if (emptyPatterns.includes(trimmed.toLowerCase())) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeHomes(row) {
  const rawHomes = [
    {
      label: 'Primary Home',
      latitude: row.home1_latitude || row['Home1 Latitude'],
      longitude: row.home1_longitude || row['Home1 Longitude'],
    },
    {
      label: 'Secondary Home 1',
      latitude: row.home2_latitude || row['Home2 Latitude'],
      longitude: row.home2_longitude || row['Home2 Longitude'],
    },
    {
      label: 'Secondary Home 2',
      latitude: row.home3_latitude || row['Home3 Latitude'],
      longitude: row.home3_longitude || row['Home3 Longitude'],
    },
    {
      label: 'Secondary Home 3',
      latitude: row.home4_latitude || row['Home4 Latitude'],
      longitude: row.home4_longitude || row['Home4 Longitude'],
    },
  ];

  return rawHomes
    .map((home) => {
      const latitude = parseCoordinate(home.latitude);
      const longitude = parseCoordinate(home.longitude);

      if (latitude === null && longitude === null) {
        return null;
      }

      if (latitude === null || longitude === null) {
        return null;
      }

      return {
        label: home.label,
        latitude,
        longitude,
      };
    })
    .filter(Boolean);
}

function calculateAgeBrackets(members, headAge = 0) {
  const brackets = {
    'Under 1': 0,
    '1-4': 0,
    '5-9': 0,
    '10-14': 0,
    '15-19': 0,
    '20-24': 0,
    '25-29': 0,
    '30-34': 0,
    '35-39': 0,
    '40-44': 0,
    '45-49': 0,
    '50-54': 0,
    '55-59': 0,
    '60 and over': 0,
  };

  const addAge = (value) => {
    const age = Number(value) || 0;

    if (age < 1) brackets['Under 1'] += 1;
    else if (age <= 4) brackets['1-4'] += 1;
    else if (age <= 9) brackets['5-9'] += 1;
    else if (age <= 14) brackets['10-14'] += 1;
    else if (age <= 19) brackets['15-19'] += 1;
    else if (age <= 24) brackets['20-24'] += 1;
    else if (age <= 29) brackets['25-29'] += 1;
    else if (age <= 34) brackets['30-34'] += 1;
    else if (age <= 39) brackets['35-39'] += 1;
    else if (age <= 44) brackets['40-44'] += 1;
    else if (age <= 49) brackets['45-49'] += 1;
    else if (age <= 54) brackets['50-54'] += 1;
    else if (age <= 59) brackets['55-59'] += 1;
    else brackets['60 and over'] += 1;
  };

  addAge(headAge);
  members.forEach((member) => addAge(member.age));

  return brackets;
}

async function parseUploadFile(file) {
  const ext = getFileExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error('Unsupported file type');
  }

  if (ext === 'json') {
    let data;

    try {
      data = JSON.parse(await file.text());
    } catch {
      throw new Error('Invalid JSON format');
    }

    return {
      householdRows: Array.isArray(data.households) ? data.households : [],
      memberRows: Array.isArray(data.members) ? data.members : [],
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: true });

  const householdSheetName = workbook.SheetNames.find((name) =>
    ['household', 'households'].includes(name.trim().toLowerCase())
  );
  const memberSheetName = workbook.SheetNames.find((name) =>
    ['member', 'members'].includes(name.trim().toLowerCase())
  );

  if (!householdSheetName || !memberSheetName) {
    throw new Error('Missing sheets');
  }

  return {
    householdRows: XLSX.utils.sheet_to_json(workbook.Sheets[householdSheetName], {
      defval: '',
    }),
    memberRows: XLSX.utils.sheet_to_json(workbook.Sheets[memberSheetName], {
      defval: '',
    }),
  };
}

function buildHouseholdsMap(householdRows, memberRows) {
  const householdsMap = {};

  householdRows.forEach((row) => {
    const householdId = String(row['Household ID'] || '').trim();
    if (!householdId) {
      return;
    }

    const normalizedNames = processHeadName({
      headFirstName: row.headFirstName || row['Head FirstName'],
      headMiddleName: row.headMiddleName || row['Head Middle Name'] || row['Head MiddleName'],
      headLastName: row.headLastName || row['Head Last Name'] || row['Head LastName'],
      headSuffix: row.headSuffix || row['Head Suffix'],
      headFullName: row.headFullName || row['Head FullName'],
    });

    householdsMap[householdId] = {
      householdId,
      headFirstName: normalizedNames.firstName,
      headMiddleName: normalizedNames.middleName,
      headLastName: normalizedNames.lastName,
      headSuffix: normalizedNames.suffix,
      headSex: row.headSex || row['Head Sex'] || '',
      headAge: Number(row.headAge || row['Head Age']) || 0,
      contactNumber: row.headContactNumber || row['Contact Number'] || 'N/A',
      barangay: row.barangay || row['Barangay'] || '',
      sitio: row.sitio || row['Sitio'] || '',
      homes: normalizeHomes(row),
      members: [],
    };
  });

  memberRows.forEach((row) => {
    const householdId = String(row['Household ID'] || '').trim();
    const memberId = String(row['Member ID'] || '').trim();

    if (!householdId || !memberId || !householdsMap[householdId]) {
      return;
    }

    const normalizedMemberNames = normalizeNameComponents({
      firstName: row.firstName || row['FirstName'],
      middleName: row.middleName || row['MiddleName'],
      lastName: row.lastName || row['LastName'],
      suffix: row.suffix || row['Suffix'],
    });

    householdsMap[householdId].members.push({
      id: memberId,
      firstName: normalizedMemberNames.firstName,
      middleName: normalizedMemberNames.middleName,
      lastName: normalizedMemberNames.lastName,
      suffix: normalizedMemberNames.suffix,
      relationshipToHead:
        row.relationshipToHead || row['Relationship To Head'] || '',
      sex: row.sex || row['Sex'] || '',
      age: Number(row.age || row['Age']) || 0,
      contactNumber:
        row.memberContactNumber || row['Member Contact Number'] || '',
      isPWD:
        row.isPWD === 'true' ||
        row.isPWD === true ||
        row['Is PWD'] === 'true' ||
        false,
      isSeniorCitizen: (Number(row.age || row['Age']) || 0) >= 60,
    });
  });

  return Object.values(householdsMap);
}

function buildHouseholdDoc(household) {
  const {
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
    members,
  } = household;

  const totalMembers = members.length;
  const totalMale =
    members.filter((member) => member.sex?.toLowerCase() === 'male').length +
    (headSex?.toLowerCase() === 'male' ? 1 : 0);
  const totalFemale =
    members.filter((member) => member.sex?.toLowerCase() === 'female').length +
    (headSex?.toLowerCase() === 'female' ? 1 : 0);
  const totalPWDs = members.filter((member) => member.isPWD).length;
  const totalSeniors =
    (headAge >= 60 ? 1 : 0) + members.filter((member) => member.age >= 60).length;

  return {
    householdId,
    headFirstName,
    headMiddleName,
    headLastName,
    headSuffix,
    headFullName: [headFirstName, headMiddleName, headLastName, headSuffix]
      .filter(Boolean)
      .join(' ')
      .trim(),
    headSex,
    headAge,
    contactNumber,
    barangay,
    sitio,
    homes,
    hasMapLocation: homes.some(
      (home) => home && home.latitude != null && home.longitude != null
    ),
    ageBrackets: calculateAgeBrackets(members, headAge),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    totalResidents: 1 + totalMembers,
    totalMale,
    totalFemale,
    totalPWDs,
    totalSeniors,
    totalFamilies: 1,
  };
}

async function writeHouseholds(allHouseholds) {
  let batch = adminDb.batch();
  let operationsInBatch = 0;
  let batchCount = 0;

  const commitBatch = async () => {
    if (operationsInBatch === 0) {
      return;
    }

    await batch.commit();
    batch = adminDb.batch();
    operationsInBatch = 0;
    batchCount += 1;
  };

  for (const household of allHouseholds) {
    if (operationsInBatch >= MAX_BATCH_OPERATIONS) {
      await commitBatch();
    }

    const householdRef = adminDb.collection('households').doc(household.householdId);
    batch.set(householdRef, buildHouseholdDoc(household), { merge: true });
    operationsInBatch += 1;

    for (const member of household.members) {
      if (operationsInBatch >= MAX_BATCH_OPERATIONS) {
        await commitBatch();
      }

      const memberRef = householdRef.collection('members').doc(member.id);
      batch.set(memberRef, member, { merge: true });
      operationsInBatch += 1;
    }
  }

  await commitBatch();

  return batchCount;
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'MDRRMC-Admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Upload file is required' },
        { status: 400 }
      );
    }

    const { householdRows, memberRows } = await parseUploadFile(file);

    if (!householdRows.length) {
      return NextResponse.json(
        { error: 'Households sheet is empty' },
        { status: 400 }
      );
    }

    if (!memberRows.length) {
      return NextResponse.json(
        { error: 'Members sheet is empty' },
        { status: 400 }
      );
    }

    const allHouseholds = buildHouseholdsMap(householdRows, memberRows);
    const batchCount = await writeHouseholds(allHouseholds);

    return NextResponse.json({
      success: true,
      count: allHouseholds.length,
      batchCount,
    });
  } catch (error) {
    console.error('POST /api/households/upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload household data' },
      { status: 500 }
    );
  }
}
