# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | BLOCKED_EXTERNAL_EMAIL_CALLBACK |
| SCOPE | Frontend |
| BRANCH | codex/mdl1f-frontend-foundation |
| LAST_TESTED_COMMIT | a638d03 — automatic PKCE bootstrap and local gates passed |
| DONE | MDL 1F platform and identity; SDK alone exchanges PKCE codes; early Auth events preserved; URL retained until exchange success; loading until initialization and session settle; same-tab recovery survives reload |
| TESTS | Unit 27, integration 18, browser 12 (desktop/mobile), lint, types, build, secret scan, harness: PASS; delayed PKCE success/failure, one exchange, missing verifier and StrictMode covered |
| BLOCKERS | Real recovery callback awaits human test; remote logs alone cannot establish why the previous browser made no token request; HTTPS Git helper unavailable for push |
| NEXT | Await human test at localhost:3101 in the initiating browser; inspect temporary sanitized callback diagnostics, then validate password update/login; remove diagnostics after approval. Do not send email automatically or start MDL 2 |
