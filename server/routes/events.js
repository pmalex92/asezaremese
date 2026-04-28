import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { getEvent, normalizeEvent, resetEvent, saveEvent } from '../database.js';

const router = express.Router();

const BACKUPS_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

const sanitizeName = (value) => (value || 'event').toString().trim().toLowerCase().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'event';

const readBackupFile = (filename) => {
  const filePath = path.join(BACKUPS_DIR, filename);
  if (!filePath.startsWith(BACKUPS_DIR)) return null;
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const listBackups = () => fs.readdirSync(BACKUPS_DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => {
    const fullPath = path.join(BACKUPS_DIR, name);
    const stats = fs.statSync(fullPath);
    return { id: name, createdAt: stats.mtime.toISOString(), size: stats.size };
  })
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const createBackup = ({ event, reason, auto = false }) => {
  const eventName = sanitizeName(event.name);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = auto
    ? `backup-${eventName}-latest.json`
    : `manual-backup-${eventName}-${timestamp}.json`;

  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    reason,
    event,
  };

  fs.writeFileSync(path.join(BACKUPS_DIR, fileName), JSON.stringify(payload, null, 2), 'utf-8');

  return fileName;
};

const validateEvent = (event) => {
  if (!event || typeof event !== 'object') return 'Payload invalid.';
  if (typeof event.name !== 'string') return 'name trebuie să fie string.';
  if (!Array.isArray(event.tables)) return 'tables trebuie să fie array.';
  if (!Array.isArray(event.guests)) return 'guests trebuie să fie array.';
  return null;
};

router.get('/event', (_req, res) => {
  const event = getEvent();
  res.json(event);
});

router.post('/event', (req, res) => {
  const error = validateEvent(req.body);
  if (error) return res.status(400).json({ error });

  const saved = saveEvent(normalizeEvent(req.body));
  const backupId = createBackup({ event: saved, reason: 'auto-save', auto: true });

  return res.json({ success: true, updatedAt: saved.updatedAt, backupId });
});

router.post('/event/reset', (req, res) => {
  if (req.body?.confirm !== true) {
    return res.status(400).json({ error: 'Confirmarea este necesară.' });
  }

  const current = getEvent();
  createBackup({ event: current, reason: 'before-reset', auto: false });
  resetEvent();
  return res.json({ success: true });
});

router.get('/backups', (_req, res) => {
  const backups = listBackups();
  res.json({ backups });
});

router.post('/backups/create', (_req, res) => {
  const current = getEvent();
  const backupId = createBackup({ event: current, reason: 'manual-backup', auto: false });
  res.json({ success: true, backupId });
});

router.post('/backups/restore/:backupId', (req, res) => {
  const backup = readBackupFile(req.params.backupId);
  if (!backup?.event) return res.status(404).json({ error: 'Backup inexistent.' });

  const saved = saveEvent(normalizeEvent(backup.event));
  createBackup({ event: saved, reason: `restore-from-${req.params.backupId}`, auto: false });

  return res.json({ success: true, event: saved });
});

router.get('/backups/download/:backupId', (req, res) => {
  const filePath = path.join(BACKUPS_DIR, req.params.backupId);
  if (!filePath.startsWith(BACKUPS_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup inexistent.' });
  }

  return res.download(filePath);
});

export default router;
