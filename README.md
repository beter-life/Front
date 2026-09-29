# Beter Life · Front

MDL 1F: frontend foundation and identity. React, Vite, strict TypeScript, Tailwind v4, shadcn/ui primitives, React Router, TanStack Query, React Hook Form and Zod. No financial domain pages are implemented.

## Local development

Use Node 24 and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`, create an ignored `.env.local` from `.env.example`, and set only the three public browser values. Use the Supabase **publishable** key (`sb_publishable_…`); this project intentionally rejects secret/service-role keys. Never copy the backend `.env` into Front.

Start the existing backend independently, then run `pnpm dev`. Front uses `http://localhost:3000`; the API example uses `http://localhost:3001`. The backend's CORS allowlist must include the exact frontend origin. Backend database/TLS settings remain backend-only.

For real e-mail flows, the Supabase Auth redirect allowlist must permit:

- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/auth/recovery`

Production URLs must use HTTPS. Do not disable e-mail confirmation. Start signup or recovery and open the resulting e-mail link in the **same browser**: PKCE binds it to that browser's verifier. Callback parameters are consumed once and immediately removed from the visible URL. A used, expired, wrong-purpose, unsupported implicit, or missing-verifier link produces a recoverable error. Reloading the password form requires a new recovery link; a normal login session alone never opens that form.

## Routes and contracts

`/login`, `/signup`, `/auth/confirm`, `/forgot-password`, `/auth/recovery`, protected `/app` and `/profile`. `/app` is an identity landing page, not a financial dashboard.

The Supabase browser SDK owns session persistence and refresh. Application profile data goes through Fastify: `GET /api/v1/me` and `PUT /api/v1/me/profile`. The exact profile payload is `{ displayName, locale, timezone }`; no ownership identifier is sent. See [architecture](docs/ARCHITECTURE.md).

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, `pnpm security:scan` and `pnpm harness`. For browser tests, run `pnpm exec playwright install chromium` once, then `pnpm test:e2e`. CI runs the same checks. Browser tests use the actual Supabase SDK with mocked network boundaries; they do not prove remote e-mail delivery.

Use the existing compact runner for verbose commands: `node .codex/scripts/compact-command.mjs -- <executable> [args]`. On Windows, invoke the pnpm JavaScript entry point through Node when the only pnpm executable is a `.cmd` shim. Logs, screenshots and reports are ignored.

Before an eventual deployment, configure SPA fallback to `index.html`, HTTPS, a restrictive CSP permitting only the chosen Supabase/API origins, and request-log filtering for Auth callback parameters. No deploy is part of this module.

The exact validated and pending real gates are in [PROJECT_STATE](docs/PROJECT_STATE.md). A successful password-recovery request proves initiation, not delivery or password change.
