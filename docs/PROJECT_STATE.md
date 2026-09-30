# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | BLOCKED_EXTERNAL_EMAIL_CALLBACK |
| SCOPE | Frontend |
| BRANCH | codex/mdl1f-frontend-foundation |
| LAST_TESTED_COMMIT | 22fa244 — recovery callback fix and local gates passed |
| DONE | React/Vite platform, accessible identity flows, protected profile, CI and harness; recovery sessions survive consumed/missing callback material without re-exchanging the code |
| TESTS | Lint, types, unit, integration, build, recovery browser desktop/mobile, secret scan, dependency audit, harness: PASS; real Supabase login, health, profile persistence and ownership: PASS |
| BLOCKERS | Real signup confirmation and recovery callback require a controlled mailbox link opened in the initiating browser |
| NEXT | Human: request one fresh recovery link at localhost:3101, open it once in the same browser, set the new password, then verify normal login; then close MDL 1F gate |
