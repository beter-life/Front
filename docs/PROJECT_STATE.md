# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | BLOCKED_EXTERNAL_EMAIL_CALLBACK |
| SCOPE | Frontend |
| BRANCH | codex/mdl1f-frontend-foundation |
| LAST_TESTED_COMMIT | 3526333 — recovery exchange precedes session bootstrap; local gates passed |
| DONE | One official AuthClient singleton with skipAutoInitialize=true, explicit localStorage and stable storageKey. Callback exchanges once before initialize, listeners or getSession; returned session activates recovery; sanitized diagnostics show verifier and exchange state. Normal routes initialize explicitly |
| TESTS | Unit 34, integration 18, browser 16 desktop/mobile, lint, types, build, secret scan, harness: PASS. Real SDK with mocked Auth transport reproduces invalid-session verifier loss in old order and successful single POST /token in corrected order |
| BLOCKERS | Live recovery callback not yet retested; new real recovery request is explicitly deferred. Git HTTPS helper unavailable for push |
| NEXT | Human test once authorized at localhost:3101/forgot-password in the same browser context; inspect sanitized request/callback diagnostics, then validate password update and login. Remove temporary diagnostics after approval. No automatic email or MDL 2 |
