import { buildPrintData } from '../utils/printData';

export function PrintView({ event }) {
  const report = buildPrintData(event);

  return (
    <div className="print-only bg-white p-8 text-slate-900">
      <h1 className="mb-4 text-3xl font-bold">{event.name}</h1>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Rezumat</h2>
        <ul className="list-disc pl-6">
          <li>Total invitați: {report.summary.totalGuests}</li>
          <li>Total mese: {report.summary.totalTables}</li>
          <li>Invitați așezați: {report.summary.seatedGuests}</li>
          <li>Invitați neașezați: {report.summary.unseatedGuests}</li>
          <li>Locuri libere: {report.summary.freeSeats}</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Lista pe mese</h2>
        {report.tables.map(({ table, guests }) => (
          <div key={table.id} className="mb-3">
            <h3 className="font-semibold">Masa {table.number}</h3>
            <ul className="list-disc pl-6">
              {guests.length === 0 && <li>Fără invitați</li>}
              {guests.map((guest) => <li key={guest.id}>{guest.name}</li>)}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Lista invitaților neașezați</h2>
        <ul className="list-disc pl-6">
          {report.unseatedGuests.length === 0 && <li>Nu există invitați neașezați</li>}
          {report.unseatedGuests.map((guest) => (
            <li key={guest.id}>{guest.name} — {guest.group}{guest.menu ? ` — ${guest.menu}` : ''}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Lista alfabetică</h2>
        <ul className="list-disc pl-6">
          {report.alphabetical.map((guest) => (
            <li key={guest.id}>{guest.name} — {guest.tableLabel}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
