const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const apiFetch = async (url, token, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    const err = new Error('Unauthorized');
    err.code = 401;
    throw err;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
};

export const getEvent = (token) => apiFetch('/api/event', token);

export const saveEvent = (token, event) => apiFetch('/api/event', token, {
  method: 'POST',
  headers: jsonHeaders(token),
  body: JSON.stringify({ name: event.name, tables: event.tables, guests: event.guests }),
});

export const resetEvent = (token) => apiFetch('/api/event/reset', token, {
  method: 'POST',
  headers: jsonHeaders(token),
  body: JSON.stringify({ confirm: true }),
});

export const listBackups = (token) => apiFetch('/api/backups', token);

export const createBackup = (token) => apiFetch('/api/backups/create', token, {
  method: 'POST',
  headers: jsonHeaders(token),
});

export const restoreBackup = (token, backupId) => apiFetch(`/api/backups/restore/${backupId}`, token, {
  method: 'POST',
  headers: jsonHeaders(token),
});

export const downloadBackup = async (token, backupId) => {
  const response = await fetch(`/api/backups/download/${backupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Download backup eșuat.');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupId;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
