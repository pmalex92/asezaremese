import { TableCard } from './TableCard';

export function TableGrid(props) {
  const { tables } = props;
  return (
    <section className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          {...props}
          table={table}
          guests={props.guests.filter((guest) => guest.tableId === table.id)}
        />
      ))}
      {tables.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Nu există mese. Apasă „Adaugă masă”.</p>}
    </section>
  );
}
