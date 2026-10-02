# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 4 — Financial Goals |
| STATUS | COMPLETE |
| SCOPE | Protected goal planning UI in Finance; Auth V2 and MDL 2/3 preserved |
| BRANCH | main; codex/mdl4-financial-goals retained at the closure checkpoint |
| BASELINE_MAIN | 3b7d2e0430f0cd33c2ec182d1ace00bc7890fc01 contains approved MDL 0–4; merge commit from [PR #2](https://github.com/beter-life/Front/pull/2) |
| LAST_TESTED_COMMIT | 3b7d2e0430f0cd33c2ec182d1ace00bc7890fc01; post-merge main CI 37037050437 PASS includes the full regression; subsequent integration snapshot changes documentation only |
| DONE | /finance/goals and /finance/goals/:goalId; create/edit, status/currency filters, per-currency totals, server projections, fixed currency and priority, contribution/withdrawal, paginated history, pause/resume/archive and preserved replay key after uncertain response |
| DECISIONS | Goals are declared planning, with no account/transaction/transfer/budget movement; generated Back contract; owner-scoped cache; all financial projections from Back; exact BigInt presentation, real percentage text and visual bar capped at 100%; inactive actions blocked |
| BACKEND | Migration 0005 applied to Supabase DEV after PostgreSQL/RLS PASS with TLS verify-full and existing data unchanged; goals/events RLS, composite owner FK, locked idempotency and overdraft prevention; no SQL goal test data inserted |
| TESTS | Final closure regression 2026-10-02: Unit 30 + integration 29 + browser desktop/mobile 56 PASS, including tablet/keyboard and existing Auth/Finance/Budget regressions; lint, typecheck, build, secret scan and harness PASS; screenshots checked; full logs in ignored .harness/logs/ |
| TEST_LIMITS | Automated browser tests use the real SDK with intercepted external responses; they do not certify the hosted human gate |
| CI | Final closure branch [37034384287](https://github.com/beter-life/Front/actions/runs/37034384287) PASS; PR [37036656388](https://github.com/beter-life/Front/actions/runs/37036656388) PASS; post-merge main [37037050437](https://github.com/beter-life/Front/actions/runs/37037050437) PASS. The documentation snapshot runs the unchanged quality workflow |
| LOCAL | Front http://localhost:3101/finance/goals; Back localhost:3001; local env files preserved |
| GATES | GOAL_MODEL=PASS; GOAL_EVENTS=PASS; CONTRIBUTIONS=PASS; WITHDRAWALS=PASS; IDEMPOTENCY=PASS; PROGRESS=PASS; REQUIRED_MONTHLY=PASS; ESTIMATED_COMPLETION=PASS; GOAL_STATUS=PASS; PRIORITY=PASS; MULTI_CURRENCY=PASS; RLS=PASS; OWNERSHIP=PASS; OPENAPI=PASS; PERSISTENCE=PASS; ISOLATION_FROM_ACCOUNTS=PASS; ISOLATION_FROM_TRANSACTIONS=PASS; ISOLATION_FROM_TRANSFERS=PASS; ISOLATION_FROM_BUDGETS=PASS |
| MERGED_TO_MAIN | true |
| REAL_GATE | PASS |
| HUMAN_GATE | Approved by user on 2026-10-02: META=PASS; CONTRIBUIÇÃO=PASS; RETIRADA=PASS; CÁLCULOS=PASS; RELOAD=PASS; EDIÇÃO=PASS; PAUSE_RESUME=PASS; PROJEÇÃO=PASS; ISOLAMENTO_FINANCEIRO=PASS; OWNERSHIP=PASS |
| BLOCKER | None; human gate, final local regression, branch CI, PR CI, merge and post-merge main CI PASS |
| CLOSURE_COMMIT | 4e6ebffb68f2af448f7c76b5bc55c3459141d7ff; final branch closure commit and checkpoint target |
| CHECKPOINT | checkpoint/mdl4-financial-goals-complete-2026-10-02; tag on final MDL 4 branch closure commit; earlier module checkpoints preserved |
| READY_FOR_MDL5 | true |
| NEXT | MDL 4 complete and integrated into main. Stop here and await a separate user instruction; MDL 5 has not been started |
