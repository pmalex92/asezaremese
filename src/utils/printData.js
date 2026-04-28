export const buildPrintData = (event) => {
  const tableMap = new Map(event.tables.map((table) => [table.id, table]));
  const seatedGuests = event.guests.filter((guest) => guest.tableId);
  const unseatedGuests = event.guests
    .filter((guest) => !guest.tableId)
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  const totalSeats = event.tables.reduce((sum, table) => sum + table.seats, 0);

  const tables = event.tables
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((table) => ({
      table,
      guests: event.guests
        .filter((guest) => guest.tableId === table.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'ro')),
    }));

  const alphabetical = event.guests
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
    .map((guest) => ({
      ...guest,
      tableLabel: guest.tableId ? `Masa ${tableMap.get(guest.tableId)?.number}` : 'Neașezat',
    }));

  return {
    summary: {
      totalGuests: event.guests.length,
      totalTables: event.tables.length,
      seatedGuests: seatedGuests.length,
      unseatedGuests: unseatedGuests.length,
      freeSeats: totalSeats - seatedGuests.length,
    },
    tables,
    unseatedGuests,
    alphabetical,
  };
};
