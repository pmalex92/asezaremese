export const normalizeName = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

export const buildGuestIndex = (guests) => {
  const index = new Map();
  guests.forEach((guest) => {
    const key = normalizeName(guest.name);
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(guest);
  });
  return index;
};
