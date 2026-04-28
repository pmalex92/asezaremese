import { GROUP_OPTIONS, MENU_OPTIONS, STATUS_OPTIONS } from '../constants/options';

export function AddGuestModal({ open, onClose, onSubmit, initialGuest }) {
  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      name: formData.get('name')?.trim(),
      group: formData.get('group'),
      menu: formData.get('menu'),
      notes: formData.get('notes')?.trim(),
      status: formData.get('status'),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-4 shadow-xl">
        <h3 className="text-lg font-semibold">{initialGuest ? 'Editează invitat' : 'Adaugă invitat'}</h3>
        <input name="name" required defaultValue={initialGuest?.name} placeholder="Nume invitat" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <select name="group" defaultValue={initialGuest?.group ?? GROUP_OPTIONS[0]} className="w-full rounded-xl border border-slate-200 px-3 py-2">
          {GROUP_OPTIONS.map((group) => <option key={group}>{group}</option>)}
        </select>
        <select name="menu" defaultValue={initialGuest?.menu ?? MENU_OPTIONS[0]} className="w-full rounded-xl border border-slate-200 px-3 py-2">
          {MENU_OPTIONS.map((menu) => <option key={menu}>{menu}</option>)}
        </select>
        <select name="status" defaultValue={initialGuest?.status ?? 'confirmed'} className="w-full rounded-xl border border-slate-200 px-3 py-2">
          {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
        <textarea name="notes" defaultValue={initialGuest?.notes} placeholder="Notițe" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-3 py-2">Anulează</button>
          <button type="submit" className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Salvează</button>
        </div>
      </form>
    </div>
  );
}
