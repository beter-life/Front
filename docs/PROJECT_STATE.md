# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL12 — Financial File Import (CSV, OFX, PDF) |
| MDL12_STATUS | AWAITING_REAL_GATE |
| STATUS | AWAITING_REAL_GATE |
| REAL_GATE | PENDING |
| READY_FOR_MDL13 | false |
| MDL11_MAIN_BACK | 0b039738287b10c94ac3ae1074bbb495852f81bc; PR10 merged; [exact main CI PASS](https://github.com/beter-life/Back/actions/runs/38888458337) |
| MDL11_MAIN_FRONT | ce0d7322a36e45240fb4e726bf1fef43ea47fd7c; PR12 merged; [exact main CI PASS](https://github.com/beter-life/Front/actions/runs/38896972365) |
| SYNC | Both local mains fast-forwarded cleanly to published MDL11; ignored env preserved byte-for-byte |
| BRANCH | codex/mdl12-financial-file-import |
| LAST_TESTED_COMMIT | 90a051fea822a23f65e9a6dd853a77a492fae682;261 unit/integration and206 browser PASS+4 existing skips; later closure edits are documentation only |
| IMPLEMENTATION | Protected /finance/inbox/import; bounded upload, explicit account/date/number/column mapping, responsive preview table, valid-row selection/duplicate acknowledgement, pending-only Inbox result links, reload/history and expiration |
| INBOX | Existing manual/review/edit/confirm/discard flows preserved; source badges include CSV/OFX/PDF; validated ?candidate=UUID opens the same proposal across reload. Import has no financial-confirmation shortcut |
| CONTRACT | Official Back TypeBox/OpenAPI-generated Zod; both Back and Front drift checks PASS; backend owns normalization, duplicate detection, eligibility, ownership and financial posting |
| LOCAL_GATES | lint/typecheck/261 unit+integration/build/secret scan/harness PASS;206 Playwright desktop/mobile PASS,4 previous skips; all MDL0–MDL11 tests retained |
| BROWSER | CSV upload/mapping/selection, double-click guard, retry identity, duplicates/invalid rows, native OFX/PDF mapping, pending links/reload, expiry, size limit, Auth/session, six widths Light/Dark/System and keyboard PASS; approved scrollbar regressions retained |
| REGRESSION_NOTE | Initial concurrent full Vitest run exceeded existing lazy-calendar10s wait. Complete suite maxWorkers1 PASS without changing calendar/timeouts/assertions. New integration9/9, unit3/3 and browser12/12 PASS |
| FINANCIAL_ISOLATION | Import creates PENDING proposals only. Existing MDL11 confirmation is a separate explicit step; real Back PostgreSQL snapshots and single-posting tests PASS |
| ACCOUNTS | Real card/debt accountId relations; linked/inactive/ineligible account options disabled. Mapping blocks on unknown link state with retry; definitive checks remain in Back |
| PERFORMANCE | Page50 rows, no automatic selection; main JS gzip273.90KiB; pre-existing chunk>500KiB warning retained. Back predeclared1000-row/50-preview/100-selection bounds PASS; no hosted-load certification |
| SECURITY | Owner-private query cache cleared on logout; no owner payload, stored original file, sensitive logs, real fixtures, external AI/OCR or new Front dependencies |
| MIGRATION_LOCAL | Back0013 validated in disposable PostgreSQL17 with196 integration tests;291 Back unit PASS; historical0001–0012 SQL preserved |
| MIGRATION_DEV | NOT_APPLIED — separate authorization required. No hosted reads/writes, Auth/TLS/certificate/env changes or real financial fixtures for MDL12 |
| CI_BACK_SOURCE | [9fc5c40 CI PASS](https://github.com/beter-life/Back/actions/runs/38912900463); Back documentary HEAD is separately verified in the delivery report |
| CI_FRONT | [Actions for branch](https://github.com/beter-life/Front/actions?query=branch%3Acodex%2Fmdl12-financial-file-import); exact published HEAD must pass before delivery; final run/hash recorded in the delivery report |
| CHECKPOINT_DEV | checkpoint/mdl12-financial-file-import-dev-2026-10-16 after local gates; no COMPLETE tag; existing MDL11 DEV checkpoint preserved |
| PUBLICATION | Separate Back/Front commits and branch pushes authorized; no force push, PR, MDL12 merge or MDL13 |
| HUMAN_GATE | [Roteiro, supported layouts, synthetic CSV/OFX/PDF and limitations](./FINANCIAL_FILE_IMPORT.md) |
| BLOCKERS | Supabase DEV0013 is explicitly not authorized; separate authorization/backup/TLS checks precede the real hosted gate |
| NEXT | Await separate authorization for0013 and human validation using the synthetic gate examples. Do not merge MDL12 or start MDL13 |
