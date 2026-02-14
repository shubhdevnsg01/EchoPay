# EchoPay - Accessible UPI Prototype

EchoPay is a full-stack accessibility-first UPI demo for blind and low-vision users.

## What was added
- Exactly **two users only** with two separate windows:
  - **User A window**
  - **User B window**
- Transfers are allowed only between these two users via a single channel (`user-a <-> user-b`).
- Each user has a separate transaction log panel, and each can select an item and use voice playback.
- A sticky "Jump to User Logs" button keeps the logs discoverable.

## Architecture
- `backend/` (existing): starter payment API service on port `8080`.
- `services/transactions/` (updated): two-user channel service on port `8081`.
- `frontend/`: React app with two user windows and separate logs.

## Run locally

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
