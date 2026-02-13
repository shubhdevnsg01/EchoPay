# EchoPay - Accessible UPI Prototype

A starter full-stack UPI-style app focused on accessibility for blind and low-vision users.

## Key feature
- Open any payment and press **Speak payment details**.
- The app reads out: **amount paid**, **person name**, and **payment time** using browser speech synthesis.

## Stack
- **Frontend**: React + TypeScript + Vite (`frontend/`)
- **Backend**: Go (`backend/`)

## Run locally

### 1) Start backend
```bash
cd backend
go run .
```
Backend runs on `http://localhost:8080`.

### 2) Start frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

## API
- `GET /api/payments` → list recent payments
- `POST /api/payments` → create payment

Example request body:
```json
{
  "amount": 320.5,
  "payerName": "Ananya"
}
```
