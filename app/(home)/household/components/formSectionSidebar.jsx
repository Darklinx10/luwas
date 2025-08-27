'use client';

// ✅ Array of all form sections in order
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

// ✅ Sidebar component for displaying and selecting form sections
export default function FormSectionSidebar({ current, setSection }) {
  return (
    <aside className="w-48 sm:w-56 md:w-64 lg:w-72 h-screen overflow-y-auto bg-white p-4 rounded-l-lg shadow text-sm border-t border-r border-gray-200">
      {/* Sidebar title */}
      <h2 className="text-lg font-bold text-[#0BAD4A] mb-4">Form Sections</h2>

      {/* List of all form sections */}
      <ul className="space-y-1">
        {formSections.map((section) => {
          // 🔍 Check if this section is the currently selected one
          const isActive = section === current;

          return (
            <li key={section}>
              <button
                onClick={() => setSection(section)} // 🔄 Update current section on click
                className={`w-full text-left block px-2 py-2 rounded-md cursor-pointer ${
                  isActive
                    ? 'bg-[#0BAD4A] text-white font-semibold' // 🟢 Highlight active section
                    : 'text-gray-700 hover:bg-gray-100' // ⚪ Normal state
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
