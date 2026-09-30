# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | BLOCKED_EXTERNAL_RECOVERY_DELIVERY |
| SCOPE | Frontend |
| BRANCH | codex/mdl1f-frontend-foundation |
| LAST_TESTED_COMMIT | a74bb82 — recovery request normalization and neutral delivery messaging; local gates passed |
| DONE | Forgot-password sends the current trimmed/lowercased form value, with sanitized localhost-only metadata. Retry link only navigates. HTTP 200 no longer implies confirmed delivery in the UI. Existing PKCE callback unchanged |
| TESTS | Unit/integration 54, browser 18 desktop/mobile, lint, types, build, secret scan, harness: PASS. Browser Auth transport mocked; no real recovery requested |
| BLOCKERS | Two real /recover 200 responses had no recovery event; remote recovery_sent_at remained 2026-09-30 16:55:42 UTC before and after local tests. Server-side reason unknown; live issuance requires a separately authorized controlled request. Git HTTPS helper unavailable for push |
| NEXT | With authorization, submit one controlled request from localhost:3101/forgot-password using the verified account address; compare Auth audit event and recovery_sent_at before opening any link. Only then resume the recovery gate. Do not change PKCE callback or start MDL 2 |
