import { buildPrintData } from './printData';

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const downloadFile = (name, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const slug = (value) => String(value || 'event').trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();

export const exportJson = (event) => {
  downloadFile('seating-plan.json', JSON.stringify(event, null, 2), 'application/json');
};

export const exportCsv = (event) => {
  const tableMap = new Map(event.tables.map((table) => [table.id, table.number]));
  const lines = [
    ['Nume', 'Grup', 'Meniu', 'Status', 'Masa', 'Notițe'].map(csvEscape).join(','),
    ...event.guests
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
      .map((guest) => [
        guest.name,
        guest.group,
        guest.menu,
        guest.status === 'confirmed' ? 'Confirmat' : 'Neconfirmat',
        guest.tableId ? `Masa ${tableMap.get(guest.tableId)}` : 'Neașezat',
        guest.notes,
      ].map(csvEscape).join(',')),
  ];

  downloadFile('seating-plan.csv', lines.join('\n'), 'text/csv;charset=utf-8');
};

export const exportWord = (event) => {
  const report = buildPrintData(event);
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h1>${event.name}</h1>
        <h2>Rezumat</h2>
        <ul>
          <li>Total invitați: ${report.summary.totalGuests}</li>
          <li>Total mese: ${report.summary.totalTables}</li>
          <li>Invitați așezați: ${report.summary.seatedGuests}</li>
          <li>Invitați neașezați: ${report.summary.unseatedGuests}</li>
          <li>Locuri libere: ${report.summary.freeSeats}</li>
        </ul>
        <h2>Lista pe mese</h2>
        ${report.tables.map(({ table, guests }) => `<h3>Masa ${table.number}</h3><ul>${guests.map((guest) => `<li>${guest.name}</li>`).join('') || '<li>Fără invitați</li>'}</ul>`).join('')}
        <h2>Lista invitaților neașezați</h2>
        <ul>${report.unseatedGuests.map((guest) => `<li>${guest.name} — ${guest.group}${guest.menu ? ` — ${guest.menu}` : ''}</li>`).join('') || '<li>Nu există</li>'}</ul>
        <h2>Lista alfabetică</h2>
        <ul>${report.alphabetical.map((guest) => `<li>${guest.name} — ${guest.tableLabel}</li>`).join('')}</ul>
      </body>
    </html>`;

  downloadFile(`seating-plan-${slug(event.name)}.doc`, html, 'application/msword');
};
