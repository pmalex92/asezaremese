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
