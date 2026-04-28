export function ManualDuplicateModal({ open, duplicate, tableLabel, onAddAnyway, onCancel, onEditName }) {
  if (!open || !duplicate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-amber-900">Nume duplicat găsit</h3>
        <p className="mt-2 text-sm text-slate-700">
          Există deja un invitat cu numele <strong>{duplicate.name}</strong>. {tableLabel ? `Invitatul existent este deja la ${tableLabel}.` : 'Invitatul existent este în lista de invitați neașezați.'}
        </p>
        <p className="mt-2 text-sm text-slate-600">Este posibil să fie aceeași persoană sau o persoană diferită. Vrei să o adaugi oricum?</p>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={onAddAnyway} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Adaugă oricum</button>
          <button onClick={onEditName} className="rounded-xl border border-slate-300 px-3 py-2">Modifică numele</button>
          <button onClick={onCancel} className="rounded-xl border border-rose-300 px-3 py-2 text-rose-700">Anulează</button>
        </div>
      </div>
    </div>
  );
}
