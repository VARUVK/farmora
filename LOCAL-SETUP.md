# FARMORA — Local-Only Setup (Windows)

This project runs **locally on Windows** with **no paid services, no cloud DB, and no Replit**.

---

## Files Modified

| File | Change |
|------|--------|
| `shared/schema.ts` | Converted all `pgTable` → `sqliteTable`; PG types → SQLite (integer, text, real, json); relations unchanged |
| `shared/models/auth.ts` | `pgTable` → `sqliteTable`; varchar/text, timestamp → integer (mode: timestamp); UUID default → `$defaultFn(() => crypto.randomUUID())` |
| `shared/models/chat.ts` | `pgTable` → `sqliteTable`; serial → integer primaryKey autoIncrement; timestamp defaults |
| `drizzle.config.ts` | `schema`: `./server/db/schema.ts` → `./shared/schema.ts`; added `import "dotenv/config"`; `dbCredentials.url` default `file:./local.db` |
| `server/db.ts` | Replaced `drizzle-orm/node-postgres` + `pg` with `better-sqlite3` + `drizzle-orm/better-sqlite3`; DB path from `DATABASE_URL` or `./local.db` |
| `server/index.ts` | Added `import "dotenv/config"`; listen options: `reusePort` only on non-Windows |
| `server/storage.ts` | `getMarketPrices` fixed: optional filters with `and()`; correct Drizzle query chain |
| `server/replit_integrations/auth/sessionStore.ts` | **New**: SQLite session store for express-session (sessions table) |
| `server/replit_integrations/auth/replitAuth.ts` | Replaced Replit OIDC with local demo auth: SQLite session store; GET `/api/login` creates/gets demo user and logs in; GET `/api/logout` redirects to `/`; `isAuthenticated` checks session only |
| `server/replit_integrations/auth/storage.ts` | `upsertUser`: use select-after-insert for SQLite (no reliance on `.returning()` after conflict) |
| `server/replit_integrations/chat/storage.ts` | `orderBy(desc(messages.createdAt))` for messages |
| `server/replit_integrations/chat/routes.ts` | OpenAI client lazy: `getOpenAI()` only when API key set; when no key, advisory returns deterministic/demo message so app runs offline |
| `package.json` | `dev`: `cross-env NODE_ENV=development tsx server/index.ts`; `start`: `cross-env NODE_ENV=production ...`; added `cross-env`, `dotenv` (devDependencies) |
| `client/src/lib/queryClient.ts` | Added `getApiBase()` / `resolveUrl(path)` using `VITE_API_URL` (default same-origin); all API requests use `resolveUrl()` |
| `client/src/hooks/use-auth.ts` | Use `resolveUrl("/api/auth/user")` and `resolveUrl("/api/logout")` |
| `client/src/hooks/use-farm-data.ts` | Use `resolveUrl()` for profile and market prices fetch |

**Removed**

- `.replit` — Replit config
- `replit.md` — Replit docs
- `venv/` — Unused Python virtual environment

---

## Exact Commands

### Backend

```powershell
cd e:\Projects\FARMORA
npm run dev
```

Or run the server directly:

```powershell
cd e:\Projects\FARMORA
npx tsx server/index.ts
```

Backend serves both API and Vite dev server on **port 5000** (or `%PORT%` if set).

### Frontend (same process as backend)

With `npm run dev`, the **frontend is served by the same process** (Vite middleware). Open:

**http://localhost:5000**

To run a separate Vite dev server (e.g. for frontend-only work), you would need to point the client at the API with `VITE_API_URL=http://localhost:5000` and run Vite from `client/` — the default setup is single-command `npm run dev` for full-stack.

### Database (one-time or after schema change)

```powershell
cd e:\Projects\FARMORA
npx drizzle-kit push
```

Creates/updates `local.db` in the project root using `DATABASE_URL` from `.env` (default `file:./local.db`).

---

## Environment

- **`.env`** (required for DB and optional for session):
  - `DATABASE_URL=file:./local.db` — SQLite path (defaults to `./local.db` if unset in code).
  - `SESSION_SECRET` — optional; default used for local dev.
  - `OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY` — **optional**; if set, Advisory chat uses real AI; if not set, advisory still works with a deterministic/demo response.

---

## Confirmation

- **Local-only**: No Postgres, no Replit, no paid services. SQLite + file-based DB, local demo login, optional OpenAI for chat.
- **Free**: No cloud or paid dependencies required to run the app.
- **Windows**: `npm run dev` uses `cross-env`; `reusePort` is skipped on Windows; PowerShell-safe.

---

## Known Limitations

1. **Advisory (AI) chat**: Without `OPENAI_API_KEY` (or `AI_INTEGRATIONS_OPENAI_API_KEY`), chat returns a deterministic/demo message. Set the key for full AI responses.
2. **Image / Audio integrations**: If you later register image or audio routes and use their clients, they still instantiate OpenAI at module load; they would need the same lazy/no-key handling as chat for fully offline use.
3. **Single demo user**: Local login creates one demo user (`demo@farmora.local`). No sign-up or multi-user local auth.
4. **Session storage**: Sessions live in SQLite; clearing DB or deleting `local.db` logs everyone out.
5. **Frontend API base**: Default is same-origin (empty `VITE_API_URL`). For a separate frontend dev server, set `VITE_API_URL=http://localhost:5000` (or your backend URL).
