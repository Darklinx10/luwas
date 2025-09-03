import Spinner from './spinner';

const gradientMap = {
  "bg-blue-500": "from-blue-500",
  "bg-green-500": "from-green-500",
  "bg-yellow-500": "from-yellow-500",
  "bg-red-500": "from-red-500",
};

export default function BottomStat({ title, value, icon, color, loading }) {
  const gradientFrom = gradientMap[color] || "from-gray-500";

  return (
    <div className={`flex flex-col items-center justify-center bg-gradient-to-t ${gradientFrom} to-white rounded-xl shadow p-4`}>
      <div className={`text-xl p-2 rounded-full text-gray-200 ${color} mb-3`}>
        {icon}
      </div>
      <div className='text-center'>
        <div className="text-sm text-gray-600 font-bold">{title}</div>
        <div className="text-lg text-gray-600 font-bold">
          {loading ? <Spinner /> : value}
        </div>
      </div>
    </div>
  );
}
