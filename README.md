# Seating Planner

## Rulare locală

### Backend (Node.js + Express + SQLite)
```bash
cd server
cp .env.example .env
# setează ADMIN_TOKEN în .env
npm install
npm run start
```

API rulează implicit pe `http://localhost:3001`.

### Frontend (React + Vite)
```bash
npm install
npm run dev
```

În development, Vite face proxy pentru `/api` către backend (`localhost:3001`).

## Build producție frontend
```bash
npm install
npm run build
```
Artefactele statice sunt în `dist/`.

## Stocare date
- Baza SQLite: `server/data/seating-planner.sqlite`
- Backup-uri JSON: `server/backups/`

## Token / parolă admin
Setează în `server/.env`:
```env
ADMIN_TOKEN=schimba-acest-token
```
Frontend cere tokenul la login și îl trimite ca header:
`Authorization: Bearer <TOKEN>`

## Endpoint-uri API
- `GET /api/event`
- `POST /api/event`
- `POST /api/event/reset`
- `GET /api/backups`
- `POST /api/backups/create`
- `POST /api/backups/restore/:backupId`
- `GET /api/backups/download/:backupId`

## Deploy VPS (Nginx)
1. Rulează backend-ul pe VPS:
   ```bash
   cd /path/to/app/server
   npm install
   npm run start
   ```
2. Build frontend:
   ```bash
   cd /path/to/app
   npm install
   npm run build
   ```
3. Servește `dist/` prin Nginx și adaugă proxy pentru API:

```nginx
server {
    listen 80;
    server_name domeniu.ro;

    root /path/to/app/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
