# EchoPay - Accessible UPI Prototype

EchoPay is a full-stack accessibility-first UPI demo for blind and low-vision users.

## What was added
- Exactly **two users only** with one login page and separate dashboards:
  - **User A** (`usera / pass@123`)
  - **User B** (`userb / pass@123`)
- After login, each user sees:
  - their own send-money dialog (can send only to the other user)
  - their own payment logs
  - voice playback for selected log entries
- Logout/login switches between user dashboards while preserving logs because logs are stored in transactions service memory.
- Logs auto-sync in active sessions (near real-time polling).

## Architecture
- `backend/` (existing): starter payment API service on port `8080`.
- `services/transactions/` (updated): two-user channel service on port `8081`.
- `frontend/`: React app with one login page and user-specific dashboard.

## Run locally (dev)

### 1) Start transactions microservice
```bash
cd services/transactions
go run .
```
Runs on `http://localhost:8081`.

### 2) Start frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

## Deploy (Docker Compose)
From repository root:

```bash
docker compose up --build -d
```

Services:
- Frontend: `http://localhost:5173`
- Transactions API: `http://localhost:8081`
- Backend API: `http://localhost:8080`

Stop deployment:

```bash
docker compose down
```

## Share publicly for a short time (Cloudflare Tunnel)
If your app is already running with Docker, you can expose it with a temporary public URL.

1) Start EchoPay locally:
```bash
docker compose up --build -d
```

2) Install `cloudflared` on Windows (if `choco` is not installed):

- Option A (preferred):
```powershell
winget install --id Cloudflare.cloudflared
```

- Option B (manual):
  - Download `cloudflared-windows-amd64.exe` from Cloudflare releases.
  - Rename it to `cloudflared.exe` and place it in a folder on your `PATH` (or run it from that folder).

3) Create a public tunnel to frontend:
```powershell
cloudflared tunnel --url http://localhost:5173
```

4) Copy and share the generated `https://...trycloudflare.com` URL.

### Important notes
- Keep Docker containers and the tunnel process running, or the link stops working.
- This is best for demos/short-term sharing.
- For always-on hosting, deploy to a cloud service (for example Render/Fly.io/Railway free tiers, where available).

## Transactions API (two-user channel)
- `GET /api/channels/user-a/transactions`
- `GET /api/channels/user-b/transactions`
- `POST /api/channels/transfer`

Example transfer request:
```json
{
  "fromUser": "user-a",
  "toUser": "user-b",
  "amount": 320.5
}
```
