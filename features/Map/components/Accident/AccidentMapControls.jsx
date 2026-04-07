'use client';

export default function AccidentMapControls({
  isAccidentMap,
  isMDRRMCAdmin,
  addingAccident,
  setAddingAccident,
}) {
  if (!isAccidentMap || isMDRRMCAdmin) return null;

  return (
    <div className="leaflet-top leaflet-left ml-10">
      <div className="leaflet-control mt-2 ml-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setAddingAccident((prev) => !prev)}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition ${addingAccident
              ? 'bg-red-50 text-red-700 ring-1 ring-red-100 hover:bg-red-100'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
        >
          {addingAccident ? 'Cancel Accident Entry' : 'Add Accident'}
        </button>
      </div>
    </div>
  );
}