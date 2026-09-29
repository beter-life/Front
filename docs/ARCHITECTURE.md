# Frontend foundation and identity

Browser → Supabase Auth (session and identity); browser → Fastify `/api/v1/me` (application profile); Fastify → PostgreSQL. Front never queries database tables directly.

- `app`: constructs one Auth controller, API client and QueryClient per application; provides them to React.
- `auth`: official Supabase SDK adapter, bounded requests, PKCE callbacks, session store and public forms. SDK subscriptions are synchronous and cleaned up. Initial session results cannot overwrite a later Auth event. Callback exchange is initialized once, including React StrictMode remounts.
- `routing` / `layouts`: loading is distinct from signed-out state. Recovery sessions stay in the recovery flow. Public and authenticated layouts share accessible primitives.
- `api` / `profile`: current Bearer token in memory, safe errors and Zod response validation matching the backend's camelCase contract. A 401 invalidates only the session that issued that request. Private cache clears on identity changes/logout; a late profile mutation cannot restore another session's data.
- `components/ui`: locally owned shadcn/ui-style Button (Radix Slot + CVA), Input, Label and Card, manually integrated following the official installation pattern. `components.json`, aliases and Tailwind tokens support further shadcn additions. Only needed primitives exist.

Forms use React Hook Form and Zod. Input errors are linked by `aria-describedby`; loading, failure and success use live semantics. The layout supports 320px upwards, visible keyboard focus and reduced motion. Warm neutral surfaces, evergreen accents and restrained editorial headings establish the initial visual language.

Supabase controls token storage/refresh; there is no application-managed JWT persistence. Profile fields never include an owner. Metadata is not authorization. Provider messages, JWTs and passwords are never logged. Browser configuration accepts only public key and safe URL origins. App data endpoints are not replaced with browser database access.

Dependencies are pinned in the lockfile. TypeScript 6 is retained for compatibility with typescript-eslint's supported peer range; jsdom 26 supports the project's Node 24 baseline. Official references: [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [shadcn manual installation](https://ui.shadcn.com/docs/installation/manual).

Tests: unit boundaries and session races; React integration with mocked external boundaries; Chromium desktop/mobile using the real browser SDK against intercepted Auth/API responses. Real remote checks and remaining human e-mail actions must be reported separately in PROJECT_STATE. No backend/schema migration or MDL 2 feature is introduced.
