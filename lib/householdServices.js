// app/services/householdServices.js
import { db } from '@/firebase/config';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

/** Fetch all households and count total residents */
export const fetchHouseholds = async () => {
  try {
    const householdsSnapshot = await getDocs(collection(db, 'households'));
    let residentCounter = 0;

    const householdPromises = householdsSnapshot.docs.map(async (hhDoc) => {
      const householdId = hhDoc.id;

      const geoDocRef = doc(db, 'households', householdId, 'geographicIdentification', 'main');
      const geoSnap = await getDoc(geoDocRef);
      const geoData = geoSnap.exists() ? geoSnap.data() : {};

      const memberSnap = await getDocs(collection(db, 'households', householdId, 'members'));
      residentCounter += memberSnap.size;

      let headData = {};

      await Promise.all(
        memberSnap.docs.map(async (memberDoc) => {
          const baseData = memberDoc.data();
          const memberId = memberDoc.id;

          const demoRef = doc(
            db,
            'households',
            householdId,
            'members',
            memberId,
            'demographicCharacteristics',
            'main'
          );
          const demoSnap = await getDoc(demoRef);
          const demoData = demoSnap.exists() ? demoSnap.data() : {};

          const relationship = demoData.relationshipToHead || baseData.relationshipToHead || '';

          if (relationship.toLowerCase() === 'head') {
            headData = {
              headFirstName: baseData.firstName || demoData.firstName || '',
              headMiddleName: baseData.middleName || demoData.middleName || '',
              headLastName: baseData.lastName || demoData.lastName || '',
              headSuffix: baseData.suffix || demoData.suffix || '',
              headSex: demoData.sex || '',
              headAge: demoData.age || '',
              contactNumber: demoData.contactNumber || '',
            };
          }
        })
      );

      return {
        householdId,
        ...geoData,
        ...headData,
      };
    });

    const householdList = (await Promise.all(householdPromises)).filter(
      (merged) =>
        merged.headFirstName ||
        merged.headLastName ||
        merged.barangay ||
        merged.latitude ||
        merged.longitude
    );

    return { households: householdList, totalResidents: residentCounter };
  } catch (error) {
    console.error('Error fetching households:', error);
    throw error;
  }
};

/** Fetch members for a given household */
export const fetchMembers = async (householdId) => {
  try {
    const memberSnapshot = await getDocs(collection(db, 'households', householdId, 'members'));

    const memberPromises = memberSnapshot.docs.map(async (docSnap) => {
      const baseData = docSnap.data();
      const memberId = docSnap.id;

      const demoRef = doc(
        db,
        'households',
        householdId,
        'members',
        memberId,
        'demographicCharacteristics',
        'main'
      );
      const demoSnap = await getDoc(demoRef);
      const demoData = demoSnap.exists() ? demoSnap.data() : {};

      return {
        id: memberId,
        ...baseData,
        ...demoData,
      };
    });

    return await Promise.all(memberPromises);
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
};

/** Update a member */
export const updateMember = async (householdId, member) => {
  try {
    const { id, firstName, lastName, middleName, contactNumber, nuclearRelation } = member;
    const memberRef = doc(db, 'households', householdId, 'members', id);

    const updateData = { firstName, lastName, middleName, contactNumber };
    if (nuclearRelation !== undefined) updateData.nuclearRelation = nuclearRelation;

    await updateDoc(memberRef, updateData);
    return { ...member };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

/** Delete a member */
export const deleteMember = async (householdId, memberId) => {
  try {
    await deleteDoc(doc(db, 'households', householdId, 'members', memberId));
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

/** Map relation to category */
export const mapRelationToCategory = (relation) => {
  if (!relation) return '';

  const lower = relation.toLowerCase();
  if (['head', 'family head'].includes(lower)) return 'Head';
  if (['spouse', 'partner'].includes(lower)) return 'Spouse';
  if (['son', 'daughter', 'child', 'nephew', 'niece'].includes(lower)) return 'Child';
  if (['father', 'mother', 'father-in-law', 'mother-in-law', 'parent'].includes(lower)) return 'Parent';
  if (['brother', 'sister', 'brother-in-law', 'sister-in-law', 'sibling'].includes(lower)) return 'Sibling';
  if (['uncle', 'aunt', 'other relative', 'relative'].includes(lower)) return 'Relative';
  if (['border', 'nonrelative', 'domestic helper', 'other'].includes(lower)) return 'Other';
  return 'Other';
};
