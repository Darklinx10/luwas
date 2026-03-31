import Spinner from './Spinner';

const gradientMap = {
  'bg-blue-500': 'from-blue-500',
  'bg-green-500': 'from-green-500',
  'bg-yellow-500': 'from-yellow-500',
  'bg-red-500': 'from-red-500',
  'bg-purple-500': 'from-purple-500',
};

export default function SummaryCard({ title, value, icon, color, loading }) {
  const gradientFrom = gradientMap[color] || 'from-gray-500';

  return (
    <div className={`flex flex-col items-center justify-center bg-gradient-to-b ${gradientFrom} to-white rounded-xl shadow p-4`}>
      <div className={`text-2xl p-3 rounded-full text-white ${color} mb-3`}>{icon}</div>
      <div className="text-center">
        <div className="text-xs text-gray-600 font-bold">{title}</div>
        <div className="text-2xl text-gray-700 font-bold">
          {loading ? <Spinner /> : value}
        </div>
      </div>
    </div>
  );
}
