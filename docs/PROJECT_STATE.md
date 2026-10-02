# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 5 — Recurrences, Subscriptions & Financial Calendar |
| STATUS | AWAITING_REAL_GATE |
| REAL_GATE | PENDING |
| READY_FOR_MDL6 | false |
| BRANCH | codex/mdl5-recurring-calendar; created exclusively from synchronized main |
| BASELINE_MAIN | af276b612c368e04fb631fba017d77c7305988d6; approved MDL0–4, MDL4 COMPLETE/REAL_GATE=PASS/MERGED_TO_MAIN=true; main unchanged |
| SCOPE | Protected recurrence forms/list/status/filters, subscription radar and monthly chronological financial calendar |
| LAST_TESTED_COMMIT | 223d9d1a0c7982f59bc7655d953b8dabdd344dba; local regression and complete branch CI PASS; this development checkpoint changes documentation only |
| CI | [Implementation 37044327876](https://github.com/beter-life/Front/actions/runs/37044327876) PASS on 223d9d1a0c7982f59bc7655d953b8dabdd344dba; the documentation checkpoint uses the unchanged quality workflow, whose final result is checked before handoff |
| DONE | Routes /finance/recurrences and /finance/calendar; RHF/Zod create/edit, compatible optional links, retained inactive references, paginated owner list, URL filters, explicit pause/resume, confirmed terminal archive, radar actual occurrences, agenda/month navigation, separate currency summaries, loading/empty/error/retry, keyboard/mobile/tablet |
| DECISIONS | Recurrence != transaction; expectations never change confirmed ledger, accounts, transfers, budgets or goals. Type/currency fixed after creation; archive terminal. Edits replace rule and recalculate projections, no historical occurrence ledger. SUBSCRIPTION is a user classification requiring EXPENSE; no autodetection/matching/automatic posting |
| DATES | DATE / YYYY-MM-DD years 1000–9998; 9999-01-01 only exclusive upper calendar bound; original anchor retained after clamp. Profile timezone discovers today, UTC fallback; projected dates never become UTC-midnight timestamps |
| MONEY | BIGINT >0 and JSON integer strings; exact BigInt aggregation/formatting by currency; no FX. Projected net is income minus expense, never available balance |
| LIMITS | WEEKLY 1–52, MONTHLY 1–24, YEARLY 1–10; inclusive optional end; calendar [from,to) 1–366 days; list default50/max100 with createdAt+id cursor; explicit 409 above 500 eligible rules. Calendar loads rules once, no occurrence N+1 |
| RADAR | ACTIVE subscriptions in [today,today+30), actual repeated charges by currency, no monthly equivalent. Counts include active future/ended subscriptions; zero charges permitted and ended next date null |
| OWNERSHIP | JWT sub only; no owner input; foreign rule/account/category IDs 404; joins scoped to owner; own active new links, account currency/category type compatible; existing later-inactive associations preserved |
| DATABASE | 0006_financial_recurrences reviewed and applied to existing Supabase DEV after disposable PostgreSQL17 migration/RLS PASS; verified TLS, no destructive operations, no changed 0001–0005 migration, no fixture records inserted remotely |
| EXISTING_DATA | Exact before/after hashes of profiles plus eight previous Finance tables (accounts/categories/transactions/transfers/budget periods/allocations/goals/events) unchanged; integration also proves isolated writes with nonempty profile/budget/ledger/goal data |
| SECURITY | New private app table has owner SELECT/INSERT/UPDATE USING+WITH CHECK and no DELETE policy; composite owner+currency/type FKs; no new hosted grants/Data API exposure; local env files preserved, scans PASS |
| CONTRACT | Back TypeBox → OpenAPI/client → byte-identical copied Front Zod; no backend runtime filesystem dependency; all Auth/MDL2/3/4 functionality retained |
| TESTS | Unit44 + integration40 + full browser68 desktop/mobile PASS; MDL5 browser12 rechecked after final accessibility/mobile layout adjustment, tablet/keyboard included; lint, typecheck/build, secret scan and harness PASS; screenshots reviewed |
| TEST_LIMITS | Automated browsers use the real SDK with intercepted provider/API responses and canned server dates; Back tests prove the actual recurrence engine. They do not certify the hosted human gate |
| LOCAL | Back http://localhost:3001 (ready200, protected recurrence401 without JWT); Front http://localhost:3101/finance/recurrences and /finance/calendar (200), approved CORS; apps running for human gate |
| AUTOMATED_GATES | RECURRENCE_MODEL=PASS; RECURRENCE_ENGINE=PASS; WEEKLY=PASS; MONTHLY=PASS; YEARLY=PASS; MONTH_END_CLAMP=PASS; LEAP_YEAR=PASS; SUBSCRIPTIONS=PASS; SUBSCRIPTION_RADAR=PASS; NEXT_OCCURRENCE=PASS; FINANCIAL_CALENDAR=PASS; PROJECTED_TOTALS=PASS; MULTI_CURRENCY=PASS; ACCOUNT_LINK=PASS; CATEGORY_LINK=PASS; PAUSE_RESUME=PASS; ARCHIVE=PASS; FINANCIAL_ISOLATION=PASS; RLS=PASS; OWNERSHIP=PASS; OPENAPI=PASS |
| HUMAN_GATE | Pending user: monthly Assinatura teste 100 BRL/start2026-10-31, calendar31Oct/30Nov/31Dec/31Jan, radar actual30day window; edit/reload, pause/resume/archive; income and optional USD totals; unchanged existing finance; second-user ownership when available |
| CHECKPOINT | Development documentation AWAITING_REAL_GATE on branch; no MDL5 COMPLETE tag. Existing module checkpoints preserved |
| MERGED_TO_MAIN | false; no MDL5 PR/merge in this execution |
| BLOCKER | Human approval pending; MDL6 remains blocked by the required real gate |
| NEXT | Stop here for the user gate. After user PASS, await a separate closure/PR/merge instruction. Do not initiate MDL6 |
