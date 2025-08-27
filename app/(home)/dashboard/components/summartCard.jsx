import Spinner from './spinner';

export default function BottomStat({ title, value, icon, color, solidColor, loading }) {
  return (
    <div className={`flex items-center justify-between bg-gradient-to-b ${color} to-white rounded-xl shadow p-6`}>
      <div className="flex items-center">
        <div className={`text-xl p-2 rounded-full text-white ${solidColor} mr-3`}>
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
