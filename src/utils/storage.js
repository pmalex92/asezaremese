import { buildDemoData } from '../constants/demoData';

const CACHE_KEY = 'seatingPlannerEventCacheV2';
const LEGACY_KEY = 'seatingPlannerEventV1';
const TOKEN_KEY = 'seatingPlannerAdminToken';

export const emptyEvent = () => ({
  name: '',
  tables: [],
  guests: [],
  updatedAt: null,
});

export const normalizeEvent = (event) => ({
  name: typeof event?.name === 'string' ? event.name : '',
  tables: Array.isArray(event?.tables) ? event.tables : [],
  guests: Array.isArray(event?.guests) ? event.guests : [],
  updatedAt: event?.updatedAt ?? null,
});

export const loadCachedEvent = () => {
  const raw = localStorage.getItem(CACHE_KEY) || localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;

  try {
    return normalizeEvent(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const saveCachedEvent = (event) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(normalizeEvent(event)));
};

export const clearCachedEvent = () => {
  localStorage.removeItem(CACHE_KEY);
};

export const resetToDemo = () => {
  const demo = normalizeEvent({ ...buildDemoData(), updatedAt: new Date().toISOString() });
  saveCachedEvent(demo);
  return demo;
};

export const clearAllData = () => {
  const empty = emptyEvent();
  saveCachedEvent(empty);
  return empty;
};

export const loadToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
