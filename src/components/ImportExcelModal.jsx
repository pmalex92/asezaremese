import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { buildGuestIndex, normalizeName } from '../utils/guestMatching';

const HEADER_MAP = {
  name: ['nume', 'name'],
  group: ['grup', 'group'],
  menu: ['meniu', 'menu'],
  notes: ['note', 'notes'],
  status: ['status'],
};

const normalizeHeader = (value) => normalizeName(value).replace(/[^a-z]/g, '');

const keyByHeader = (header) => {
  const normalized = normalizeHeader(header);
  return Object.entries(HEADER_MAP).find(([, aliases]) => aliases.some((alias) => normalizeHeader(alias) === normalized))?.[0];
};

const sanitizeFileNamePart = (name) => String(name || 'event').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();

const toGuestPayload = (record) => ({
  name: String(record.name ?? '').trim(),
  group: String(record.group ?? '').trim() || 'Altul',
  menu: String(record.menu ?? '').trim() || 'Normal',
  notes: String(record.notes ?? '').trim(),
  status: String(record.status ?? '').trim() || 'confirmed',
});

export function ImportExcelModal({ open, onClose, event, onApply }) {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [currentDuplicate, setCurrentDuplicate] = useState(0);
  const [decisions, setDecisions] = useState({});
  const [reviewMode, setReviewMode] = useState(false);
  const [fileName, setFileName] = useState('');

  const guestIndex = useMemo(() => buildGuestIndex(event.guests), [event.guests]);

  if (!open) return null;

  const resetState = () => {
    setRows([]);
    setErrors([]);
    setDuplicates([]);
    setCurrentDuplicate(0);
    setDecisions({});
    setFileName('');
    setReviewMode(false);
  };

  const close = () => {
    resetState();
    onClose();
  };

  const handleFile = async (file) => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
    if (!matrix.length) return;

    const headerRow = matrix[0].map((cell) => String(cell ?? ''));
    const mapped = headerRow.map((header) => keyByHeader(header));
    const dataRows = [];
    const parseErrors = [];
    const dupes = [];

    matrix.slice(1).forEach((rawRow, index) => {
      if (!rawRow.some((value) => String(value ?? '').trim())) return;
      const base = {};
      mapped.forEach((key, colIndex) => {
        if (!key) return;
        base[key] = rawRow[colIndex];
      });

      const payload = toGuestPayload(base);
      if (!payload.name) {
        parseErrors.push({ row: index + 2, reason: 'Nume lipsă' });
        return;
      }

      const normalized = normalizeName(payload.name);
      const existing = guestIndex.get(normalized) ?? [];
      const record = { ...payload, _row: index + 2, _key: normalized };
      dataRows.push(record);
      if (existing.length) {
        dupes.push({ incoming: record, existing });
      }
    });

    setRows(dataRows);
    setErrors(parseErrors);
    setDuplicates(dupes);
    setDecisions({});
    setCurrentDuplicate(0);
    setReviewMode(false);
    setFileName(file.name || sanitizeFileNamePart(event.name));
  };

  const duplicate = duplicates[currentDuplicate];
  const hasDuplicateStep = reviewMode && duplicates.length > 0 && currentDuplicate < duplicates.length;

  const applyImport = () => {
    const toAdd = [];
    const updates = [];
    let keptDuplicates = 0;
    let skippedDuplicates = 0;

    rows.forEach((row) => {
      const dupIndex = duplicates.findIndex((item) => item.incoming._row === row._row);
      if (dupIndex === -1) {
        toAdd.push(row);
        return;
      }

      const decision = decisions[dupIndex] || 'keep';
      const existingGuest = duplicates[dupIndex].existing[0];
      if (decision === 'keep') {
        toAdd.push(row);
        keptDuplicates += 1;
      } else if (decision === 'update' && existingGuest) {
        updates.push({ id: existingGuest.id, payload: row });
      } else {
        skippedDuplicates += 1;
      }
    });

    onApply({ toAdd, updates, keptDuplicates, skippedDuplicates, fileName });
    close();
  };

  const previewStats = {
    found: rows.length + errors.length,
    valid: rows.length,
    duplicates: duplicates.length,
    errors: errors.length,
    newGuests: rows.length - duplicates.length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 no-print">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-xl font-semibold">Import Excel</h3>

        {!rows.length && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">Selectează fișierul (.xlsx, .xls, .csv) pentru preview înainte de import.</p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => handleFile(event.target.files?.[0])} className="block w-full text-sm" />
          </div>
        )}

        {rows.length > 0 && !hasDuplicateStep && (
          <div className="mt-4 space-y-3 text-sm">
            <p className="rounded-xl bg-slate-50 p-3">Fișier: <span className="font-medium">{fileName}</span></p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <p className="rounded-lg bg-slate-50 p-2">Găsiți: <strong>{previewStats.found}</strong></p>
              <p className="rounded-lg bg-emerald-50 p-2">Noi: <strong>{previewStats.newGuests}</strong></p>
              <p className="rounded-lg bg-amber-50 p-2">Duplicate: <strong>{previewStats.duplicates}</strong></p>
              <p className="rounded-lg bg-rose-50 p-2">Erori: <strong>{previewStats.errors}</strong></p>
              <p className="rounded-lg bg-slate-50 p-2">Valide: <strong>{previewStats.valid}</strong></p>
            </div>
            {errors.length > 0 && (
              <div className="max-h-24 overflow-auto rounded-xl border border-rose-200 p-2 text-rose-700">
                {errors.map((err) => <p key={err.row}>Rând {err.row}: {err.reason}</p>)}
              </div>
            )}
          </div>
        )}

        {hasDuplicateStep && duplicate && (
          <div className="mt-4 space-y-3 text-sm">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900">Nume duplicat găsit ({currentDuplicate + 1}/{duplicates.length})</p>
            <p>Există deja un invitat cu numele <strong>{duplicate.incoming.name}</strong>.</p>
            {duplicate.existing.map((person) => (
              <div key={person.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold">Existent</p>
                <p>Nume: {person.name}</p>
                <p>Grup: {person.group}</p>
                <p>Meniu: {person.menu}</p>
                <p>Status: {person.status}</p>
                <p>{person.tableId ? `Invitatul existent este deja așezat la Masa ${event.tables.find((table) => table.id === person.tableId)?.number}.` : 'Invitatul existent este în lista de invitați neașezați.'}</p>
              </div>
            ))}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <p className="font-semibold">Nou din Excel</p>
              <p>Nume: {duplicate.incoming.name}</p>
              <p>Grup: {duplicate.incoming.group}</p>
              <p>Meniu: {duplicate.incoming.menu}</p>
              <p>Status: {duplicate.incoming.status}</p>
              <p>Note: {duplicate.incoming.notes || '-'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setDecisions((prev) => ({ ...prev, [currentDuplicate]: 'keep' })); setCurrentDuplicate((prev) => prev + 1); }} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Păstrează ambele persoane</button>
              <button onClick={() => { setDecisions((prev) => ({ ...prev, [currentDuplicate]: 'skip' })); setCurrentDuplicate((prev) => prev + 1); }} className="rounded-xl border border-slate-300 px-3 py-2">Nu importa persoana nouă</button>
              <button onClick={() => { setDecisions((prev) => ({ ...prev, [currentDuplicate]: 'update' })); setCurrentDuplicate((prev) => prev + 1); }} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">Actualizează existent</button>
              <button onClick={close} className="rounded-xl border border-rose-300 px-3 py-2 text-rose-700">Anulează importul</button>
            </div>
            <div className="flex flex-wrap gap-2 border-t pt-2">
              <button onClick={() => { const merged = {}; duplicates.forEach((_, idx) => { merged[idx] = 'keep'; }); setDecisions(merged); setCurrentDuplicate(duplicates.length); }} className="rounded-lg bg-indigo-100 px-2 py-1">Păstrează toate duplicatele</button>
              <button onClick={() => { const merged = {}; duplicates.forEach((_, idx) => { merged[idx] = 'skip'; }); setDecisions(merged); setCurrentDuplicate(duplicates.length); }} className="rounded-lg bg-slate-100 px-2 py-1">Sari peste toate duplicatele</button>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={close} className="rounded-xl border border-slate-300 px-3 py-2">Închide</button>
          {rows.length > 0 && !hasDuplicateStep && (!duplicates.length || !reviewMode) && (
            <button onClick={duplicates.length ? () => { setReviewMode(true); setCurrentDuplicate(0); } : applyImport} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">
              {duplicates.length ? 'Rezolvă duplicate și importă' : 'Importă invitații'}
            </button>
          )}
          {rows.length > 0 && duplicates.length > 0 && !hasDuplicateStep && currentDuplicate >= duplicates.length && (
            <button onClick={applyImport} className="rounded-xl bg-emerald-600 px-3 py-2 text-white">Confirmă importul</button>
          )}
        </div>
      </div>
    </div>
  );
}
