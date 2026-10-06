# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 8 — Cards, Invoices & Installments |
| STATUS | COMPLETE |
| MDL8_STATUS | COMPLETE |
| REAL_GATE | PASS; user-approved Cards gate on 2026-10-06; validation records preserved |
| READY_FOR_MDL9 | true; both closure branch/PR/main CI and merge commits PASS; MDL9 not started |
| MERGED_TO_MAIN | true; [PR6](https://github.com/beter-life/Front/pull/6), merge commit cf3b5e6568b41785c45b2d766c88304a2a4d8e1c; no squash/rebase |
| SCOPE | Protected Cards dashboard/detail, stable forms and generated contracts |
| BRANCH | main; MDL0–MDL8 integrated, origin/main synchronized |
| BASELINE_MAIN | c1522944c3628833c6982a81fed78e2f75031b49; approved MDL0–MDL7 preserved |
| LAST_TESTED_COMMIT | cf3b5e6568b41785c45b2d766c88304a2a4d8e1c; complete main CI PASS; final handoff changes documentation only |
| DONE | Cards/new or linked credit accounts, safe metadata, immutable billing versions, atomic idempotent purchases1–60, derived invoices/status/limits, partial/FIFO/excess transfer payments, corrective cancellation and terminal archive |
| ACCOUNTING | Purchase=EXPENSE; payment=TRANSFER. Exact minor units/remainder last; recognized balance and future commitments separate. No duplicate Net Worth liability, FX, processing, interest, refunds or paid services |
| DATES | User-local DATE/UTC fallback; original monthly anchor/clamp; due strictly after close; closing-day charge included. Checked DATE→instant; no scheduler |
| INTEGRITY | JWT.sub/foreign404; TypeBox→OpenAPI→generated Zod; compound FKs/RLS; no public DELETE/new grants. Managed generic debits/outgoing transfers blocked; safe legacy tracking boundary |
| DATABASE | 0009_financial_cards already applied once to DEV after disposable PG17 PASS; migration hashes0001–0009 verified; Auth/JWT/JWKS unchanged; Shared Pooler/TLS verify-full preserved |
| EXISTING_DATA | Closure read-only comparison PASS for19 app tables including human Cards records; counts/hashes/schema/indexes/policies/grants/FKs unchanged. No hosted writes or extra fixtures |
| TESTS | unit67; integration61; browser90 desktop/mobile plus tablet/keyboard/layout; lint/typecheck/build/secret scan/harness PASS |
| CI | [Closure branch](https://github.com/beter-life/Front/actions/runs/37454137773), [PR](https://github.com/beter-life/Front/actions/runs/37454920686), [merge main](https://github.com/beter-life/Front/actions/runs/37455564472): PASS; final documentation handoff runs the unchanged complete workflow |
| MODEL_GATES | CARD_MODEL=PASS; CREDIT_ACCOUNT_INTEGRATION=PASS; BILLING_RULE_VERSIONING=PASS; INVOICE_ENGINE=PASS; INVOICE_STATUS=PASS; PURCHASES=PASS; INSTALLMENTS=PASS; INSTALLMENT_SPLIT=PASS; MONTH_END_CLAMP=PASS |
| ACCOUNTING_GATES | PAYMENTS=PASS; PARTIAL_PAYMENTS=PASS; PAYMENT_FIFO=PASS; NO_DOUBLE_COUNTING=PASS; FUTURE_COMMITMENTS=PASS; CREDIT_LIMIT=PASS; LEGACY_BALANCE=PASS; CANCELLATION=PASS; ARCHIVE=PASS; MULTI_CURRENCY=PASS; BUDGET_INTEGRATION=PASS; NET_WORTH_INTEGRATION=PASS; FINANCIAL_ISOLATION=PASS |
| SECURITY_GATES | RLS=PASS; OWNERSHIP=PASS; OPENAPI=PASS; CARD_DATA_SECURITY=PASS |
| HUMAN_GATE | CARD=PASS; PURCHASE_1X=PASS; PAYMENT=PASS; NO_DOUBLE_COUNTING=PASS; INSTALLMENTS=PASS; INSTALLMENT_SPLIT=PASS; FUTURE_COMMITMENTS=PASS; RELOAD=PASS; BILLING_RULE_VERSIONING=PASS; CANCELLATION=PASS; ARCHIVE=PASS; BUDGET_INTEGRATION=PASS; NET_WORTH_INTEGRATION=PASS; FINANCIAL_ISOLATION=PASS; OWNERSHIP=PASS |
| FINANCIAL_CALENDAR | DEFERRED; preserve MDL5 recurrence-only contract; Cards exposes due dates |
| LOCAL_APP | Approved real gate on Back3001/Front3101; .env unchanged/ignored; hosted TLS verify-full; NODE_USE_SYSTEM_CA=1 when needed |
| CHECKPOINT | checkpoint/mdl8-cards-invoices-installments-complete-2026-10-06 targets b61f0c0b295b831dc6e950ac616f11c025712e3d, final branch closure commit; DEV and prior checkpoints preserved |
| BLOCKER | NONE; preexisting Auth password-protection advisor unchanged; private market-rates cache deliberately has no client policy |
| NEXT | Await an explicit MDL9 request (Debt + payoff simulator); do not create its branch or implement automatically |
