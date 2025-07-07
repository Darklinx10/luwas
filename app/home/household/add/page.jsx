'use client';

import { useState } from 'react';
import FormSectionSidebar from '../../../../components/formSectionSidebar';
import * as Sections from './sections';

export default function AddHouseholdFormPage() {
  const [currentSection, setCurrentSection] = useState('Geographic Identification');

  const SectionComponent = Sections[
    currentSection.replace(/\s+/g, '').replace(/and/g, 'And')
  ] || (() => <div>Section not found</div>);

  return (
    <div className="flex h-screen">
      <FormSectionSidebar current={currentSection} setSection={setCurrentSection} />
      <div className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-bold mb-4">{currentSection}</h2>
        <SectionComponent />
      </div>
    </div>
  );
}
