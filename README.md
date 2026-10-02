# Beter Life · Front

MDL 1F Auth V2 is preserved. MDL 2 adds Financial Core: accounts, categories, income/expense, atomic transfers, exact balances and basic queries. The user-approved real financial gate confirmed persistence in Supabase. MDL 3 adds monthly budgets; its real gate was approved on 2026-10-02 and MDL 0–3 are integrated into main. MDL 4 Financial Goals adds personal planning goals, declared contributions/withdrawals, progress, monthly requirements and a no-interest completion estimate on `codex/mdl4-financial-goals`. Its real gate is pending; MDL5+ is not implemented. React, Vite, strict TypeScript, Tailwind v4, shadcn/ui primitives, React Router, TanStack Query, React Hook Form and Zod.

## Local development

Use Node 24 and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`, create an ignored `.env.local` from `.env.example`, and set only the three public browser values. Use the Supabase **publishable** key (`sb_publishable_…`); this project intentionally rejects secret/service-role keys. Never copy the backend `.env` into Front.

Start the existing backend independently, then run `pnpm dev`. Front uses `http://localhost:3101`; the API example uses `http://localhost:3001`. The backend's CORS allowlist must include the exact frontend origin. Backend database/TLS settings remain backend-only.

For real e-mail flows, the Supabase Auth redirect allowlist must permit:

- `http://localhost:3101/auth/confirm`
- `http://localhost:3101/auth/recovery`

The browser sends these callback URLs explicitly from `window.location.origin`; the Supabase Auth redirect allowlist must include both exact URLs. The validated email templates point directly to these routes with `token_hash={{ .TokenHash }}` and `type=email` for confirmation or `type=recovery` for password recovery. Use `{{ .RedirectTo }}` as the callback base rather than a hard-coded development origin.

Production URLs must use HTTPS. Do not disable e-mail confirmation. Auth V2 is the default in development and production, with one `createClient()` singleton using the documented SDK defaults. One `onAuthStateChange` subscription supplies the initial and subsequent sessions. The SDK owns persistence, refresh and sign-out; the application does not store JWTs separately or manage verifiers.

Confirmation and recovery each call `verifyOtp({ token_hash, type })` once, then remove the callback parameters from the URL. Recovery requires the returned session before `updateUser({ password })`. Signup and recovery requests show neutral messages; HTTP success does not guarantee email delivery. Authentication data and provider errors are never logged. The legacy Auth layer and temporary diagnostics have been removed.

## Routes and contracts

`/login`, `/signup`, `/auth/confirm`, `/forgot-password`, `/auth/recovery`, protected `/app`, `/profile` and `/account/password`. `/app` is an identity landing page, not a financial dashboard.

Finance uses protected `/finance`, `/finance/accounts`, `/finance/categories`, `/finance/transactions` and `/finance/budgets`. Budgets accept explicit `month=YYYY-MM&currency=BRL` navigation and use the profile timezone for the current month. See [Finance architecture](docs/arquitetura.md), [requirements](docs/requisitos.md), [money/date rules](docs/regras-negocio.md) and [data boundary](docs/banco-de-dados.md). Its generated contracts are pinned in `src/features/finance/contracts.generated.ts`; build/runtime do not require the Back checkout. Never pass ownership IDs from the client.

The Supabase browser SDK owns session persistence and refresh. Application profile data goes through Fastify: `GET /api/v1/me` and `PUT /api/v1/me/profile`. The exact profile payload is `{ displayName, locale, timezone }`; no ownership identifier is sent. There is no `GET /api/v1/me/profile`: the profile is included in `/me`. Authenticated password changes use Supabase `updateUser`, preserve the current session and expose only safe feedback. See [architecture](docs/ARCHITECTURE.md).

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, `pnpm security:scan` and `pnpm harness`. For browser tests, run `pnpm exec playwright install chromium` once, then `pnpm test:e2e`. CI runs the same checks. Browser tests use the actual Supabase SDK with mocked network boundaries; they do not prove remote e-mail delivery.

Use the existing compact runner for verbose commands: `node .codex/scripts/compact-command.mjs -- <executable> [args]`. On Windows, invoke the pnpm JavaScript entry point through Node when the only pnpm executable is a `.cmd` shim. Logs, screenshots and reports are ignored.

Before an eventual deployment, configure SPA fallback to `index.html`, HTTPS, a restrictive CSP permitting only the chosen Supabase/API origins, and request-log filtering for Auth callback parameters. No deploy is part of this module.

The real login, signup/confirmation and recovery gates were approved manually by the user. Automated browser tests use the real SDK against intercepted external responses, including session reload, logout, profile writes and login with the updated password. The current checkpoint is in [PROJECT_STATE](docs/PROJECT_STATE.md).

Goals use protected `/finance/goals` and `/finance/goals/:goalId`. Their events
are planning declarations: they do not move account balances, create transactions
or transfers, or alter budgets. Currency is fixed per goal; totals are grouped
by currency. Paused/archived goals keep history and reject new events. A failed
response can be retried with the same event idempotency key and normalized content.
The Back supplies all projections; the client only formats exact money and renders
accessible text/progress/status. The MDL4 branch remains AWAITING_REAL_GATE and
READY_FOR_MDL5=false; no MDL4 merge before the user's manual approval.
