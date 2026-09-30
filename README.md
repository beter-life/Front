# Beter Life · Front

MDL 1F: frontend foundation and identity. React, Vite, strict TypeScript, Tailwind v4, shadcn/ui primitives, React Router, TanStack Query, React Hook Form and Zod. No financial domain pages are implemented.

## Local development

Use Node 24 and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`, create an ignored `.env.local` from `.env.example`, and set only the three public browser values. Use the Supabase **publishable** key (`sb_publishable_…`); this project intentionally rejects secret/service-role keys. Never copy the backend `.env` into Front.

Start the existing backend independently, then run `pnpm dev`. Front uses `http://localhost:3101`; the API example uses `http://localhost:3001`. The backend's CORS allowlist must include the exact frontend origin. Backend database/TLS settings remain backend-only.

For real e-mail flows, the Supabase Auth redirect allowlist must permit:

- `http://localhost:3101/auth/confirm`
- `http://localhost:3101/auth/recovery`

The browser sends these callback URLs explicitly from `window.location.origin`; the Supabase Auth redirect allowlist must include both exact URLs. Keep the recovery and confirmation email templates based on `{{ .ConfirmationURL }}` (or use `{{ .RedirectTo }}` when constructing a custom callback), never a hard-coded localhost URL or `{{ .SiteURL }}` callback.

Production URLs must use HTTPS. Do not disable e-mail confirmation. Start signup or recovery and open the resulting e-mail link in the **same browser context and origin**: PKCE binds it to that browser's verifier. The runtime owns one official Supabase `AuthClient`, with explicit persistent `window.localStorage` and the stable SDK-compatible `sb-<project-ref>-auth-token` namespace; unavailable storage fails closed. It uses `skipAutoInitialize: true` and `detectSessionInUrl: false`. On a callback with a code, the gateway checks the verifier and makes one manual exchange before calling `initialize()`, `getSession()` or registering an Auth listener. It removes the code only after a session is returned, then initializes and confirms the settled session. On ordinary routes it initializes before session use. A successful recovery exchange establishes recovery context even without PASSWORD_RECOVERY. An established recovery session survives a same-tab reload; a normal login session alone never opens that form. The direct Auth client is needed because `createClient()` in supabase-js 2.117.2 registers an internal session-reading listener even when auto-initialization is skipped.

Recovery requests await initialization before generating a verifier and check persistence after the request. App logout is blocked while a recovery request, exchange or recovery verifier is pending. Legitimate SDK invalid-session cleanup is preserved. During the MDL 1F human gate, localhost development emits temporary `[auth-pkce-request]`, `[auth-callback]` and `[auth-pkce-removal]` diagnostics: origin, stable namespace, verifier/session booleans, exchange stage, and fixed sanitized error name/code/message. No callback codes, verifiers, tokens, credentials or raw provider errors are logged. Diagnostics are disabled in test mode and compiled out of production; remove them after human approval. Browser tests use the real SDK and localStorage with mocked Auth transport, including invalid-session ordering in both directions; live Supabase validation remains separate.

## Routes and contracts

`/login`, `/signup`, `/auth/confirm`, `/forgot-password`, `/auth/recovery`, protected `/app` and `/profile`. `/app` is an identity landing page, not a financial dashboard.

The Supabase browser SDK owns session persistence and refresh. Application profile data goes through Fastify: `GET /api/v1/me` and `PUT /api/v1/me/profile`. The exact profile payload is `{ displayName, locale, timezone }`; no ownership identifier is sent. See [architecture](docs/ARCHITECTURE.md).

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`, `pnpm security:scan` and `pnpm harness`. For browser tests, run `pnpm exec playwright install chromium` once, then `pnpm test:e2e`. CI runs the same checks. Browser tests use the actual Supabase SDK with mocked network boundaries; they do not prove remote e-mail delivery.

Use the existing compact runner for verbose commands: `node .codex/scripts/compact-command.mjs -- <executable> [args]`. On Windows, invoke the pnpm JavaScript entry point through Node when the only pnpm executable is a `.cmd` shim. Logs, screenshots and reports are ignored.

Before an eventual deployment, configure SPA fallback to `index.html`, HTTPS, a restrictive CSP permitting only the chosen Supabase/API origins, and request-log filtering for Auth callback parameters. No deploy is part of this module.

The exact validated and pending real gates are in [PROJECT_STATE](docs/PROJECT_STATE.md). A successful password-recovery request proves initiation, not delivery or password change.
