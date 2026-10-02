# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 3 — Monthly Budgeting |
| STATUS | COMPLETE |
| SCOPE | Frontend Finance; Auth V2 and MDL 2 preserved |
| BRANCH | codex/mdl3-monthly-budgeting |
| LAST_TESTED_COMMIT | 22190d8f6162249af8e72e882e08b44275e6de7e; final regression 2026-10-02; closure changes documentation only |
| DONE | Protected monthly budget page; month/currency navigation, exact totals/progress, inline limits, positive rollover, copy previous, unbudgeted spending, accessible linear pace, generated client and owner-scoped cache |
| GATES | BUDGET_MODEL/ALLOCATIONS/ROLLOVER/COPY_PREVIOUS/UNBUDGETED_SPENDING/SPENDING_PACE/MONTH_SUMMARY/RLS/OWNERSHIP/OPENAPI/PERSISTENCE=PASS; approved for MDL 3 closure |
| BACKEND | MDL 3 complete; migration 0004 and owned budget API preserved; final PostgreSQL 17/RLS regression 28 PASS in disposable database; tested Back commit 520fadf9e97a044f5f92b188767e172ae2f27200 |
| TESTS | Final regression 2026-10-02: unit 26 + integration 22; browser desktop/mobile 40 including tablet/keyboard; lint, typecheck, build, secret scan and harness PASS; Auth/Finance regressions preserved. Logs retained in ignored .harness/logs/ |
| CI | Baseline PASS on 22190d8f6162249af8e72e882e08b44275e6de7e; GitHub Actions run 36901188846. Documentation closure push runs the unchanged quality workflow |
| LOCAL | Front http://localhost:3101/finance/budgets; Back localhost:3001 |
| REAL_GATE | PASS |
| HUMAN_GATE | Approved by user on 2026-10-02: ORÇAMENTO/DESPESA/CÁLCULOS/RELOAD/EDIÇÃO/COPY_PREVIOUS/OWNERSHIP=PASS |
| PRESERVED | Auth V2/MDL 2 and validated MDL 3 functionality; local .env files preserved; browser regression used mocked external responses, with no hosted test writes |
| BLOCKER | None for MDL 3 closure |
| CHECKPOINT | checkpoint/mdl3-monthly-budgeting-complete-2026-10-02; tag on documentation closure commit |
| READY_FOR_MDL4 | true |
| NEXT | MDL 3 complete. Await an explicit request to start MDL 4; MDL 4 has not been started |
