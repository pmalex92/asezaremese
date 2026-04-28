const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-lg font-semibold text-slate-800">{value}</p>
  </div>
);

export function HeaderStats({ metrics, eventName, onEventNameChange, onOpenGuest, onOpenTable, onExport, onResetDemo, onClearAll }) {
  return (
    <header className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Seating Planner</p>
          <input
            value={eventName}
            onChange={(event) => onEventNameChange(event.target.value)}
            className="w-full rounded-lg border border-transparent text-2xl font-semibold text-slate-900 focus:border-slate-200 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onOpenGuest} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Adaugă invitat</button>
          <button onClick={onOpenTable} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white">Adaugă masă</button>
          <button onClick={onExport} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Export listă</button>
          <button onClick={onResetDemo} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700">Reset demo</button>
          <button onClick={onClearAll} className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700">Șterge date</button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <Stat label="Total invitați" value={metrics.totalGuests} />
        <Stat label="Invitați așezați" value={metrics.seatedGuests} />
        <Stat label="Invitați neașezați" value={metrics.unseatedGuests} />
        <Stat label="Număr mese" value={metrics.totalTables} />
        <Stat label="Locuri totale" value={metrics.totalSeats} />
        <Stat label="Locuri ocupate" value={metrics.usedSeats} />
        <Stat label="Locuri libere" value={metrics.freeSeats} />
      </div>
    </header>
  );
}
