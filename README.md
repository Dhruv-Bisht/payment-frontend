# Payment Platform UI

React 18 + TypeScript (strict) + Vite, with TanStack Query and React Router. It talks to the Spring Boot API in the
parent folder.

## Run it

**Everything in Docker** (UI + API + MySQL + Kafka), from the project root:
```bash
docker compose up --build
```
Open **http://localhost:3000**. nginx serves the UI and forwards `/api` to the backend, so no CORS setup is needed.

**Development with hot reload** (the API must already be running on port 3345; Node 20+):
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (Vite proxies /api to :3345)
npm test             # unit tests
npm run typecheck    # TypeScript, no emit
npm run build        # production bundle in dist/
```

## Screens
**Signed out:** `/` home page (guarantees, how a payment travels, live API status), `/register`, `/login`.

**Customer:**

| Route | What it shows |
|---|---|
| `/` Overview | Balance, a step chart of your balance over time, the payment panel, recent activity |
| `/activity`, `/activity/:id` | All payments. Each has a shareable link that opens its **journal entry** (debit and credit legs, with a balanced check) |
| `/ledger` | Your wallet's debit and credit columns |
| `/lab` Reliability lab | Eight live scenarios that prove the guarantees against your own wallet: retries, races, validation, access control |
| `/about` | How a payment works and where each guarantee can be seen |
| `/account` | Profile, role, wallet ID, and a live countdown to session expiry |

**Admin** (ADMIN role only; the server enforces it too):

| Route | What it shows |
|---|---|
| `/admin` | Platform totals, volume by type, and integrity checks: trial balance, wallet reconciliation, conservation of money, pipeline, health |
| `/admin/wallets` | Every wallet's stored vs ledger balance; per-wallet reconciliation; opening-balance backfill |
| `/admin/transactions` | All transactions on the platform, with each journal entry |
| `/admin/pipeline` | Outbox backlog, recent events with payloads, live service metrics |

The complete backend-to-UI mapping is in `../docs/FEATURES.md`.

To try it: register two accounts (one in a private window), add money in the first, copy the second account's wallet
ID, send money, then open the payment in **Activity** to see the journal entry.

## Engineering decisions (good interview material)
- **Safe retries.** Every payment carries an idempotency key (`referenceId`). The key is bound to the exact request,
  kept while the user retries, and replaced after success or when the request changes. Because of that, the UI can
  **automatically retry** network and 502/503/504 failures without any risk of paying twice. Retries are limited to
  those failures (see `isRetrySafe` in `src/lib/client.ts`).
- **Server state with TanStack Query.** Caching, request de-duplication, retry of reads, and invalidation after each
  payment. The balance updates **optimistically** for outgoing money and rolls back on failure; the server stays the
  source of truth (`features/wallet/usePayment.ts`).
- **Confirm step** before money moves, showing the balance after the payment and the reference.
- **Balance trail is derived, not fetched.** It is rebuilt backwards from the current balance, so it is correct even
  when only the latest page of ledger history is loaded (`lib/balanceSeries.ts`, unit tested).
- **Security hygiene.** Token in `sessionStorage` (cleared on tab close), 401 signs out everywhere, the whole query
  cache is cleared on sign out so the next user never sees the previous user's data, admin routes guarded by role.
- **Accessibility.** Skip link, landmarks, labelled form fields with linked error text, `aria-live` toasts, keyboard
  tabs (arrow keys), a native `<dialog>` for the sheet (focus trap, Escape and focus restore from the browser), visible
  focus rings, `prefers-reduced-motion`, light and dark themes.
- **Performance.** Secondary routes are lazy-loaded; no UI library or chart library (the chart is ~40 lines of SVG).
- **Resilience.** An error boundary shows a recovery screen instead of a blank page.
- **Tests and CI.** Vitest unit tests for the validation rules, idempotency keys, balance series, formatting and API
  client; GitHub Actions runs backend tests, type checking, frontend tests and the build.

## Hosting the UI separately (Vercel or Netlify)
1. Deploy the backend first and note its public HTTPS URL.
2. Create the UI project from the `frontend` folder: build command `npm run build`, output directory `dist`
   (`vercel.json` already rewrites all routes to `index.html`).
3. Set `VITE_API_URL=https://<your-backend-url>` (no trailing slash) on the UI host and deploy.
4. On the **backend**, set `CORS_ALLOWED_ORIGINS=https://<your-ui-url>` (exact origin) and redeploy.

A CORS error in the browser console means step 4 is missing, or the origin differs by even one character.
