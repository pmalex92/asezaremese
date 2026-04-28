import { exportCsv, exportJson, exportWord } from '../utils/exporters';

export function ExportPanel({ open, onClose, event, onPrint }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 no-print">
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-4 shadow-xl">
        <h3 className="text-lg font-semibold">Export & Print</h3>
        <p className="text-sm text-slate-600">Exportă datele evenimentului în formatul dorit.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={() => onPrint()} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Print Mese</button>
          <button onClick={() => onPrint()} className="rounded-xl border border-indigo-300 px-3 py-2 text-indigo-700">Export PDF</button>
          <button onClick={() => exportWord(event)} className="rounded-xl border border-slate-300 px-3 py-2">Export Word</button>
          <button onClick={() => exportCsv(event)} className="rounded-xl border border-slate-300 px-3 py-2">Export CSV</button>
          <button onClick={() => exportJson(event)} className="rounded-xl bg-slate-800 px-3 py-2 text-white sm:col-span-2">Export JSON</button>
        </div>
        <button onClick={onClose} className="rounded-xl border border-slate-300 px-3 py-2">Închide</button>
      </div>
    </div>
  );
}
