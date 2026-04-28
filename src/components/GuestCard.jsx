export function GuestCard({ guest, tableLabel, onSeat, onEdit, onDelete, draggable = true, onDragStart }) {
  return (
    <article
      draggable={draggable}
      onDragStart={(event) => onDragStart?.(event, guest.id)}
      className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-slate-800">{guest.name}</h4>
          <p className="text-xs text-slate-500">{guest.group} · {guest.menu}</p>
          <p className="text-xs text-slate-400">{guest.status === 'confirmed' ? 'Confirmat' : 'Neconfirmat'}</p>
        </div>
        {tableLabel && <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700">{tableLabel}</span>}
      </div>
      {guest.notes && <p className="text-xs text-slate-500">{guest.notes}</p>}
      <div className="flex flex-wrap gap-2">
        {onSeat && <button onClick={() => onSeat(guest)} className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Așază la masă</button>}
        <button onClick={() => onEdit(guest)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">Editează</button>
        <button onClick={() => onDelete(guest)} className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">Șterge</button>
      </div>
    </article>
  );
}
