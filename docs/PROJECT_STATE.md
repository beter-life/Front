# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | BLOCKED_EXTERNAL_EMAIL_CALLBACK |
| SCOPE | Frontend |
| BRANCH | codex/mdl1f-frontend-foundation |
| LAST_TESTED_COMMIT | b10164d — explicit persistent PKCE storage and manual callback; local gates passed |
| DONE | One Auth singleton; explicit SDK-compatible localStorage namespace; detectSessionInUrl=false; cached manual exchange; URL retained until confirmed session; recovery accepted without event dependency; app logout blocked while pending; sanitized verifier-presence/removal diagnostics |
| TESTS | Unit 34, integration 18, browser 14 desktop/mobile, lint, types, build, secret scan, harness: PASS. Real SDK/localStorage with mocked Auth transport proves request/callback persistence, exchange 1x, StrictMode and SDK invalid-session cleanup diagnosis |
| BLOCKERS | Historical verifier loss/remover not established. Live request/callback storage evidence remains unverified: no new email authorized and originating in-app storage inaccessible to available tools. HTTPS Git helper unavailable for push |
| NEXT | Await authorization for one human recovery test at localhost:3101 in the same browser context; inspect sanitized request/callback booleans before validating password update/login. Remove diagnostics after approval. No automatic email or MDL 2 |
