export function TableDrawer({ open, table, guests, tables, onClose, onRemoveGuest, onMoveGuest, onAddExisting, onAddSeat, onRemoveSeat, onUpdateNotes }) {
  if (!open || !table) return null;

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside className="h-full w-full max-w-md space-y-4 overflow-y-auto bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Masa {table.number}</h3>
          <button onClick={onClose} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">Închide</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onAddSeat(table)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">+ scaun</button>
          <button onClick={() => onRemoveSeat(table)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm">- scaun</button>
          <button onClick={() => onAddExisting(table)} className="rounded-lg bg-emerald-100 px-3 py-1 text-sm text-emerald-700">Adaugă invitat</button>
        </div>
        <label className="block text-sm text-slate-600">
          Notițe masă
          <textarea
            defaultValue={table.notes}
            onBlur={(event) => onUpdateNotes(table, event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm"
            rows={3}
          />
        </label>
        <div className="space-y-2">
          <h4 className="font-medium">Invitați ({guests.length})</h4>
          {guests.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Masa este goală.</p>}
          {guests.map((guest) => (
            <div key={guest.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-medium text-slate-800">{guest.name}</p>
              <p className="text-xs text-slate-500">{guest.group} · {guest.menu}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => onRemoveGuest(guest)} className="rounded-lg bg-rose-100 px-2 py-1 text-xs text-rose-700">Elimină de la masă</button>
                <select
                  defaultValue=""
                  onChange={(event) => onMoveGuest(guest, event.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                >
                  <option value="" disabled>Mută la...</option>
                  {tables.filter((candidate) => candidate.id !== table.id).map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>Masa {candidate.number}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
