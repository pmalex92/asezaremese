import { useEffect, useMemo, useState } from 'react';
import { HeaderStats } from './components/HeaderStats';
import { GuestSidebar } from './components/GuestSidebar';
import { TableGrid } from './components/TableGrid';
import { TableDrawer } from './components/TableDrawer';
import { AddGuestModal } from './components/AddGuestModal';
import { AddTableModal } from './components/AddTableModal';
import { ExportPanel } from './components/ExportPanel';
import { PrintView } from './components/PrintView';
import { SearchBar } from './components/SearchBar';
import { clearAllData, loadEvent, resetToDemo, saveEvent } from './utils/storage';

const uid = () => crypto.randomUUID();

export default function App() {
  const [event, setEvent] = useState(loadEvent);
  const [guestSearch, setGuestSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const [guestModal, setGuestModal] = useState({ open: false, guest: null, targetTableId: null });
  const [tableModal, setTableModal] = useState({ open: false, table: null });
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => saveEvent(event), [event]);

  const metrics = useMemo(() => {
    const totalGuests = event.guests.length;
    const seatedGuests = event.guests.filter((guest) => guest.tableId).length;
    const totalSeats = event.tables.reduce((sum, table) => sum + table.seats, 0);
    return {
      totalGuests,
      seatedGuests,
      unseatedGuests: totalGuests - seatedGuests,
      totalTables: event.tables.length,
      totalSeats,
      usedSeats: seatedGuests,
      freeSeats: totalSeats - seatedGuests,
    };
  }, [event]);

  const filteredGuests = useMemo(() => event.guests.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(guestSearch.toLowerCase());
    const matchesGroup = groupFilter === 'all' || guest.group === groupFilter;
    return matchesSearch && matchesGroup;
  }), [event.guests, guestSearch, groupFilter]);

  const selectedTable = event.tables.find((table) => table.id === selectedTableId) || null;
  const selectedTableGuests = event.guests.filter((guest) => guest.tableId === selectedTableId);

  const globalSearchResult = globalSearch
    ? event.guests.filter((guest) => guest.name.toLowerCase().includes(globalSearch.toLowerCase()))
      .map((guest) => ({ ...guest, tableNumber: event.tables.find((table) => table.id === guest.tableId)?.number }))
    : [];

  const findTableById = (tableId) => event.tables.find((table) => table.id === tableId);
  const tableOccupancy = (tableId) => event.guests.filter((guest) => guest.tableId === tableId).length;

  const upsertGuest = (payload) => {
    if (!payload.name) return alert('Numele este obligatoriu.');
    const duplicate = event.guests.find((guest) => guest.name.toLowerCase() === payload.name.toLowerCase() && guest.id !== guestModal.guest?.id);
    if (duplicate && !confirm('Există deja un invitat cu același nume. Continui?')) return;

    setEvent((prev) => {
      if (guestModal.guest) {
        return {
          ...prev,
          guests: prev.guests.map((guest) => guest.id === guestModal.guest.id ? { ...guest, ...payload } : guest),
        };
      }
      return {
        ...prev,
        guests: [...prev.guests, { id: uid(), ...payload, tableId: guestModal.targetTableId ?? null }],
      };
    });
    setGuestModal({ open: false, guest: null, targetTableId: null });
  };

  const upsertTable = (payload) => {
    if (payload.seats < 1) return alert('Numărul de scaune trebuie să fie minim 1.');
    const duplicate = event.tables.find((table) => table.number === payload.number && table.id !== tableModal.table?.id);
    if (duplicate) return alert('Există deja o masă cu acest număr.');

    setEvent((prev) => {
      if (tableModal.table) {
        return {
          ...prev,
          tables: prev.tables.map((table) => table.id === tableModal.table.id ? { ...table, ...payload } : table),
        };
      }
      return { ...prev, tables: [...prev.tables, { id: uid(), ...payload }] };
    });
    setTableModal({ open: false, table: null });
  };

  const seatGuest = (guestId, tableId) => {
    const target = findTableById(tableId);
    if (!target) return;
    if (tableOccupancy(tableId) >= target.seats) return alert('Masa este plină. Adaugă un scaun.');

    setEvent((prev) => ({
      ...prev,
      guests: prev.guests.map((guest) => guest.id === guestId ? { ...guest, tableId } : guest),
    }));
  };

  const removeGuestFromTable = (guest) => {
    setEvent((prev) => ({
      ...prev,
      guests: prev.guests.map((item) => item.id === guest.id ? { ...item, tableId: null } : item),
    }));
  };

  const changeSeats = (table, delta) => {
    const occupancy = tableOccupancy(table.id);
    const nextSeats = table.seats + delta;
    if (nextSeats < 1) return;
    if (nextSeats < occupancy) return alert('Nu poți avea mai puține scaune decât invitați așezați.');

    setEvent((prev) => ({
      ...prev,
      tables: prev.tables.map((item) => item.id === table.id ? { ...item, seats: nextSeats } : item),
    }));
  };

  const deleteTable = (table) => {
    const hasGuests = tableOccupancy(table.id) > 0;
    if (hasGuests && !confirm('Masa are invitați. Sigur vrei să o ștergi?')) return;

    setEvent((prev) => ({
      ...prev,
      tables: prev.tables.filter((item) => item.id !== table.id),
      guests: prev.guests.map((guest) => guest.tableId === table.id ? { ...guest, tableId: null } : guest),
    }));
    if (selectedTableId === table.id) setSelectedTableId(null);
  };

  const deleteGuest = (guest) => {
    if (!confirm(`Ștergi invitatul ${guest.name}?`)) return;
    setEvent((prev) => ({ ...prev, guests: prev.guests.filter((item) => item.id !== guest.id) }));
  };

  const handleDragStart = (event, guestId) => {
    event.dataTransfer.setData('text/plain', guestId);
  };

  const handleDropGuest = (event, tableId) => {
    event.preventDefault();
    const guestId = event.dataTransfer.getData('text/plain');
    if (guestId) seatGuest(guestId, tableId);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="no-print">
          <HeaderStats
            metrics={metrics}
            eventName={event.name}
            onEventNameChange={(name) => setEvent((prev) => ({ ...prev, name }))}
            onOpenGuest={() => setGuestModal({ open: true, guest: null, targetTableId: null })}
            onOpenTable={() => setTableModal({ open: true, table: null })}
            onExport={() => setExportOpen(true)}
            onResetDemo={() => setEvent(resetToDemo())}
            onClearAll={() => confirm('Ștergi toate datele?') && setEvent(clearAllData())}
          />
        </div>

        <div className="no-print rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Căutare globală</h3>
          <SearchBar value={globalSearch} onChange={setGlobalSearch} placeholder="ex: Maria" />
          {globalSearch && (
            <div className="mt-2 space-y-1 text-sm">
              {globalSearchResult.length === 0 && <p className="text-slate-500">Niciun rezultat.</p>}
              {globalSearchResult.map((guest) => (
                <p key={guest.id} className="rounded-lg bg-slate-50 px-2 py-1">
                  {guest.name} — {guest.tableNumber ? `Masa ${guest.tableNumber}` : 'Neașezat'}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="no-print flex flex-col gap-4 lg:flex-row">
          <GuestSidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            guests={filteredGuests.filter((guest) => !guest.tableId)}
            tables={event.tables}
            guestSearch={guestSearch}
            onGuestSearch={setGuestSearch}
            groupFilter={groupFilter}
            onGroupFilter={setGroupFilter}
            onSeat={(guest) => {
              const tableNumber = prompt('Numărul mesei pentru invitat:');
              const table = event.tables.find((item) => String(item.number) === tableNumber);
              if (table) seatGuest(guest.id, table.id);
            }}
            onEdit={(guest) => setGuestModal({ open: true, guest, targetTableId: null })}
            onDelete={deleteGuest}
            onDragStart={handleDragStart}
          />

          <TableGrid
            tables={event.tables.slice().sort((a, b) => a.number - b.number)}
            guests={event.guests}
            onClick={(table) => setSelectedTableId(table.id)}
            onEdit={(table) => setTableModal({ open: true, table })}
            onDelete={deleteTable}
            onSeat={(table) => setGuestModal({ open: true, guest: null, targetTableId: table.id })}
            onAddSeat={(table) => changeSeats(table, 1)}
            onRemoveSeat={(table) => changeSeats(table, -1)}
            onDropGuest={handleDropGuest}
            onDragOver={(event) => event.preventDefault()}
          />
        </div>
      </div>

      <TableDrawer
        open={Boolean(selectedTable)}
        table={selectedTable}
        tables={event.tables}
        guests={selectedTableGuests}
        onClose={() => setSelectedTableId(null)}
        onRemoveGuest={removeGuestFromTable}
        onMoveGuest={(guest, tableId) => seatGuest(guest.id, tableId)}
        onAddExisting={() => {
          const freeGuests = event.guests.filter((guest) => !guest.tableId);
          if (!freeGuests.length) return alert('Nu există invitați neașezați.');
          const name = prompt(`Invitat disponibil: ${freeGuests.map((guest) => guest.name).join(', ')}\nScrie numele:`);
          const guest = freeGuests.find((item) => item.name.toLowerCase() === name?.toLowerCase());
          if (guest && selectedTable) seatGuest(guest.id, selectedTable.id);
        }}
        onAddSeat={(table) => changeSeats(table, 1)}
        onRemoveSeat={(table) => changeSeats(table, -1)}
        onUpdateNotes={(table, notes) => setEvent((prev) => ({
          ...prev,
          tables: prev.tables.map((item) => item.id === table.id ? { ...item, notes } : item),
        }))}
      />

      <AddGuestModal
        open={guestModal.open}
        initialGuest={guestModal.guest}
        onClose={() => setGuestModal({ open: false, guest: null, targetTableId: null })}
        onSubmit={upsertGuest}
      />

      <AddTableModal
        open={tableModal.open}
        initialTable={tableModal.table}
        onClose={() => setTableModal({ open: false, table: null })}
        onSubmit={upsertTable}
      />

      <ExportPanel
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        event={event}
        onPrint={() => window.print()}
      />

      <PrintView event={event} />
    </div>
  );
}
