# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | BLOCKED_EXTERNAL_EMAIL_CALLBACK |
| SCOPE | Frontend |
| BRANCH | codex/mdl1f-frontend-foundation |
| LAST_TESTED_COMMIT | 819cb5f — same-origin local callbacks and gates passed |
| DONE | React/Vite platform, accessible identity flows, protected profile, CI and harness; confirmation/recovery redirects derive from browser origin; recovery sessions survive consumed/missing callback material without re-exchanging the code |
| TESTS | Lint, types, unit, integration, build, browser desktop/mobile, secret scan, harness: PASS; real Supabase login, health, profile persistence and ownership: PASS |
| BLOCKERS | Supabase Auth allowlist and email template are not exposed by the available MCP; Auth Logs show callback fallback to localhost:3000 |
| NEXT | In Supabase Dashboard, verify/add both localhost:3101 callbacks and ensure the recovery template uses ConfirmationURL/RedirectTo; then run one same-browser human recovery test |
