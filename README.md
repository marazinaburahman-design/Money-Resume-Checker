# AI Resume Analyzer

An AI-powered resume readiness diagnostic tool tailored for final-year students applying for entry-level software engineering roles (Frontend, Backend, Full-stack, and AI Engineer).

---

## Architecture Overview

- **Frontend**: React 19, Vite, Tailwind CSS v4 running on `http://localhost:5180` (with `strictPort: true`).
- **Backend**: Node.js 20+, Express 5 (ES modules) running on `http://localhost:4000`.
- **Database**: MongoDB Atlas (stores analysis history and token usage metrics).
- **AI Engine**: Groq API (keys strictly managed on the backend via `GROQ_API_KEY`).
- **Development Proxy**: Vite proxies all `/api/*` frontend calls directly to `http://localhost:4000`.

---

## Directory Structure

```text
Resume-Checker/
├── .gitignore               # Ignores node_modules, build outputs, and .env files
├── decisions.md             # Architecture Decision Records (ADRs)
├── README.md                # Project documentation and setup guide
├── client/                  # React 19 + Vite + Tailwind CSS v4 frontend
│   ├── index.html           # HTML entry point
│   ├── package.json         # Client scripts and dependencies
│   ├── vite.config.js       # Vite configuration with port 5180 & /api proxy
│   └── src/
│       ├── App.jsx          # Root component with backend health check test
│       ├── index.css        # Tailwind CSS v4 styling entrypoint
│       └── main.jsx         # React application bootstrap
└── server/                  # Node.js + Express 5 backend
    ├── .env.example         # Environment variable template
    ├── package.json         # Server scripts and dependencies
    └── src/
        └── index.js         # Express 5 server and /api/health endpoint
```

---

## Prerequisites

- **Node.js**: v20.0.0 or higher (v22+ recommended)
- **npm**: v10.0.0 or higher

---

## Installation

### 1. Install Server Dependencies
```bash
cd server
npm install
```

### 2. Configure Backend Environment
Copy the example environment file and fill in your credentials when ready:
```bash
# In the server/ directory
cp .env.example .env
```
> **Security Note**: Never expose `GROQ_API_KEY` to the client or prefix it with `VITE_`. It must remain exclusively in `server/.env`.

### 3. Install Client Dependencies
```bash
cd ../client
npm install
```

---

## Local Development

Run the backend and frontend in two separate terminal windows:

### Terminal 1: Backend Server (Port 4000)
```bash
cd server
npm run dev
```
Starts Express with Node's native file watcher on `http://localhost:4000`.

### Terminal 2: Frontend Client (Port 5180)
```bash
cd client
npm run dev
```
Starts the Vite dev server with strict port binding on `http://localhost:5180`.

---

## Verification & Health Check

1. **Verify Backend Directly**:
   Visit `http://localhost:4000/api/health` in your browser or run:
   ```bash
   curl http://localhost:4000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "message": "AI Resume Analyzer Backend is running",
     "timestamp": "2026-10-18T..."
   }
   ```

2. **Verify Frontend & Proxy**:
   Open `http://localhost:5180` in your browser. The page will automatically query `/api/health` via Vite's proxy and show a green **"Server Connected"** badge.
