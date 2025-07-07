const sections = [
  'Geographic Identification',
  'Demographic Characteristics',
  'Migration',
  'Education and Literacy',
  'Community and Political',
  'Economic Characteristics',
  'Languages and Religion',
  'Family Income',
  'Food Consumption Expenditure',
  'Food Security',
  'Health',
  'Climate Change and Disaster Risk Management',
  'Environmental and Digital Economy',
  'Crime Victimization',
  'Social Protection Programs',
  'Water Sanitation and Hygiene',
  'Housing Characteristics',
  'Refusal and Special Cases',
];

export default function FormSectionSidebar({ current, setSection }) {
  return (
    <aside className="w-72 bg-white border-r p-4 h-full overflow-auto">
      <ul className="space-y-2">
        {sections.map((section, index) => (
          <li key={index}>
            <button
              onClick={() => setSection(section)}
              className={`w-full text-left px-4 py-2 rounded ${
                current === section
                  ? 'bg-green-200 text-green-800 font-bold'
                  : 'hover:bg-green-100 text-gray-700'
              }`}
            >
              {section}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
