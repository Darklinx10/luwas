'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase/config';

import FormSectionSidebar from '@/components/formSectionSidebar';
import GeographicIdentification from '@/components/Forms/geographic-information';
import DemographicCharacteristics from '@/components/Forms/demographic-characteristics';
import Migration from '@/components/Forms/migration';
import Education from '@/components/Forms/education';
import Community from '@/components/Forms/community';
import Economic from '@/components/Forms/economic';
import Entreprenuerialship from '@/components/Forms/entreprenuerial';
import Agriculture from '@/components/Forms/agriculture';
import FamilyIncome from '@/components/Forms/family-income';
import FoodConsumption from '@/components/Forms/food-consumption';
import FoodSecurity from '@/components/Forms/food-security';
import FinancialInclusion from '@/components/Forms/financial-inclusion';
import Health from '@/components/Forms/health';
import ClimateChange from '@/components/Forms/disasterpreparedness';
import Environmental from '@/components/Forms/ecommerce';
import CrimeVictimization from '@/components/Forms/crime-victimization';
import SocialProtection from '@/components/Forms/social-protection';
import WaterSanitation from '@/components/Forms/water-sanitation';
import HousingCharacteristics from '@/components/Forms/housing-characteristics';
import Refusal from '@/components/Forms/refusal-specialcases';

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

export default function AddHouseholdFormPage() {
  const [currentSection, setCurrentSection] = useState('Geographic Identification');
  const [householdId, setHouseholdId] = useState(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const sectionKeys = Object.keys(formSections);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        // Get user info
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }

        // Prevent creating multiple household docs
        if (!householdId) {
          const householdRef = await addDoc(collection(db, 'households'), {
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid,
            status: 'in-progress',
          });
          setHouseholdId(householdRef.id);
        }
      } catch (error) {
        console.error('Error initializing household or fetching user:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [householdId]);

  const goToNext = () => {
    const currentIndex = sectionKeys.indexOf(currentSection);
    const nextSection = sectionKeys[currentIndex + 1];
    if (nextSection) {
      setCurrentSection(nextSection);
    } else {
      console.log('✅ All form sections completed');
      // Optional: set status to 'completed' in Firestore
    }
  };

  const SectionComponent = formSections[currentSection] || (() => <div>Section not found</div>);

  if (loading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  if (!user || !userData || !householdId) {
    return (
      <div className="p-6 text-red-500">
        ❌ Unable to load form. Make sure you're logged in and household was created.
      </div>
    );
  }

  return (
    <div className="flex">
      <FormSectionSidebar current={currentSection} setSection={setCurrentSection} />

      <main className="flex-1 p-6 bg-white shadow-md text-sm border-t border-gray-200">
        <div className="h-full overflow-y-auto pr-2">
          <h2 className="text-2xl font-bold mb-1">{currentSection}</h2>
          <p className="text-sm text-gray-500 mb-4">
            Respondent:{' '}
            <strong>{`${userData.firstName || ''} ${userData.middleName || ''} ${userData.lastName || ''}`}</strong>
          </p>

          <SectionComponent
            householdId={householdId}
            user={user}
            userData={userData}
            goToNext={goToNext}
          />
        </div>
      </main>
    </div>
  );
}
