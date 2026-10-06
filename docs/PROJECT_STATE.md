# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 9 — Debt Management & Payoff Simulator |
| STATUS | COMPLETE |
| MDL9_STATUS | COMPLETE |
| REAL_GATE | PASS; user-approved complete Debt gate on 2026-10-06 |
| READY_FOR_MDL10 | true; closure branch CI, PR CI, merge commit and exact merge main CI PASS; MDL10 not started |
| SCOPE | Debt dashboard/detail, real payment split/history, terms and server-owned payoff comparison |
| BRANCH | main; MDL0–MDL9 integrated; local main synchronized with origin/main |
| BASELINE_MAIN | 04dff36d97ea4aaa3a67163ff6b1b6fe13f4d33f; approved MDL0–MDL8 preserved; exact main CI PASS before implementation |
| LAST_TESTED_COMMIT | 6d91d224bb695e2200c4c780c48c7017524a2fc0; complete exact main CI PASS; final handoff changes PROJECT_STATE only |
| DONE | New managed debt account; metadata; immutable term versions; atomic split payments; owner idempotency; latest-payment cancellation; paid-off/archive lifecycle; bounded simulation and explicit manual liability conversion |
| ACCOUNTING | Positive input creates negative debt opening principal. Principal=TRANSFER; actual interest/fees=EXPENSE. No mutable second balance, automatic projected interest, FX or recurrence. Budget includes only costs; Net Worth principal transfer is neutral |
| TERMS_RATE | Intervals [effectiveFrom,effectiveTo); atomic future version; effective annual=(1+r)^(1/12)-1; monthly direct; decimal strings/Decimal precision256; money rounded HALF_UP at minor-unit boundary; 0% allowed |
| SIMULATION | Read-only MINIMUM_ONLY/AVALANCHE/SNOWBALL/COMPARE; one currency; 1–20 debts; 600 months; optional schedule; deterministic ties/freed minimum redistribution; NOT_AMORTIZING and HORIZON_EXCEEDED; future versions selected by due DATE |
| PAYMENT_INTEGRITY | Source owner/active/currency; checking/savings/cash/other; sufficient total cash; no overpay; no future/pretracking/out-of-order payments; idempotent canonical retry; atomic linked transfer/interest/fee rollback; stable keyset history |
| CONVERSION | Explicit owned active manual LIABILITY with matching currency/latest principal; atomic archive+new managed debt; no automatic conversion or double counting |
| SECURITY | JWT.sub only; cross-owner404; compound owner/currency/type FKs; private app schema/RLS; client own SELECT only, writes controlled through API; no public DELETE/grants; generic managed-account writes and linked-payment edits blocked |
| DATABASE | 0010_financial_debts applied once to Supabase DEV after disposable PostgreSQL17 PASS; canonical LF migration hashes0001–0010 verified; files0001–0009 unchanged; three new tables with RLS; CHECK adds debt and only reviewed core constraints/indexes/triggers |
| EXISTING_DATA | PASS; read-only closure before/after snapshots of all22 app tables, including real MDL9 gate records; row counts/hashes/schema/indexes/constraints/policies/grants/RLS/functions/triggers unchanged; no hosted writes or fixtures |
| HOSTED_SECURITY | Existing Auth/JWT/JWKS configuration and TLS verify-full preserved; NODE_USE_SYSTEM_CA=1 uses system trust without disabling certificate validation; local env SHA256 unchanged and ignored |
| TESTS | unit81; integration69; browser102 (desktop/mobile, MDL9 tablet/keyboard/layout stability); lint/typecheck/build/secret scan/harness PASS |
| CI | [Closure branch](https://github.com/beter-life/Front/actions/runs/37500490243), [PR](https://github.com/beter-life/Front/actions/runs/37501064257), [merge main](https://github.com/beter-life/Front/actions/runs/37501651524): PASS; final documentation handoff runs the unchanged complete workflow and its exact final HEAD CI is reported at delivery |
| MODEL_GATES | DEBT_MODEL=PASS; DEBT_ACCOUNT_TYPE=PASS; TERM_VERSIONING=PASS; RATE_ENGINE=PASS; PAYOFF=PASS; AVALANCHE=PASS; SNOWBALL=PASS; NEGATIVE_AMORTIZATION=PASS; SIMULATION_HORIZON=PASS; MULTI_CURRENCY=PASS |
| ACCOUNTING_GATES | PAYMENTS=PASS; PRINCIPAL_TRANSFER=PASS; INTEREST_EXPENSE=PASS; FEE_EXPENSE=PASS; NO_DOUBLE_COUNTING_DEBT=PASS; PAYMENT_IDEMPOTENCY=PASS; BUDGET_INTEGRATION=PASS; NET_WORTH_INTEGRATION=PASS; MANUAL_LIABILITY_CONVERSION=PASS |
| ISOLATION_GATES | CARD_ISOLATION=PASS; YIELD_ISOLATION=PASS; RECURRENCE_ISOLATION=PASS; complete MDL0–MDL9 regression; no paid APIs or new dependencies |
| CONTRACT_GATES | RLS=PASS; OWNERSHIP=PASS; OPENAPI=PASS; TypeBox source → generated Front Zod; contract drift PASS |
| LOCAL_APP | Back localhost:3001 and Front localhost:3101; /finance/debts human gate approved; .env files unchanged/ignored; verified hosted TLS retained |
| HUMAN_GATE | DEBT=PASS; PAYMENT=PASS; PRINCIPAL_TRANSFER=PASS; INTEREST_FEE_EXPENSE=PASS; NO_DOUBLE_COUNTING_DEBT=PASS; BUDGET_INTEGRATION=PASS; NET_WORTH_INTEGRATION=PASS; RELOAD=PASS; SIMULATOR=PASS; MINIMUM_ONLY=PASS; AVALANCHE=PASS; SNOWBALL=PASS; TERM_VERSIONING=PASS; PAYOFF=PASS; MANUAL_LIABILITY_CONVERSION=PASS; CARD_ISOLATION=PASS; YIELD_ISOLATION=PASS; RECURRENCE_ISOLATION=PASS; OWNERSHIP=PASS |
| CHECKPOINT | checkpoint/mdl9-debt-payoff-simulator-complete-2026-10-06 targets f73c729ae4b70ac123a5e0823364cc39a3946ed6, final closure branch commit; DEV/DEV v2 and MDL0–MDL8 checkpoints preserved |
| BLOCKER | NONE; branch/PR/merge/main gates PASS; human gate PASS |
| NEXT | Await an explicit MDL10 request (Safe to Spend). Do not create its branch or implement automatically |
| MERGED_TO_MAIN | true; [PR7](https://github.com/beter-life/Front/pull/7), merge commit 6d91d224bb695e2200c4c780c48c7017524a2fc0; no squash/rebase |
