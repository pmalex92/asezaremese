import { useEffect, useMemo, useRef, useState } from 'react';
import { HeaderStats } from './components/HeaderStats';
import { GuestSidebar } from './components/GuestSidebar';
import { TableGrid } from './components/TableGrid';
import { TableDrawer } from './components/TableDrawer';
import { AddGuestModal } from './components/AddGuestModal';
import { AddTableModal } from './components/AddTableModal';
import { ExportPanel } from './components/ExportPanel';
import { PrintView } from './components/PrintView';
import { SearchBar } from './components/SearchBar';
import { ImportExcelModal } from './components/ImportExcelModal';
import { ManualDuplicateModal } from './components/ManualDuplicateModal';
import { buildGuestIndex, normalizeName } from './utils/guestMatching';
import {
  clearAllData,
  clearCachedEvent,
  clearToken,
  emptyEvent,
  loadCachedEvent,
  loadToken,
  normalizeEvent,
  resetToDemo,
  saveCachedEvent,
  saveToken,
} from './utils/storage';
import {
  createBackup,
  downloadBackup,
  getEvent as getEventFromApi,
  listBackups,
  resetEvent,
  restoreBackup,
  saveEvent as saveEventToApi,
} from './utils/api';

const uid = () => crypto.randomUUID();

const hasData = (event) => Boolean(event.updatedAt || event.name || event.tables.length || event.guests.length);

