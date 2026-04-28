export function PrintView({ event }) {
  const tableMap = new Map(event.tables.map((table) => [table.id, table]));
  const guestsByTable = event.tables.map((table) => ({
    table,
    guests: event.guests.filter((guest) => guest.tableId === table.id).sort((a, b) => a.name.localeCompare(b.name, 'ro')),
  }));
  const alphaGuests = event.guests
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'));

  return (
    <div className="hidden print:block print:p-6">
      <h1 className="mb-4 text-2xl font-bold">{event.name}</h1>
      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">A. Lista pe mese</h2>
        {guestsByTable.map(({ table, guests }) => (
          <div key={table.id} className="mb-3">
            <h3 className="font-semibold">Masa {table.number}</h3>
            <ul className="list-disc pl-6">
              {guests.length === 0 && <li>Fără invitați</li>}
              {guests.map((guest) => <li key={guest.id}>{guest.name}</li>)}
            </ul>
          </div>
        ))}
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">B. Lista alfabetică</h2>
        <ul className="list-disc pl-6">
          {alphaGuests.map((guest) => (
            <li key={guest.id}>
              {guest.name} — {guest.tableId ? `Masa ${tableMap.get(guest.tableId)?.number}` : 'Neașezat'}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
