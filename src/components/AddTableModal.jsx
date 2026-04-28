export function AddTableModal({ open, onClose, onSubmit, initialTable }) {
  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      number: Number(formData.get('number')),
      seats: Number(formData.get('seats')),
      notes: formData.get('notes')?.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-4 shadow-xl">
        <h3 className="text-lg font-semibold">{initialTable ? 'Editează masă' : 'Adaugă masă'}</h3>
        <input name="number" type="number" min="1" required defaultValue={initialTable?.number} placeholder="Număr masă" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <input name="seats" type="number" min="1" required defaultValue={initialTable?.seats ?? 8} placeholder="Număr scaune" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <textarea name="notes" defaultValue={initialTable?.notes} placeholder="Notițe" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-3 py-2">Anulează</button>
          <button type="submit" className="rounded-xl bg-slate-800 px-3 py-2 text-white">Salvează</button>
        </div>
      </form>
    </div>
  );
}
