# CLAUDE.md — Ground Rules for AI-Assisted Development

> These rules are loaded on every Claude session. Follow them exactly.

`mok` is a Python + React starter for AI-powered applications. It mirrors the
conventions of the [loom](../loom) platform but keeps the surface small: just
auth, a few public pages, and a thin LLM integration via the shared
[llm-client](../llm-client) library.

---

## 1. Development Workflow — Mandatory Steps

### Before Writing Any Code
1. **Create a feature plan document** in `docs/<category>/<feature-name>.md` with:
   - Overview & motivation
   - Design approach
   - Files to create/modify
   - Status tracker table: `| Step | Status | Notes |` with values `pending`, `in-progress`, `done`
2. **Read existing code** before modifying it — never propose changes to code you haven't read.
3. **Check for existing patterns** — search the codebase for similar implementations before inventing new approaches.
4. **Seek human approval** before:
   - Any database schema changes (new tables, column changes, migrations)
   - Major architectural shifts or new design patterns
   - Introducing a new dependency (library, package, service)
   - Destructive operations (deleting data, dropping tables, force-pushing)

### While Writing Code
5. **Write tests alongside implementation** — not after, not "later":
   - Unit tests for individual functions/components
   - Integration tests for API endpoints and service interactions
   - End-to-end tests for user-facing workflows
6. **Update the feature plan** — mark steps as `done` as you complete them.

### After Writing Code
7. **Run the test suite** — verify nothing is broken
8. **Run linters** — `ruff check` (backend), `npx tsc --noEmit` (frontend)
9. **Mark the feature plan as complete** with final status

---

## 2. When In Doubt — Ask, Don't Assume

- If requirements are ambiguous → **ask the human developer**
- If multiple valid approaches exist → **present options and ask**
- If a change could break existing functionality → **confirm before proceeding**
- If you're unsure about business logic → **ask**
- Never guess at database schemas, API contracts, or security rules.

---

## 3. Learn From Feedback

- When the human corrects a mistake, **save the lesson** to memory files so it's never repeated.
- Before implementing, **check memory files** for past decisions and lessons learned.
- If a previous approach failed, **don't retry it** — try something different or ask.

---

## 4. Coding Conventions

### Backend (Python 3.12 + FastAPI)

| Convention | Rule |
|-----------|------|
| **Async-first** | All DB calls, HTTP handlers, and I/O operations are `async def` |
| **Type annotations** | Every function parameter and return type annotated |
| **Pydantic schemas** | All API request/response bodies validated via Pydantic models |
| **Dependency injection** | Use FastAPI `Depends()` for auth, DB sessions |
| **Error handling** | Raise `HTTPException(status_code, detail=...)` — never return raw error dicts |
| **Docstrings** | Module-level for every file; function-level for non-trivial functions |
| **Private helpers** | Prefix with `_` (e.g., `_hash_password()`) |
| **Constants** | `SCREAMING_SNAKE_CASE` |
| **Imports** | Grouped: stdlib → third-party → local app. Sorted by isort |
| **Line length** | 100 characters (ruff enforced) |
| **Linter** | ruff with rules: E, W, F, I, N, UP, B, SIM. B008 suppressed in `app/api/*.py` |

### Frontend (React 19 + TypeScript)

| Convention | Rule |
|-----------|------|
| **Component files** | PascalCase (e.g., `Home.tsx`) |
| **Hooks** | `use` prefix, camelCase (e.g., `useAuth.ts`) |
| **Type definitions** | `interface` for object shapes; strict typing on all props and returns |
| **Server state** | React Query (`@tanstack/react-query`) with `queryKey` arrays |
| **Local state** | `useState` for UI state (forms, modals, toggles) |
| **Global state** | Context providers (Auth) — no Redux |
| **API client** | All fetch calls in `src/api/client.ts` with `authHeaders()` helper |
| **CSS** | CSS variables (`var(--bg)`, `var(--accent)`) — never hardcode colors |
| **CSS naming** | kebab-case, component-scoped (e.g., `.login-card`) |
| **Imports** | React first → libs → local components → styles |

### Database (PostgreSQL 16 + SQLAlchemy 2.0)

| Convention | Rule |
|-----------|------|
| **Primary keys** | ULID (26-char sortable string) via `generate_ulid()` |
| **Timestamps** | `created_at`, `updated_at` with server defaults (TimestampMixin) |
| **Table names** | Plural snake_case (e.g., `users`) |
| **Column style** | `Mapped[type]` with `mapped_column()` (SQLAlchemy 2.0 declarative) |
| **Enums** | `enum.StrEnum` with `SAEnum(native_enum=False)` |
| **Flexible data** | `JSONB` for config, metadata |
| **Indexes** | On foreign keys, frequently queried columns (e.g., `email`, `tenant_id`) |
| **Migrations** | Alembic — always generate, review, and test both upgrade and downgrade |
| **Human approval** | **Always confirm with the human before creating or modifying tables** |

### Naming Conventions