export default function App() {
  const [event, setEvent] = useState(emptyEvent);
  const [tokenInput, setTokenInput] = useState(loadToken());
  const [token, setToken] = useState(loadToken());
  const [isBooting, setIsBooting] = useState(true);
  const [authError, setAuthError] = useState('');
  const [serverStatus, setServerStatus] = useState('offline');
  const [saveMessage, setSaveMessage] = useState('Nesalvat');
  const [saveWarning, setSaveWarning] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showNoEventScreen, setShowNoEventScreen] = useState(false);
  const [backupList, setBackupList] = useState([]);

  const [guestSearch, setGuestSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const [guestModal, setGuestModal] = useState({ open: false, guest: null, targetTableId: null });
  const [tableModal, setTableModal] = useState({ open: false, table: null });
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [manualDuplicateState, setManualDuplicateState] = useState({ open: false, existing: null, payload: null });

  const skipNextSave = useRef(true);

  const fetchBackups = async (authToken) => {
    try {
      const result = await listBackups(authToken);
      setBackupList(result.backups || []);
    } catch {
      setBackupList([]);
    }
  };

  useEffect(() => {
    if (!token) {
      setIsBooting(false);
      setShowNoEventScreen(false);
      return;
    }

    const bootstrap = async () => {
      setIsBooting(true);
      setAuthError('');
      try {
        const serverEvent = normalizeEvent(await getEventFromApi(token));
        setEvent(serverEvent);
        setLastSavedAt(serverEvent.updatedAt);
        setShowNoEventScreen(!hasData(serverEvent));
        setServerStatus('online');
        setSaveMessage(serverEvent.updatedAt ? 'Salvat pe server' : 'Nesalvat');
        setSaveWarning('');
        clearCachedEvent();
        await fetchBackups(token);
      } catch (error) {
        if (error.code === 401) {
          setAuthError('Parolă invalidă. Introdu parola corectă.');
          setToken('');
          clearToken();
        } else {
          const cached = loadCachedEvent();
          if (cached) setEvent(cached);
          setServerStatus('offline');
          setSaveWarning('Serverul nu este disponibil. Modificările sunt salvate temporar local.');
        }
      } finally {
        skipNextSave.current = true;
        setIsBooting(false);
      }
    };

    bootstrap();
  }, [token]);

  useEffect(() => {
    if (!token || isBooting) return;

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      saveCachedEvent(event);
      setSaveMessage('Se salvează...');

      try {
        const result = await saveEventToApi(token, event);
        setServerStatus('online');
        setSaveWarning('');
        setLastSavedAt(result.updatedAt || new Date().toISOString());
        setSaveMessage('Salvat pe server');
      } catch (error) {
        if (error.code === 401) {
          clearToken();
          setToken('');
          setAuthError('Sesiunea a expirat. Reautentificare necesară.');
          return;
        }

        setServerStatus('offline');
        setSaveWarning('Serverul nu este disponibil. Modificările sunt salvate temporar local.');
        setSaveMessage('Salvat local (fallback)');
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [event, isBooting, token]);

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

  const commitGuest = (payload) => {
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
    setShowNoEventScreen(false);
    setGuestModal({ open: false, guest: null, targetTableId: null });
  };

  const upsertGuest = (payload) => {
    if (!payload.name) return alert('Numele este obligatoriu.');

    const guestIndex = buildGuestIndex(event.guests);
    const existing = guestIndex.get(normalizeName(payload.name))?.find((guest) => guest.id !== guestModal.guest?.id);

    if (existing && !guestModal.guest) {
      setManualDuplicateState({ open: true, existing, payload });
      return;
    }

    commitGuest(payload);
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
    setShowNoEventScreen(false);
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

  const handleDragStart = (eventObj, guestId) => {
    eventObj.dataTransfer.setData('text/plain', guestId);
  };

  const handleDropGuest = (eventObj, tableId) => {
    eventObj.preventDefault();
    const guestId = eventObj.dataTransfer.getData('text/plain');
    if (guestId) seatGuest(guestId, tableId);
  };

  const handleImportApply = ({ toAdd, updates, keptDuplicates, skippedDuplicates }) => {
    setEvent((prev) => ({
      ...prev,
      guests: [
        ...prev.guests.map((guest) => {
          const update = updates.find((item) => item.id === guest.id);
          if (!update) return guest;
          const { _row, _key, ...payload } = update.payload;
          return { ...guest, ...payload };
        }),
        ...toAdd.map((guest) => {
          const { _row, _key, ...payload } = guest;
          return { id: uid(), ...payload, tableId: null };
        }),
      ],
    }));

    setImportMessage(`Au fost importați ${toAdd.length + updates.length} invitați. ${keptDuplicates} duplicate au fost păstrate, ${skippedDuplicates} duplicate au fost ignorate.`);
    setTimeout(() => setImportMessage(''), 5000);
  };

  const onLogin = async () => {
    if (!tokenInput.trim()) return;
    saveToken(tokenInput.trim());
    setToken(tokenInput.trim());
  };

  const onImportBackupFile = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed?.event) return alert('Fișier backup invalid.');
      setEvent(normalizeEvent(parsed.event));
      setShowNoEventScreen(false);
    } catch {
      alert('Nu am putut importa backup-ul.');
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-800">Autentificare admin</h2>
          <p className="mt-2 text-sm text-slate-600">Introdu parola pentru acces la datele evenimentului.</p>
          <input
            type="password"
            value={tokenInput}
            onChange={(eventObj) => setTokenInput(eventObj.target.value)}
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Parola"
          />
          {authError && <p className="mt-3 text-sm text-rose-600">{authError}</p>}
          <button onClick={onLogin} className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white">Conectează-te</button>
        </div>
      </div>
    );
  }

  if (isBooting) {
    return <div className="flex min-h-screen items-center justify-center text-slate-700">Se încarcă datele de pe server...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="no-print rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <h3 className="font-semibold text-slate-800">Salvare &amp; Backup</h3>
          <p className="text-slate-600">Status: {serverStatus === 'online' ? 'Conectat la server' : 'Offline'}</p>
          <p className="text-slate-600">{saveMessage}{lastSavedAt ? ` • Ultima salvare: ${new Date(lastSavedAt).toLocaleString()}` : ''}</p>
          {saveWarning && <p className="text-amber-700">{saveWarning}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded-lg border border-slate-300 px-3 py-1" onClick={async () => {
              await createBackup(token);
              await fetchBackups(token);
            }}>
              Creează backup
            </button>
            <button className="rounded-lg border border-slate-300 px-3 py-1" onClick={() => fetchBackups(token)}>Vezi backup-uri</button>
            <button className="rounded-lg border border-rose-300 px-3 py-1 text-rose-700" onClick={async () => {
              if (!confirm('Sigur vrei reset complet?')) return;
              await resetEvent(token);
              setEvent(emptyEvent());
              setShowNoEventScreen(true);
            }}>
              Reset server
            </button>
            <button className="rounded-lg border border-slate-300 px-3 py-1" onClick={() => {
              clearToken();
              setToken('');
            }}>
              Logout
            </button>
          </div>
          {backupList.length > 0 && (
            <div className="mt-3 space-y-2">
              {backupList.map((backup) => (
                <div key={backup.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-2 py-1">
                  <span className="text-xs text-slate-700">{backup.id}</span>
                  <button className="rounded border border-indigo-300 px-2 py-0.5 text-xs text-indigo-700" onClick={async () => {
                    const restored = await restoreBackup(token, backup.id);
                    skipNextSave.current = true;
                    setEvent(normalizeEvent(restored.event));
                    setShowNoEventScreen(false);
                  }}>
                    Restore
                  </button>
                  <button className="rounded border border-slate-300 px-2 py-0.5 text-xs" onClick={() => downloadBackup(token, backup.id)}>Descarcă</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showNoEventScreen ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Nu există încă un eveniment salvat pe server.</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-white" onClick={() => {
                setEvent(emptyEvent());
                setShowNoEventScreen(false);
              }}>Creează eveniment nou</button>
              <button className="rounded-xl border border-slate-300 px-4 py-2" onClick={() => {
                setEvent(resetToDemo());
                setShowNoEventScreen(false);
              }}>Încarcă date demo</button>
              <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2">
                Importă backup
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImportBackupFile(e.target.files[0])} />
              </label>
            </div>
          </div>
        ) : (
          <>
            <div className="no-print">
              <HeaderStats
                metrics={metrics}
                eventName={event.name}
                onEventNameChange={(name) => setEvent((prev) => ({ ...prev, name }))}
                onOpenGuest={() => setGuestModal({ open: true, guest: null, targetTableId: null })}
                onOpenTable={() => setTableModal({ open: true, table: null })}
                onImport={() => setImportOpen(true)}
                onExport={() => setExportOpen(true)}
                onResetDemo={() => setEvent(resetToDemo())}
                onClearAll={() => confirm('Ștergi toate datele?') && setEvent(clearAllData())}
              />
            </div>

            {importMessage && <div className="no-print rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{importMessage}</div>}

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
                onDragOver={(eventObj) => eventObj.preventDefault()}
              />
            </div>
          </>
        )}
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

      <ImportExcelModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        event={event}
        onApply={handleImportApply}
      />

      <ManualDuplicateModal
        open={manualDuplicateState.open}
        duplicate={manualDuplicateState.existing}
        tableLabel={manualDuplicateState.existing?.tableId ? `Masa ${event.tables.find((table) => table.id === manualDuplicateState.existing.tableId)?.number}` : null}
        onAddAnyway={() => {
          commitGuest(manualDuplicateState.payload);
          setManualDuplicateState({ open: false, existing: null, payload: null });
        }}
        onCancel={() => setManualDuplicateState({ open: false, existing: null, payload: null })}
        onEditName={() => setManualDuplicateState({ open: false, existing: null, payload: null })}
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
