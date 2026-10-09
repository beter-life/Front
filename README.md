# Beter Life · Front

MDL 1F Auth V2 is preserved. MDL 2 adds Financial Core: accounts, categories, income/expense, atomic transfers, exact balances and basic queries. The user-approved real financial gate confirmed persistence in Supabase. MDL 3 adds monthly budgets; its real gate was approved on 2026-10-02 and MDL 0–10 are integrated into main. MDL 4 Financial Goals adds personal planning goals, declared contributions/withdrawals, progress, monthly requirements and a no-interest completion estimate. Its real gate was approved by the user on 2026-10-02. MDL 5 recurrence planning and MDL 6 Net Worth are COMPLETE after approved human gates; MDL7 Yield Engine is COMPLETE after the user-approved real gate on 2026-10-05; MDL8 Cards is COMPLETE after the user-approved real gate on 2026-10-06; publication/merge readiness is tracked in PROJECT_STATE. React, Vite, strict TypeScript, Tailwind v4, shadcn/ui primitives, React Router, TanStack Query, React Hook Form and Zod.

## Local development

MDL7 adds protected `/finance/yield`: explicit versioned rules, official benchmark
states, estimated gross/net/taxes, history and read-only comparison. Real balances
and net worth are unchanged. [Model and approved human gate](docs/YIELD_ENGINE.md).
REAL_GATE=PASS; MDL7_STATUS=COMPLETE. Its closure PR/merge/main CI passed; MDL8 follows below.

Use Node 24 and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`, create an ignored `.env.local` from `.env.example`, and set only the three public browser values. Use the Supabase **publishable** key (`sb_publishable_…`); this project intentionally rejects secret/service-role keys. Never copy the backend `.env` into Front.

Start the existing backend independently, then run `pnpm dev`. Front uses `http://localhost:3101`; the API example uses `http://localhost:3001`. The backend's CORS allowlist must include the exact frontend origin. Backend database/TLS settings remain backend-only.

For real e-mail flows, the Supabase Auth redirect allowlist must permit:

- `http://localhost:3101/auth/confirm`
- `http://localhost:3101/auth/recovery`

The browser sends these callback URLs explicitly from `window.location.origin`; the Supabase Auth redirect allowlist must include both exact URLs. The validated email templates point directly to these routes with `token_hash={{ .TokenHash }}` and `type=email` for confirmation or `type=recovery` for password recovery. Use `{{ .RedirectTo }}` as the callback base rather than a hard-coded development origin.

Production URLs must use HTTPS. Do not disable e-mail confirmation. Auth V2 is the default in development and production, with one `createClient()` singleton using the documented SDK defaults. One `onAuthStateChange` subscription supplies the initial and subsequent sessions. The SDK owns persistence, refresh and sign-out; the application does not store JWTs separately or manage verifiers.

Confirmation and recovery each call `verifyOtp({ token_hash, type })` once, then remove the callback parameters from the URL. Recovery requires the returned session before `updateUser({ password })`. Signup and recovery requests show neutral messages; HTTP success does not guarantee email delivery. Authentication data and provider errors are never logged. The legacy Auth layer and temporary diagnostics have been removed.

## Routes and contracts

`/login`, `/signup`, `/auth/confirm`, `/forgot-password`, `/auth/recovery`, protected `/app`, `/profile` and `/account/password`. `/app` is a grouped portal of implemented tools and direct creation shortcuts; financial totals remain in `/finance` and its official read models.

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
accessible text/progress/status. The MDL4 human gate is PASS and the module is COMPLETE.
READY_FOR_MDL5=true records prerequisite approval; MDL5 is COMPLETE and integrated into main.

## MDL 5 — Recurrences and Financial Calendar

Protected `/finance/recurrences` adds owned rule forms, filters, pause/resume/archive
and an actual next-30-days subscription radar. `/finance/calendar` shows a monthly
chronological agenda and income/expense/projected net separately by currency.
The Back supplies dates and totals; the client formats exact money and civil dates.
Rules are expectations and never post ledger entries or change budgets/goals.
[Finance requirements](docs/requisitos.md#mdl-5--recurrences-and-calendar) describe
the human gate and [PROJECT_STATE](docs/PROJECT_STATE.md) records verified tests.
MDL5 is COMPLETE; REAL_GATE=PASS; merged to main with the approved MDL0–5 baseline.
MDL6 is COMPLETE and integrated into main. Local Front localhost:3101.

## MDL 6 — Net Worth / Patrimônio

MDL6 COMPLETE, integrado em `main`: patrimônio por moeda,
saldos assinados de contas somente leitura, itens externos, avaliações append-only,
posição histórica e arquivamento terminal. Sem FX, projeções ou alteração do ledger.
O gate humano foi aprovado em 2026-10-05. Regras, API, schema, limites e roteiro estão em
[Net Worth](docs/net-worth.md).

## MDL 8 — Cards, Invoices & Installments

`/finance/cards` and `/finance/cards/:cardId`: cards, invoice history, exact purchase
preview, transfer payments, billing versions and corrective cancellation/archive.
Recognized balance, invoice and future commitments are explicitly separate;
Backend TypeBox generates the Zod contract, no hand-written duplicate DTOs.
No global redesign, PAN/CVV, FX, interest or payment processing.
[Approved real human gate](docs/CARDS_INVOICES.md). MDL8 COMPLETE; MDL9 is COMPLETE with its user-approved real gate PASS; integration gates are recorded in PROJECT_STATE.

## MDL9 — Dívidas e simulador

Rotas protegidas /finance/debts e /finance/debts/:debtId: resumo por moeda, cadastro, pagamentos reais com prévia exata, termos e histórico/correção. Comparação de mínimos/avalanche/snowball usa resultados do Back, sem simulação financeira paralela no cliente. Gate humano aprovado (REAL_GATE=PASS). [Premissas e validação](docs/DEBT_PAYOFF.md).

## MDL10 — Safe to Spend

Estimativa conservadora por moeda, contas explicitamente selecionadas, obrigações e reservas, Budget como teto e receitas previstas em cenário separado. Somente configurações próprias são escritas. Rota protegida /finance/safe-to-spend; gate humano aprovado e MDL0–10 integrados em main. [Fórmula, limites e validação](docs/SAFE_TO_SPEND.md). Sem MDL11.

## UI/UX Foundation V2 — development gate

One typed navigation configuration supplies grouped desktop navigation, an optional icon rail, mobile bottom navigation/full modal menu, page finder, breadcrumbs and Home tools. Ctrl/Cmd+K searches page names/aliases only; editing a field keeps the shortcut inactive. Creation shortcuts open existing forms without submitting them.

Light/Dark/System persist a non-sensitive local preference; the theme initializer runs before first paint. V2.1 uses Crimson Red with deep-red/white primary buttons in both themes, separate semantic status colors and one token source. Five everyday links stay visible; only three secondary groups expand. Safe to Spend settings separate account selection, the safety reserve and planning options. Native modal dialogs preserve focus and existing confirmation conditions. Auth, API contracts, financial calculations and hosted data are unchanged.

The navigation and appearance await the human gate at `http://localhost:3101`. Only a DEV checkpoint is allowed: no final PR/merge and no MDL11. See [audit, decisions and visual evidence](docs/UIUX_FOUNDATION_V2.md).
