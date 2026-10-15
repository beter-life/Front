# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL11 — Financial Ingestion Hub + Financial Inbox |
| STATUS | AWAITING_UX_VALIDATION |
| MDL11_STATUS | AWAITING_UX_VALIDATION |
| REAL_GATE | PASS — original seven-flow gate reported by user |
| MDL11_HUMAN_GATE | PASS |
| MDL11_HUMAN_TESTS | 7/7 |
| READY_FOR_MDL12 | false |
| PREVIOUS_MODULES | MDL0–MDL10 COMPLETE; UIUX_V2_STATUS=COMPLETE; DESIGN_ITERATION=V2.3_BLUE_GREEN |
| BASELINE_MAIN | `380cde3c5182a85514301ed34e246612f30d1743`; [exact baseline CI PASS](https://github.com/beter-life/Front/actions/runs/38731697100) |
| BASELINE_BACK | `8842cfb2e282d354ac88e618547797a9af216242`; [exact baseline CI PASS](https://github.com/beter-life/Back/actions/runs/38731701722) |
| BRANCH | codex/mdl11-financial-ingestion-hub-inbox; no final PR or merge |
| LAST_TESTED_COMMIT | `82dbf464c38d280d125a63e8b770869bdb8ab21d`; application code passed full local regression; follow-up changes are handoff docs and browser-test readiness synchronization only |
| IMPLEMENTATION | Protected /finance/inbox; manual drafts, filters/cursor pagination, review/edit, accounts/categories, duplicate acknowledgement, single-submit confirm/discard and terminal history. Existing V2.3 components/tokens and Auth V2 preserved |
| CONTRACT | Back TypeBox/OpenAPI → official generated Zod; contract drift PASS. Backend owns financial validation and atomic/idempotent posting. No parallel Finance Core or client-side duplicate heuristic |
| LOCAL_GATES | Node24.11.1/pnpm11.19.0; fresh lint/typecheck/249 unit+integration/194 browser PASS,4 skips (3 previous+1 touch sidebar). Full desktop/mobile, tablet/keyboard, six-width Light/Dark regression, build/secret scan/harness PASS; seven approved MDL11 flows retained |
| CARD_ACCOUNT_UX_FIX | PASS automated; card.accountId→account.id only, including archived links. Accounts badge/name/detail link; disabled Inbox card options; unavailable/retry instead of false classification; explicit edits preserve old associations; contextual card/debt help uses real links. Final human UX validation pending |
| FINANCIAL_BEHAVIOR_UNCHANGED | PASS; Back source, Finance Core, RLS, migrations and generated contracts unchanged. canConfirm and card tracking-date eligibility remain backend-owned; no hosted requests or financial corrections performed |
| LOCAL_UI_REFINEMENT | Included page+sidebar floating thumbs: no reserved gutter/padding; higher-contrast themes,36–96px height,24px end margins,2px idle hint,32px proximity/200ms reveal. Native scrolling, independent drag/keyboard, modal lock, reduced motion and native touch/forced-colors fallback preserved |
| REGRESSION_NOTES | Full249-test local rerun with maxWorkers2 PASS after a calendar lazy-load timeout, without calendar changes. Layout browser test now awaits3 async panels and visible form before measuring, retaining all assertions/no retries or timeout increase; complete V2.3 rerun17 PASS+1 touch skip. See delivery doc for CI evidence |
| BASELINE | Before MDL11: 131 unit/91 integration, prior179 browser PASS with3 skips; all previous tests retained and navigation expectations extended |
| PERFORMANCE | Main JS gzip261.70→267.67KB (+5.97KB including presentation refinements); no new dependencies. Existing >500KB chunk warning retained. Back synthetic2000-proposal bounds/core read regression PASS |
| SECURITY | JWT remains in existing Auth boundary; no owner payload, credentials/financial data/fingerprint logging or hosted fixtures. Private query cache and logout behavior preserved |
| SUPABASE_DEV | Authorized0012 deployment snapshot:12/12, ACTIVE_HEALTHY, verify-full/CA/hostname and24-table preservation PASS; encrypted backup verified locally. Original human gate later PASS. No new hosted reads/writes, migrations or Auth changes for this UX task |
| LOCAL_APP | Front3101 /finance/accounts and /finance/inbox ready for visual review; latest original human seven-flow gate PASS per user. Prior deployment health/guard checks remain documented in FINANCIAL_INBOX.md |
| CI | [Front branch runs](https://github.com/beter-life/Front/actions?query=branch%3Acodex%2Fmdl11-financial-ingestion-hub-inbox); exact published HEAD must pass before handoff. [Back dd17779 CI PASS](https://github.com/beter-life/Back/actions/runs/38770011019) |
| CHECKPOINT | Existing DEV tag checkpoint/mdl11-financial-ingestion-hub-inbox-dev-2026-10-15 preserved, not moved; no COMPLETE checkpoint |
| LIMITS | Chromium/emulated mobile; no complete screen-reader/WCAG/physical-device/Safari/Firefox certification. Manual source only; no CSV/OFX/PDF, email ingestion, AI or voice |
| HUMAN_GATE | Original MDL11:7/7 PASS reported by user. [Complementary card-account UX script](./FINANCIAL_INBOX.md) and final promotion release remain pending |
| BLOCKERS | User validation of the final UX correction and explicit promotion authorization; new exact branch HEAD CI must pass |
| NEXT | Review Contas/Inbox card identification, old-proposal account selection and included overlay scrollbars; await final user release. No final PR/merge, COMPLETE checkpoint or MDL12 |
