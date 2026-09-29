# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | BLOCKED_EXTERNAL_EMAIL_CALLBACK |
| SCOPE | Frontend |
| BRANCH | codex/mdl1f-frontend-foundation |
| LAST_TESTED_COMMIT | 606f1b5 — implementation, local and real API gates passed |
| DONE | React/Vite platform, accessible identity flows, protected profile, CI and harness |
| TESTS | Lint, types, unit, integration, build, browser desktop/mobile, secret scan, dependency audit, harness: PASS; real Supabase login, health, profile persistence and ownership: PASS |
| BLOCKERS | Real signup confirmation and recovery callback require a controlled mailbox link opened in the initiating browser |
| NEXT | Validate real signup confirmation and recovery callback in the same browser; then close MDL 1F gate |
