# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 10 — Safe to Spend / Quanto Posso Gastar com Segurança |
| STATUS | REAL_GATE_PASS_PENDING_MERGE |
| MDL10_STATUS | REAL_GATE_PASS_PENDING_MERGE |
| REAL_GATE | PASS; human gate recorded in SAFE_TO_SPEND.md |
| READY_FOR_MDL11 | false |
| SCOPE | Protected Safe to Spend onboarding, configuration, breakdown and server-owned estimates |
| BRANCH | codex/mdl10-safe-to-spend; no final PR or merge |
| BASELINE_MAIN | 45540bded4c45158649962a79d7ac9cb0ee97483; exact origin/main and main CI PASS before implementation; MDL0–MDL9 preserved |
| LAST_TESTED_COMMIT | e602c10e3d8d52341c50e2a049f5a7bffae204c9; exact implementation branch CI PASS; final handoff changes documentation only and exact final HEAD CI is reported at delivery |
| MODEL | Signed selected cash minus card/debt/future expense obligations, optional recurrence/goal reserves and buffer; Budget is cap, not subtraction; expected income scenario only; floor daily pace and explicit shortfall/warnings |
| SECURITY | JWT.sub only; strict inputs/foreign account404; private RLS own SELECT/backend settings writes, immutable owner/compound FKs; no secrets/logs/env versioned; no new dependencies, FX, AI or paid APIs |
| SNAPSHOT | Repeatable-read/read-only, bounded batch reuse of Cards/Debt/Budget/Goals/Recurrences; 100 accounts/cards/debts and 500 recurrences/goals tested, <=30 SQL calls and <5s disposable read |
| DATABASE | 0011_financial_safe_to_spend applied once to Supabase DEV after PostgreSQL17 PASS; migrations0001–0010 unchanged; two new tables initially empty, private RLS/ownership PASS |
| EXISTING_DATA | PASS; counts/hashes/structure of all22 previous app tables UNCHANGED; no financial fixtures/writes hosted; Auth/JWT/JWKS/TLS preserved |
| TESTS | 84 unit +75 integration +109 browser PASS; one mobile duplicate of desktop tablet case skipped; desktop/mobile/tablet/keyboard and stable forms PASS; lint/typecheck/build/secret scan/harness/OpenAPI/contract drift PASS |
| CI | Implementation [commit](https://github.com/beter-life/Front/actions/runs/37775757677) and closure-docs [HEAD](https://github.com/beter-life/Front/actions/runs/37776630045) PASS; final PR/main CI pending |
| LOCAL_APP | Human gate PASS on hosted DEV; Back live/ready200; Front 3101 served; CORS preflight 204 |
| LIMITS | [Formula, horizon, coverage and bounds](./SAFE_TO_SPEND.md); no obligations invented outside current-month horizon; only own settings are written |
| CHECKPOINT | DEV checkpoint preserved; COMPLETE checkpoint pending validated closure commit |
| ADVISORS | No security finding on new tables. Existing backend-only market-rate no-policy INFO and Auth leaked-password WARN left unchanged. New compound-FK coverage/unused-index INFO reviewed: profile PK prefix and owner/account index support bounded lookups; parent identity immutable; 100/500 volume test PASS |
| BLOCKER | None before promotion; PR, merge-commit and final main CI gates remain |
| NEXT | Create Back/Front PRs from codex/mdl10-safe-to-spend to main after closure docs CI; merge only after all required checks pass. MDL11 not started |
