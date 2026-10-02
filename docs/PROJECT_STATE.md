# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 4 — Financial Goals |
| STATUS | COMPLETE |
| SCOPE | Protected goal planning UI in Finance; Auth V2 and MDL 2/3 preserved |
| BRANCH | codex/mdl4-financial-goals |
| BASELINE_MAIN | ed6bc0f38262b3ef901216077ee61355b0e8f5bf contains approved MDL 0–3; merge commit from [PR #1](https://github.com/beter-life/Front/pull/1); main CI [37027493855](https://github.com/beter-life/Front/actions/runs/37027493855) PASS |
| LAST_TESTED_COMMIT | eeb4ae0baec18402b01d2044ade45d8ad89b4d19; final regression 2026-10-02; closure changes documentation only |
| DONE | /finance/goals and /finance/goals/:goalId; create/edit, status/currency filters, per-currency totals, server projections, fixed currency and priority, contribution/withdrawal, paginated history, pause/resume/archive and preserved replay key after uncertain response |
| DECISIONS | Goals are declared planning, with no account/transaction/transfer/budget movement; generated Back contract; owner-scoped cache; all financial projections from Back; exact BigInt presentation, real percentage text and visual bar capped at 100%; inactive actions blocked |
| BACKEND | Migration 0005 applied to Supabase DEV after PostgreSQL/RLS PASS with TLS verify-full and existing data unchanged; goals/events RLS, composite owner FK, locked idempotency and overdraft prevention; no SQL goal test data inserted |
| TESTS | Final closure regression 2026-10-02: Unit 30 + integration 29 + browser desktop/mobile 56 PASS, including tablet/keyboard and existing Auth/Finance/Budget regressions; lint, typecheck, build, secret scan and harness PASS; screenshots checked; full logs in ignored .harness/logs/ |
| TEST_LIMITS | Automated browser tests use the real SDK with intercepted external responses; they do not certify the hosted human gate |
| CI | Pre-closure branch CI PASS on eeb4ae0 (run 37032152246); final closure branch/PR/main runs require confirmation |
| LOCAL | Front http://localhost:3101/finance/goals; Back localhost:3001; local env files preserved |
| GATES | GOAL_MODEL=PASS; GOAL_EVENTS=PASS; CONTRIBUTIONS=PASS; WITHDRAWALS=PASS; IDEMPOTENCY=PASS; PROGRESS=PASS; REQUIRED_MONTHLY=PASS; ESTIMATED_COMPLETION=PASS; GOAL_STATUS=PASS; PRIORITY=PASS; MULTI_CURRENCY=PASS; RLS=PASS; OWNERSHIP=PASS; OPENAPI=PASS; PERSISTENCE=PASS; ISOLATION_FROM_ACCOUNTS=PASS; ISOLATION_FROM_TRANSACTIONS=PASS; ISOLATION_FROM_TRANSFERS=PASS; ISOLATION_FROM_BUDGETS=PASS |
| MERGED_TO_MAIN | false; automatic integration pending required CI |
| REAL_GATE | PASS |
| HUMAN_GATE | Approved by user on 2026-10-02: META=PASS; CONTRIBUIÇÃO=PASS; RETIRADA=PASS; CÁLCULOS=PASS; RELOAD=PASS; EDIÇÃO=PASS; PAUSE_RESUME=PASS; PROJEÇÃO=PASS; ISOLAMENTO_FINANCEIRO=PASS; OWNERSHIP=PASS |
| BLOCKER | None for module closure; branch/PR/main CI must remain green for automatic integration |
| CHECKPOINT | checkpoint/mdl4-financial-goals-complete-2026-10-02; tag on final MDL 4 branch closure commit; earlier module checkpoints preserved |
| READY_FOR_MDL5 | true |
| NEXT | Complete the authorized PR/merge integration only after green branch/PR gates, then verify main CI. Do not start MDL 5 or change the roadmap |
