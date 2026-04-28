import { buildDemoData } from '../constants/demoData';

const STORAGE_KEY = 'seatingPlannerEventV1';

export const loadEvent = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const demo = buildDemoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    return demo;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const demo = buildDemoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    return demo;
  }
};

export const saveEvent = (event) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
};

export const resetToDemo = () => {
  const demo = buildDemoData();
  saveEvent(demo);
  return demo;
};

export const clearAllData = () => {
  const empty = { name: 'Evenimentul Meu', tables: [], guests: [] };
  saveEvent(empty);
  return empty;
};
