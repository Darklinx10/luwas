'use client';

import { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/context/authContext';

// Components
import FormSectionSidebar from '@/features/Households/components/formSectionSidebar';
import GeographicIdentification from '@/features/Households/components/Forms/geographic-information';
import DemographicCharacteristics from '@/features/Households/components/Forms/demographic-characteristics';
import Migration from '@/features/Households/components/Forms/migration';
import Education from '@/features/Households/components/Forms/education';
import Community from '@/features/Households/components/Forms/community';
import Economic from '@/features/Households/components/Forms/economic';
import Entreprenuerialship from '@/features/Households/components/Forms/entreprenuerial';
import Agriculture from '@/features/Households/components/Forms/agriculture';
import FamilyIncome from '@/features/Households/components/Forms/family-income';
import FoodConsumption from '@/features/Households/components/Forms/food-consumption';
import FoodSecurity from '@/features/Households/components/Forms/food-security';
import FinancialInclusion from '@/features/Households/components/Forms/financial-inclusion';
import Health from '@/features/Households/components/Forms/health';
import ClimateChange from '@/features/Households/components/Forms/disasterpreparedness';
import Environmental from '@/features/Households/components/Forms/ecommerce';
import CrimeVictimization from '@/features/Households/components/Forms/crime-victimization';
import SocialProtection from '@/features/Households/components/Forms/social-protection';
import WaterSanitation from '@/features/Households/components/Forms/water-sanitation';
import HousingCharacteristics from '@/features/Households/components/Forms/housing-characteristics';
import Refusal from '@/features/Households/components/Forms/refusal-specialcases';

const formSections = {
  'Geographic Identification': GeographicIdentification,
  'Demographic Characteristics': DemographicCharacteristics,
  'Migration': Migration,
  'Education and Literacy': Education,
  'Community and Political': Community,
  'Economic Characteristics': Economic,
  'Entreprenuerial And Household Sustenance Activities': Entreprenuerialship,
  'Agriculture And Fishery Activities': Agriculture,
  'Family Income': FamilyIncome,
  'Food Consumption Expenditure': FoodConsumption,
  'Food Security': FoodSecurity,
  'Financial Inclusion': FinancialInclusion,
  'Health': Health,
  'Climate Change and Disaster Risk Management': ClimateChange,
  'E-commerce and Digital Economy': Environmental,
  'Crime Victimization': CrimeVictimization,
  'Social Protection Programs': SocialProtection,
  'Water Sanitation and Hygiene': WaterSanitation,
  'Housing Characteristics': HousingCharacteristics,
  'Refusal and Special Cases': Refusal,
};

function EditHouseholdFormPage({ params }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { householdId } = params;
  const userRole = profile?.role;

  const [currentSection, setCurrentSection] = useState('Geographic Identification');
  const [loading, setLoading] = useState(true);
  const [savedMembers, setSavedMembers] = useState([]);
  const [isUpdated, setIsUpdated] = useState(false);

  const sectionKeys = Object.keys(formSections);

  useEffect(() => {
    const loadHouseholdData = async () => {
      if (!householdId) {
        setLoading(false);
        return;
      }

      try {
        // Verify household exists
        const hhRef = doc(db, 'households', householdId);
        const hhSnap = await getDoc(hhRef);

        if (!hhSnap.exists()) {
          alert('Household not found');
          router.push('/household');
          return;
        }

        // Load members for this household
        const membersSnap = await getDocs(
          collection(db, 'households', householdId, 'members')
        );
        const members = membersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSavedMembers(members);
        setCurrentSection('Geographic Identification');
      } catch (error) {
        console.error('❌ Error loading household data:', error);
        alert('Failed to load household data');
      } finally {
        setLoading(false);
      }
    };

    loadHouseholdData();
  }, [householdId, router]);

  const goToNext = async () => {
    const currentIndex = sectionKeys.indexOf(currentSection);
    const nextSection = sectionKeys[currentIndex + 1];

    if (nextSection) {
      setCurrentSection(nextSection);
      if (householdId) {
        await setDoc(
          doc(db, 'households', householdId),
          {
            lastSection: nextSection,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
    } else {
      if (householdId) {
        await setDoc(
          doc(db, 'households', householdId),
          {
            lastSection: sectionKeys[sectionKeys.length - 1],
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
      setIsUpdated(true);
    }
  };

  const SectionComponent = formSections[currentSection] || (() => <div>Section not found</div>);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-green-600 mb-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-gray-600 text-sm">Loading form, please wait...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'Brgy-Secretary') {
    return (
      <div className="p-6 text-red-500 text-center">
        ❌ Access Denied: This page is restricted to <strong>Secretary</strong> users.
      </div>
    );
  }

  if (!user) {
    return <div className="p-6 text-red-500">❌ Unable to load form. Make sure you&apos;re logged in.</div>;
  }

  if (isUpdated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-green-700">✅ Household updated successfully!</h1>
          <p className="text-gray-600 mt-2">Your changes have been saved.</p>
          <button
            onClick={() => router.push('/household')}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Back to Households
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <FormSectionSidebar current={currentSection} setSection={setCurrentSection} />
      <main className="flex-1 p-6 bg-white rounded-r-lg shadow text-sm border-t border-gray-200 overflow-y-auto h-screen">
        <div className="h-full overflow-y-auto pr-2">
          <h2 className="text-2xl font-bold mb-1">{currentSection}</h2>
          <p className="text-gray-500 text-sm mb-4">Editing Household #{householdId}</p>
          <SectionComponent
            householdId={householdId}
            members={savedMembers}
            setSavedMembers={setSavedMembers}
            user={user}
            goToNext={goToNext}
            isEditing={true}
          />
        </div>
      </main>
    </div>
  );
}

export default EditHouseholdFormPage;
