# EchoPay - Accessible UPI Prototype

EchoPay is a full-stack accessibility-first UPI demo for blind and low-vision users.

## What was added
- A dedicated **Transactions microservice** where users can:
  1. Make a payment (send money)
  2. Receive a payment
  3. Open **My Transactions** and tap any transaction
  4. Press the voice button to hear amount, person name, and time
- A mobile-friendly React UI for smaller screens.

## Architecture
- `backend/` (existing): starter payment API service on port `8080`
- `services/transactions/` (new): transactions microservice on port `8081`
- `frontend/`: React app consuming transactions microservice

## Run locally

### 1) Start transactions microservice
```bash
cd services/transactions
go run .
```
Runs on `http://localhost:8081`.
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
Runs on `http://localhost:5173`.

## Transactions API (microservice)
- `GET /api/transactions`
- `POST /api/transactions/send`
- `POST /api/transactions/receive`

Example request:
```json
{
  "amount": 320.5,
  "counterparty": "Ananya"
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
