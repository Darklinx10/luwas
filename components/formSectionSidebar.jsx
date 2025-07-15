'use client';
const formSections = [
  'Geographic Identification',
  'Demographic Characteristics',
  'Migration',
  'Education and Literacy',
  'Community and Political',
  'Economic Characteristics',
  'Entreprenuerial And Household Sustenance Activities',
  'Agriculture And Fishery Activities',
  'Family Income',
  'Food Consumption Expenditure',
  'Food Security',
  'Financial Inclusion',
  'Health',
  'Climate Change and Disaster Risk Management',
  'E-commerce and Digital Economy',
  'Crime Victimization',
  'Social Protection Programs',
  'Water Sanitation and Hygiene',
  'Housing Characteristics',
  'Refusal and Special Cases',
];

export default function FormSectionSidebar({ current, setSection }) {
  return (
    <aside className="w-48 sm:w-56 md:w-64 lg:w-72 h-screen overflow-y-auto bg-white p-4 shadow-md text-sm border-r border-t border-gray-200">

      <h2 className="text-lg font-bold text-[#0BAD4A] mb-4">Form Sections</h2>
      <ul className="space-y-1">
        {formSections.map((section) => {
          const isActive = section === current;
          return (
            <li key={section}>
              <button
                onClick={() => setSection(section)}
                className={`w-full text-left block px-2 py-2 rounded-md cursor-pointer ${
                  isActive
                    ? 'bg-[#0BAD4A] text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {section}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
