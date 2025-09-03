import Spinner from './spinner';

export default function BottomStat({ title, value, icon, color, solidColor, loading }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-gradient-to-b ${color} to-white rounded-xl shadow p-3`}>
      <div className={`text-3xl p-2 rounded-full text-gray-200 ${solidColor} mb-3`}>
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
