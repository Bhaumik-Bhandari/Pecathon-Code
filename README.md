# PECathon 2026 — Team Project

> **Status:** Initial setup. The official problem statement and final product scope have not been added yet.

This repository will contain the team's PECathon application. The React frontend lives in `frontend/`; shared project notes and judging documentation belong in `docs/`.

## Tech stack

- React
- Vite
- JavaScript (JSX)
- CSS

Backend, database, APIs, and any additional libraries should be selected after the problem statement is announced. Avoid committing secrets or real sensitive data.

## Run the frontend locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed in the terminal (usually `http://localhost:5173`).

To verify a production build:

```bash
npm run build
```

## Repository map

```text
pecathon-2026-team-name/
├── docs/                 # Problem statement notes, architecture, demo instructions
├── frontend/             # React application
│   ├── public/            # Static assets served as-is
│   ├── src/               # React source and styles
│   ├── index.html         # Vite HTML entry point
│   ├── package.json       # Frontend dependencies and scripts
│   └── vite.config.js     # Vite configuration
├── .gitignore
└── README.md
```

## Team workflow

1. Keep `main` runnable and demo-ready.
2. Use short branches such as `feat/login-screen`, `feat/case-list`, or `fix/api-error` after the problem statement defines the features.
3. Open a pull request for shared changes; at least one teammate should review before merging.
4. Keep setup and demo instructions current in this README.
5. Never commit `.env` files, API keys, passwords, user data, or generated `node_modules/` and `dist/` folders.

## Project details to fill in after the problem statement is released

- **Problem statement:** Pending
- **Solution summary:** Pending
- **Team members:** Pending
- **Demo URL:** Pending
- **How to run the complete application:** Pending
