# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL12 — Financial File Import (CSV, OFX, PDF) |
| MDL12_STATUS | REAL_GATE_PASS_PENDING_MERGE |
| STATUS | REAL_GATE_PASS_PENDING_MERGE |
| REAL_GATE | PASS |
| MDL12_HUMAN_GATE | PASS |
| MDL12_HUMAN_TESTS | 9/9 |
| READY_FOR_MDL13 | false |
| HUMAN_APPROVAL | User reported PASS for all nine scenarios: CSV/OFX/PDF, normalization, preview, duplicate detection, Inbox, financial isolation and ownership; recorded2026-10-16. No extra hosted fixtures or financial actions by the agent |
| BRANCH | codex/mdl12-financial-file-import |
| BASELINE | Fetched main unchanged at Back0b039738287b10c94ac3ae1074bbb495852f81bc and Frontce0d7322a36e45240fb4e726bf1fef43ea47fd7c; each main is an ancestor of its MDL12 branch; no unexpected divergence |
| MIGRATION_0013_DEV | PASS |
| DRIZZLE_MIGRATIONS | 13/13 |
| DEPLOYMENT_EVIDENCE | Previously authorized deployment of0013 from Backd262b26adc4ce843d09474f0ac67a403d025d3ee, verified2026-10-16. Ledger13/13 and zero pending; expected DDL/RLS/ownership/history guards exact; all25 prior table counts/digests preserved and zero financial changes caused by migration. These are deployment-time observations; no DEV operation repeated during closure |
| PREVIEW_EXPIRATION_EVIDENCE | Automated PostgreSQL test advances the injected clock by86400001ms, observes EXPIRED and parsed=NULL/parsed_bytes=0, retains receipt/candidate identity, and recovers the same batch without duplication. Front integration/Playwright cover expired UI using fixtures. Links and limits in FINANCIAL_FILE_IMPORT.md; no separate24h wall-clock DEV observation claimed |
| RETENTION_LIMIT | Logical expiry at24h; physical parsed-cell cleanup on subsequent owner access/new analysis, without a background cleanup scheduler. Minimal receipts remain; no proof of deletion exactly at the wall-clock deadline |
| BACKUP_RESTORE_TEST | NOT_RUN — authenticated decryption, archive hashes/TOC/full read passed; restoring into a database and validating recovery remains an operational task |
| BACKUP_SCOPE | Application app+Drizzle backup only, AES-256-GCM and Windows DPAPI CurrentUser key, restricted ACL. Supabase-managed Auth/Storage/roles excluded. Preserve ignored Back/.harness/tmp/mdl12-dev-deployment/backup-verified and RECOVERY.md; key recovery needs this Windows profile/machine |
| LEAKED_PASSWORD_PROTECTION | DISABLED_PREEXISTING — prior Supabase advisor finding, recorded during deployment; Auth settings unchanged. Remediation link in FINANCIAL_FILE_IMPORT.md; no new DEV query |
| LIMITATIONS | Documented CSV/OFX variants only; digital PDF layout only, no OCR, no complete bank reconciliation; worker heap limit is not OS RSS isolation. Automated Chromium desktop/mobile emulation and keyboard coverage do not certify all real devices, browsers, screen readers or WCAG conformance |
| PRESERVATION | Finance Core, financial records, Auth V2, RLS, all migrations including deployed0013, Inbox identifiers/sources and Beter Life branding unchanged by closure; env/backup evidence remain ignored |
| LOCAL_GATES | Closure:144 unit/117 integration, lint, typecheck, build, secret scan and harness PASS. Full local Playwright:205 PASS/1 FAIL/4 existing skips; failing desktop outer-panel case PASS in isolated traced run without code changes. Complete suite SUCCESS on final branch and PR CI is mandatory before delivery; the failed local run is not called PASS |
| REGRESSION_DIAGNOSTIC | Initial local integration116/117: existing lazy-calendar grid did not load within10s. Isolated unchanged date-input4/4 and complete integration rerun117/117 PASS, preserving the first failure log; no code/assertion/timeout/automatic-retry changes |
| BROWSER_DIAGNOSTIC | Initial complete run lost the browser execution context during navigation in blue-green.spec.ts:65;205 tests passed and4 skipped. Original log/screenshot/context preserved; isolated traced case1/1 PASS. Root cause not proven. Final full branch/PR CI must resolve this gate, without masking or dropping the test |
| PUBLICATION | Only closure documentation and two synthetic documentation examples are eligible for commits. Publish existing branches without force; verify final branch/PR CI on actual final HEADs. PR descriptions and delivery record carry final SHAs/run links, not the initial deployment SHAs |
| PROMOTION | Two MDL12 PRs to main are authorized; merge requires a new explicit user instruction. No new COMPLETE checkpoint, MDL13 or automatic merge |
| OPERATIONAL_PENDING | Isolated backup restoration test; separate security-setting review for leaked-password protection; optional wall-clock24h/cleanup observation and broader real-device/accessibility evaluation |
| NEXT | Finish local/branch/PR checks, then await explicit user authorization for final promotion; READY_FOR_MDL13 remains false |
| LAST_TESTED_SOURCE | 90a051fea822a23f65e9a6dd853a77a492fae682; subsequent closure changes are documentation/examples only |
| IMPLEMENTATION | Protected /finance/inbox/import; bounded upload, explicit mapping and eligible account selection, preview50 rows, explicit selection/duplicate acknowledgement, pending Inbox links, reload/history/expiry, V2.3 themes and responsive layout |
| INBOX_INTEGRATION | Import never posts directly. Existing MDL11 separate confirmation is the only financial step; source badges FILE_CSV/FILE_OFX/FILE_PDF and candidate deep links retain their identifiers |
| SOURCE_CI | Initial deployment HEADdb96305: [PASS38913653564](https://github.com/beter-life/Front/actions/runs/38913653564). Final closure CI is verified independently on the new HEAD; [branch runs](https://github.com/beter-life/Front/actions?query=branch%3Acodex%2Fmdl12-financial-file-import) |
| HUMAN_GUIDE | [Nine approved scenarios, formats and evidence](./FINANCIAL_FILE_IMPORT.md); synthetic-only examples under docs/examples/imports/ |