| Entity | Style | Example |
|--------|-------|---------|
| Python files | snake_case | `auth.py`, `email_service.py` |
| Python classes | PascalCase | `User`, `AuthResponse` |
| Python functions | snake_case | `get_user`, `create_user` |
| Python constants | SCREAMING_SNAKE | `MAX_ATTEMPTS`, `DEFAULT_MODEL` |
| API endpoints | snake_case plural | `/users`, `/sessions` |
| Enums | StrEnum + PascalCase | `UserRole.ADMIN` |
| React components | PascalCase | `Home`, `AppShell` |
| React hooks | camelCase + use | `useAuth` |
| CSS classes | kebab-case | `login-card`, `nav-link` |
| DB tables | plural snake_case | `users`, `sessions` |

---

## 5. Architecture Principles

### Security
- **Never hardcode secrets** — use environment variables with the `MOK_` prefix.
- **bcrypt for passwords** with salt (14 rounds).
- **JWT auth** with HS256 — short-lived access tokens.
- **Validate at system boundaries** — user input, external APIs, file uploads.
- **No email enumeration** — `/forgot-password` always returns 200 regardless of whether the email exists.
- Guard against OWASP Top 10: injection, XSS, CSRF, broken auth, etc.

### Scalability & Reliability
- **Async I/O** — never block the event loop with synchronous calls.
- **Connection pooling** — use SQLAlchemy async engine pools.
- **Structured logging** with `structlog` — include `request_id` context.
- **Graceful error handling** — catch, log, and return meaningful errors.

### Maintainability
- **Modular code** — each file/module has a single, clear responsibility.
- **Clear interfaces** — typed function signatures, Pydantic schemas, TypeScript interfaces.
- **No premature abstraction** — three similar lines is better than a premature helper.
- **No over-engineering** — solve the current problem, not hypothetical future ones.
- **Delete unused code** — no commented-out blocks, no backwards-compat shims.

### Multi-tenancy (future-ready)
- Every domain resource carries a `tenant_id` column (defaulting to `"default"`).
- Cross-tenant features are out of scope for v0 but the column exists so the
  schema doesn't need to change later. When you add new tables, include
  `tenant_id` and an index on it.

---

## 6. Testing Standards

### Backend Tests (`backend/tests/`)

```python
# File naming: test_<feature>.py
# Async: @pytest.mark.asyncio + async def test_*
# Client: AsyncClient with ASGITransport(app=app)
# Fixtures: conftest.py with session-scoped setup

@pytest.mark.asyncio
async def test_register_creates_user():
    """POST /auth/register with valid data returns 201."""
    async with AsyncClient(...) as client:
        resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
```

### Frontend Tests (`frontend/src/`)
- Vitest for unit/component tests
- Playwright for end-to-end tests (optional)
- Test files co-located or in `__tests__/` directories

### What to Test
- **Every API endpoint**: happy path + validation errors + auth failures + edge cases
- **Every business logic function**: pure functions, service methods, utility helpers
- **Every React component**: rendering, user interactions, state changes

---

## 7. Configuration & Environment

| Setting | Value |
|---------|-------|
| **Env prefix** | `MOK_` (Pydantic Settings) |
| **Python pkg manager** | `uv` |
| **Node pkg manager** | `npm` |
| **Python version** | 3.12 |
| **Node version** | 22+ |
| **Database** | PostgreSQL 16 (Homebrew or Docker) |
| **Backend server** | `uvicorn app.main:app --reload` (port 8000) |
| **Frontend dev** | `npm run dev` (port 3000, proxies to :8000) |
| **Linter** | ruff (backend), tsc --noEmit (frontend) |
| **Test runner** | pytest-asyncio (backend), Vitest (frontend) |

---

## 8. Quality Bar — Enterprise Grade

Every piece of code must be:

- **Scalable** — handles growth in data, users, and concurrent requests
- **Secure** — follows security best practices; no vulnerabilities shipped
- **Configurable** — behavior controlled via settings, not hardcoded values
- **Maintainable** — readable by any developer; clear naming, structure, and docs
- **Reliable** — handles errors gracefully; includes retries and fallbacks where appropriate
- **Testable** — designed for easy unit, integration, and e2e testing
- **Observable** — structured logging, metrics, and tracing for production debugging

---

## 9. Operate as a Top-Tier Expert

In every interaction, operate as a senior-staff-level expert across:

- **Business analysis** — understand the "why" behind requirements
- **System architecture** — design for scale, security, and maintainability
- **Software design** — apply established patterns (SOLID, DRY, separation of concerns)
- **Implementation** — write clean, efficient, idiomatic code
- **Testing** — comprehensive test plans covering happy paths, edge cases, and failure modes
- **Code review** — catch bugs, security issues, and design problems
- **Deployment** — consider CI/CD, migrations, rollback, and observability
- **Maintenance** — write code that's easy to debug, extend, and refactor

Follow best practices and established design patterns. Build software that a
Fortune 500 IT services company would trust to run their operations.

---

## 10. Sibling Projects

| Repo | What it provides |
|------|------------------|
| [loom](../loom) | Reference for full enterprise tech stack, CI patterns, deeper architecture |
| [llm-client](../llm-client) | Unified LLM provider abstraction (Anthropic, OpenAI, Gemini, Ollama) — consumed as a dependency |
