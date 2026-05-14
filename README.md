# mok

A Python + React starter for AI-powered applications. Adapts the tech stack and
conventions of [loom](../loom) into a smaller, single-purpose base you can fork
to start a new product.

## What's in the box

- **Auth**: registration, login, password forgot / reset, change password, JWT sessions
- **Pages**: Home, About, Contact, Sign in, Sign up, Forgot password, Reset password, Dashboard
- **LLM**: a single `/api/v1/chat` endpoint backed by [`llm-client`](../llm-client)
  (Anthropic, OpenAI, Gemini, Ollama)
- **Infra**: FastAPI + SQLAlchemy 2.0 async + PostgreSQL 16, React 19 + Vite + React Query

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16, bcrypt, PyJWT, structlog
- **Frontend:** React 19, TypeScript, Vite, React Router 7, React Query
- **LLM providers:** Anthropic Claude, OpenAI, Google Gemini, Ollama (via shared `llm-client`)
- **Package managers:** `uv` (Python), `npm` (Node)

## Quick Start

```bash
# 0. Prerequisites
#   - Python 3.12, uv, Node 22+, PostgreSQL 16 running locally

# 1. Database
createuser -s mok && createdb -O mok mok

# 2. Backend (terminal 1)
cd backend
cp .env.example .env       # edit secrets / API keys as needed
uv sync
uv run uvicorn app.main:app --reload

# 3. Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>. On first start an initial admin is seeded
(`admin@mok.dev` plus an auto-generated password printed to the backend log) —
or sign up a fresh user at `/signup`.

## Repository Layout

```
mok/
├── backend/            FastAPI backend
│   ├── app/
│   │   ├── api/        Routers (auth, contact, chat, health)
│   │   ├── models/     SQLAlchemy ORM models
│   │   ├── services/   Business logic (email_service, ...)
│   │   ├── config.py   Pydantic settings (MOK_ prefix)
│   │   ├── database.py Async engine + session factory
│   │   ├── logging.py  Structlog setup
│   │   └── main.py     FastAPI app entry point
│   └── tests/          pytest-asyncio test suite
├── frontend/           React frontend
│   └── src/
│       ├── api/        client.ts — all fetch calls
│       ├── contexts/   AuthContext
│       ├── pages/      Home, About, Contact, Login, Signup, ForgotPassword, ResetPassword, Dashboard
│       ├── components/ AppShell, PrivateRoute
│       └── styles/     variables.css, layout.css, components.css
├── docker-compose.yml  Local Postgres
├── CLAUDE.md           Coding conventions & AI-assisted dev rules
└── README.md
```

## Running Tests

```bash
cd backend && uv run pytest
cd frontend && npm test
cd frontend && npx tsc --noEmit
cd backend && uv run ruff check .
```

## Configuration

Every backend setting is an env var prefixed `MOK_`. See `backend/.env.example`
for the full list. The most important ones:

| Variable | Purpose |
|----------|---------|
| `MOK_DATABASE_URL` | PostgreSQL async DSN |
| `MOK_JWT_SECRET_KEY` | **MUST set in production** — defaults to a sentinel |
| `MOK_INITIAL_ADMIN_EMAIL` / `_PASSWORD` | First-boot seed user |
| `MOK_ANTHROPIC_API_KEY` / `_OPENAI_API_KEY` / `_GEMINI_API_KEY` | LLM provider keys |
| `MOK_SMTP_HOST` / `_PORT` / `_USER` / `_PASSWORD` / `_FROM` | Outgoing mail; omit to log to stdout |
| `MOK_FRONTEND_URL` | Used in email links and CORS in production |

## Contributing

Follow the conventions in [CLAUDE.md](CLAUDE.md):
- Create a feature plan under `docs/<category>/<feature>.md` before writing code
- Read existing code before modifying it
- Write tests alongside implementation
- Seek approval before DB schema changes, new dependencies, or destructive operations
- Run linters and tests before committing
