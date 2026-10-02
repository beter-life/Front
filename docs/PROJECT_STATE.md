# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 4 — Financial Goals |
| STATUS | AWAITING_REAL_GATE |
| SCOPE | Protected goal planning UI in Finance; Auth V2 and MDL 2/3 preserved |
| BRANCH | codex/mdl4-financial-goals |
| BASELINE_MAIN | ed6bc0f38262b3ef901216077ee61355b0e8f5bf contains approved MDL 0–3; merge commit from [PR #1](https://github.com/beter-life/Front/pull/1); main CI [37027493855](https://github.com/beter-life/Front/actions/runs/37027493855) PASS |
| LAST_TESTED_COMMIT | ae3e80072d35629e1ce69d2987ecb463960f779f; local full regression 2026-10-02; subsequent checkpoint changes documentation only |
| DONE | /finance/goals and /finance/goals/:goalId; create/edit, status/currency filters, per-currency totals, server projections, fixed currency and priority, contribution/withdrawal, paginated history, pause/resume/archive and preserved replay key after uncertain response |
| DECISIONS | Goals are declared planning, with no account/transaction/transfer/budget movement; generated Back contract; owner-scoped cache; all financial projections from Back; exact BigInt presentation, real percentage text and visual bar capped at 100%; inactive actions blocked |
| BACKEND | Migration 0005 applied to Supabase DEV after PostgreSQL/RLS PASS with TLS verify-full and existing data unchanged; goals/events RLS, composite owner FK, locked idempotency and overdraft prevention; no SQL goal test data inserted |
| TESTS | Unit 30 + integration 29 + browser desktop/mobile 56 PASS, including tablet/keyboard and existing Auth/Finance/Budget regressions; lint, typecheck, build, secret scan and harness PASS; screenshots checked; full logs in ignored .harness/logs/ |
| TEST_LIMITS | Automated browser tests use the real SDK with intercepted external responses; they do not certify the hosted human gate |
| CI | [Implementation run 37031800548](https://github.com/beter-life/Front/actions/runs/37031800548) PASS on LAST_TESTED_COMMIT; documentation checkpoint runs the unchanged quality workflow |
| LOCAL | Front http://localhost:3101/finance/goals; Back localhost:3001; local env files preserved |
| REAL_GATE | PENDING |
| HUMAN_GATE | Next: real-session create BRL target 10,000/plan 1,000/future month; contribute 2,500 (25%), reload, withdraw 500 (20%), edit target 12,000 (16.66%), pause/resume, check projection/ownership and unchanged accounts/transactions/transfers/budgets |
| BLOCKER | Human MDL 4 approval remains required before closure or merge |
| CHECKPOINT | Implementation commits d60da8e and ae3e800; approved MDL 3 tag checkpoint/mdl3-monthly-budgeting-complete-2026-10-02 preserved |
| READY_FOR_MDL5 | false |
| NEXT | User performs MDL 4 real gate; stop development here. No MDL 4 merge, MDL 5, recurrence, Yield Engine, Conflict Detector, Safe to Spend, AI or Open Finance |
