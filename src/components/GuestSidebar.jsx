import { SearchBar } from './SearchBar';
import { GuestCard } from './GuestCard';
import { GROUP_OPTIONS } from '../constants/options';

export function GuestSidebar({
  collapsed,
  setCollapsed,
  guests,
  tables,
  guestSearch,
  onGuestSearch,
  groupFilter,
  onGroupFilter,
  onSeat,
  onEdit,
  onDelete,
  onDragStart,
}) {
  const tableMap = new Map(tables.map((table) => [table.id, `Masa ${table.number}`]));

  return (
    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm lg:w-[340px]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Invitați</h3>
        <button className="text-xs text-slate-500 lg:hidden" onClick={() => setCollapsed((prev) => !prev)}>
          {collapsed ? 'Deschide' : 'Ascunde'}
        </button>
      </div>
      <div className={`${collapsed ? 'hidden' : 'block'} space-y-3 lg:block`}>
        <SearchBar value={guestSearch} onChange={onGuestSearch} placeholder="Caută invitat..." />
        <select
          value={groupFilter}
          onChange={(event) => onGroupFilter(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="all">Toate categoriile</option>
          {GROUP_OPTIONS.map((group) => <option key={group} value={group}>{group}</option>)}
        </select>

        <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
          {guests.length === 0 && <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Nu există rezultate.</p>}
          {guests.map((guest) => (
            <GuestCard
              key={guest.id}
              guest={guest}
              tableLabel={guest.tableId ? tableMap.get(guest.tableId) : null}
              onSeat={!guest.tableId ? onSeat : null}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
