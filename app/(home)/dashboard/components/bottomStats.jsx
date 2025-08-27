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
    <div className={`flex items-center justify-between bg-gradient-to-t ${gradientFrom} to-white rounded-xl shadow p-6`}>
      <div className="flex items-center">
        <div className={`text-xl p-2 rounded-full text-white ${color} mr-3`}>
          {icon}
        </div>
        <div>
          <div className="text-sm">{title}</div>
          <div className="text-lg font-bold">
            {loading ? <Spinner /> : value}
          </div>
        </div>
      </div>
    </div>
  );
}
