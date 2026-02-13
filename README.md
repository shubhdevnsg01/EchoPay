# EchoPay - Accessible UPI Prototype

EchoPay is a full-stack accessibility-first UPI demo for blind and low-vision users.

## What was added
- A dedicated **Transactions microservice** where users can:
  1. Make a payment (send money)
  2. Receive a payment
  3. See **My Transactions** directly on homepage (or tap quick jump button) and tap any transaction
  4. Press the voice button to hear amount, person name, and time
- A mobile-friendly React UI for smaller screens.
- If transactions service is down, demo transactions are still shown so the homepage section stays visible.

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
}
```
