  'use client';

  import { useState, useEffect } from 'react';
  import { doc, getDoc, addDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
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
    const [savedMembers, setSavedMembers] = useState([]);
    const [isComplete, setIsComplete] = useState(false);
    const sectionKeys = Object.keys(formSections);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);

        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserData(userSnap.data());

            const q = query(
              collection(db, 'households'),
              where('createdBy', '==', currentUser.uid),
              where('isComplete', '==', false)
            );

            const snap = await getDocs(q);

            const unfinished = snap.docs.find(doc => !doc.data().discarded);

            if (unfinished) {
              const confirmResume = window.confirm('You have an unfinished form. Do you want to continue?');

              if (confirmResume) {
                setHouseholdId(unfinished.id);
                setCurrentSection(unfinished.data().lastSection || 'Geographic Identification');
                setLoading(false);
                return;
              } else {
                await setDoc(doc(db, 'households', unfinished.id), { discarded: true }, { merge: true });
              }
            }

            const householdRef = await addDoc(collection(db, 'households'), {
              createdBy: currentUser.uid,
              createdAt: new Date(),
              isComplete: false,
              lastSection: 'Geographic Identification',
            });

            setHouseholdId(householdRef.id);
          }
        } catch (error) {
          console.error('❌ Error initializing household form:', error);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }, []);

    const goToNext = async () => {
      const currentIndex = sectionKeys.indexOf(currentSection);
      const nextSection = sectionKeys[currentIndex + 1];

      if (nextSection) {
        setCurrentSection(nextSection);

        if (householdId) {
          const householdRef = doc(db, 'households', householdId);
          await setDoc(householdRef, {
            lastSection: nextSection,
            updatedAt: new Date(),
          }, { merge: true });
        }
      } else {
        console.log('✅ All form sections completed');
        if (householdId) {
          const householdRef = doc(db, 'households', householdId);
          await setDoc(householdRef, {
            isComplete: true,
            updatedAt: new Date(),
          }, { merge: true });
        }
        setIsComplete(true);
      }
    };

    const SectionComponent = formSections[currentSection] || (() => <div>Section not found</div>);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-10 w-10 text-green-600 mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <p className="text-gray-600 text-sm">Loading form, please wait...</p>
          </div>
        </div>
      );
    }


    if (!user || !userData) {
      return (
        <div className="p-6 text-red-500">
          ❌ Unable to load form. Make sure you're logged in.
        </div>
      );
    }

    if (!householdId) {
      return <div className="p-6 text-gray-500">Creating household record...</div>;
    }

    if (isComplete) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-green-700">🎉 All forms completed!</h1>
            <p className="text-gray-600 mt-2">
              Thank you for completing the household survey.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen">
        <FormSectionSidebar current={currentSection} setSection={setCurrentSection} />

        <main className="flex-1 p-6 bg-white shadow-md text-sm border-t border-gray-200 overflow-y-auto h-screen">
          <div className="h-full overflow-y-auto pr-2">
            <h2 className="text-2xl font-bold mb-1">{currentSection}</h2>

            <SectionComponent
              householdId={householdId}
              setHouseholdId={setHouseholdId}
              members={savedMembers}
              setSavedMembers={setSavedMembers}
              user={user}
              userData={userData}
              goToNext={goToNext}
            />
          </div>
        </main>
      </div>
    );
  }
