# Project state

| Field | Value |
| --- | --- |
| MODULE | UI/UX Foundation V2 — Navigation & Interface |
| STATUS / UIUX_V2_STATUS | AWAITING_REAL_GATE |
| REAL_GATE | PENDING; navigation and appearance need human approval |
| MERGED_TO_MAIN | false; no final PR/merge authorized in this stage |
| MDL11_STATUS | NOT_STARTED |
| BRANCH | codex/uiux-v2-navigation-foundation |
| BASELINE_FRONT | 38d32a35f69ac79367ccf9f94fc65523ba669bb5; MDL0–10 integrated; MDL10 real gate and Back/Front main CI PASS |
| LAST_TESTED_COMMIT | 744990adeb3c2dab5645ec286f5ada8ef19a9e7d; implementation fully tested; subsequent handoff changes documentation only |
| DONE | Typed navigation SSOT; grouped sidebar/rail; mobile bottom bar/modal drawer; page finder; breadcrumbs; useful Home/Finance shortcuts; Light/Dark/System; shared tokens/dialogs/headers/skeleton; reserved form feedback |
| PRESERVED | Auth V2 singleton/session/provider/guards/cache; API/generated DTOs; financial helpers/ledger; Back, Supabase, migrations, RLS, hosted data; dependencies unchanged |
| TESTS | 115 unit +83 integration +137 browser PASS; one existing duplicate mobile tablet case skipped; lint/typecheck/build/security scan/harness PASS; financial assertions unchanged |
| VISUAL | Actual Chromium screenshots before/after; Light/Dark at 320/375/390/768/1024/1440; keyboard/modal focus, reflow/reduced-motion and stable forms PASS |
| CI | [Exact branch HEAD workflow](https://github.com/beter-life/Front/actions?query=branch%3Acodex%2Fuiux-v2-navigation-foundation); final result verified in delivery report before human handoff |
| CHECKPOINT | checkpoint/uiux-v2-navigation-foundation-dev; final handoff commit, never COMPLETE |
| LOCAL_APP | Front localhost:3101; unchanged Back health/live and health/ready 200 on localhost:3001 |
| LIMITS | Full screen-reader/WCAG certification and subjective aesthetics not claimed; existing large single-bundle warning retained; tables use bounded scrolling; optional baseline screenshots are local-only |
| BLOCKER | No technical blocker at local verification; human gate pending |
| NEXT | Open localhost:3101, login, validate groups/search/themes and Cards→Movements→Budget→Safe to Spend→Debt→Goals→Profile on desktop/tablet/mobile; reload/logout. Record human approval before any final PR/merge or MDL11 |
