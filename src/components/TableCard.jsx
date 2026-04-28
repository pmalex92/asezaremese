const statusStyle = {
  empty: 'bg-slate-100 text-slate-600',
  available: 'bg-emerald-100 text-emerald-700',
  almost: 'bg-amber-100 text-amber-700',
  full: 'bg-rose-100 text-rose-700',
};

export function TableCard({ table, guests, onClick, onEdit, onDelete, onSeat, onAddSeat, onRemoveSeat, onDropGuest, onDragOver }) {
  const used = guests.length;
  const free = table.seats - used;
  const ratio = used / table.seats;
  const status = used === 0 ? 'empty' : free === 0 ? 'full' : ratio > 0.8 ? 'almost' : 'available';
  const statusText = used === 0 ? 'Goală' : free === 0 ? 'Plină' : `${free} locuri libere`;

  return (
    <article
      onClick={() => onClick(table)}
      onDrop={(event) => onDropGuest(event, table.id)}
      onDragOver={onDragOver}
      title={guests.length ? guests.map((guest) => guest.name).join('\n') : 'Niciun invitat'}
      className="group cursor-pointer space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-lg font-semibold text-slate-800">Masa {table.number}</h4>
          <p className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyle[status]}`}>{statusText}</p>
        </div>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-sm text-slate-700">{used} / {table.seats}</span>
      </div>
      <ul className="min-h-14 space-y-1 text-sm text-slate-600">
        {guests.slice(0, 3).map((guest) => <li key={guest.id}>• {guest.name}</li>)}
        {guests.length > 3 && <li className="text-xs text-slate-400">+{guests.length - 3} alți invitați</li>}
        {guests.length === 0 && <li className="text-xs text-slate-400">Adaugă invitați prin drag & drop.</li>}
      </ul>
      <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
        <button onClick={() => onAddSeat(table)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs">+ scaun</button>
        <button onClick={() => onRemoveSeat(table)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs">- scaun</button>
        <button onClick={() => onSeat(table)} className="rounded-lg bg-emerald-100 px-2 py-1 text-xs text-emerald-700">adaugă invitat</button>
        <button onClick={() => onEdit(table)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs">editează</button>
        <button onClick={() => onDelete(table)} className="rounded-lg bg-rose-100 px-2 py-1 text-xs text-rose-700">șterge</button>
      </div>
    </article>
  );
}
