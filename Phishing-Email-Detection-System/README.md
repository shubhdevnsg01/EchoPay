# Phishing Email Detection System

A standalone React + TypeScript project that detects suspicious phishing indicators in email content. It runs fully in the browser and does not depend on any other repository or backend service.

## What It Does

- Accepts sender, subject, and email body input.
- Extracts links from the message body.
- Scores phishing risk from rule-based indicators.
- Detects urgency pressure, credential requests, financial lures, risky attachments, suspicious top-level domains, brand impersonation, and link-domain mismatch.
- Classifies each message as `Safe`, `Suspicious`, or `Phishing`.
- Explains each finding with severity and risk points.
- Provides example emails for quick testing.
- Saves recent scan results in browser state during the session.

## Tech Stack

- React 18
- TypeScript
- Vite
- CSS

## Run Locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5175`.

## Build

```bash
npm run build
```

## Make It a New Repository

Copy this directory outside any existing project, then initialize Git there:

```bash
cp -R Phishing-Email-Detection-System ../Phishing-Email-Detection-System
cd ../Phishing-Email-Detection-System
git init
git add .
git commit -m "Create phishing email detection system"
```
