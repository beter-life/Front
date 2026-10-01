# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 2 — Financial Core |
| STATUS | AWAITING_REAL_GATE |
| SCOPE | Frontend Finance; Auth V2 preserved |
| BRANCH | codex/mdl2-financial-core |
| LAST_TESTED_COMMIT | f2f2148be587e8cf1fa4ad2cfddaabf11755a01b |
| BASELINE | MDL 1F COMPLETE, real Auth gates manually approved; checkpoint/mdl1f-auth-v2-complete-2026-10-01 and prior stash 019edaf1 preserved |
| DONE | Protected finance dashboard, accounts/create/edit/deactivate, categories, income/expense, transfers, filters/pagination/cancellation. Generated TypeBox→Zod client; exact BigInt money and profile timezone; private cache cleared on identity change/logout |
| TESTS | Unit/integration 34; browser desktop/mobile 30 including all 22 Auth regressions and Finance end-to-end; lint/typecheck/build/secret scan/harness PASS. Visual desktop/mobile reviewed. Only external transport intercepted; no real emails requested |
| BACKEND | Back tested 0d2ad207; existing contracts unchanged; hosted 0003_finance_core applied, four RLS tables, TLS verify-full; live/ready 200 and unauthenticated Finance 401 |
| LOCAL | Front http://localhost:3101/finance; Back localhost:3001 with matching CORS |
| REAL_GATE | PENDING_MANUAL; no Finance records inserted through SQL or fake remote data |
| BLOCKERS | Real authenticated financial flow needs the user's manual approval; no technical local blocker |
| READY_FOR_MDL3 | false |
| NEXT | In /finance create Principal BRL opening 1000, Reserva BRL opening 0, categories, income 200, expense 50 and transfer 100; expect balances 1050/100 and total 1150, then reload and confirm own persisted data |
