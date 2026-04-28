import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventRoutes from './routes/events.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.warn('ADMIN_TOKEN nu este setat în .env');
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.use('/api', (req, res, next) => {
  if (!ADMIN_TOKEN) return res.status(500).json({ error: 'ADMIN_TOKEN lipsă pe server.' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
});

app.use('/api', eventRoutes);

app.listen(PORT, () => {
  console.log(`Seating Planner API rulează pe portul ${PORT}`);
});
