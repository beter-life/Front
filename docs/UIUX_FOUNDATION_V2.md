# UI/UX Foundation V2

## Entry gate and boundaries

MDL10 human gate PASS; Back PR8 merged at `ca6746c83483d70c69bdfaf31137db6c74546d04` and [main CI PASS](https://github.com/beter-life/Back/actions/runs/37790612267); Front PR8 merged at `38d32a35f69ac79367ccf9f94fc65523ba669bb5` and [main CI PASS](https://github.com/beter-life/Front/actions/runs/37790545926). The merged PROJECT_STATE still contained its pre-merge snapshot; this evidence supersedes that text. No MDL10 merge was performed by this task.

Front-only presentation and navigation. Auth V2 SDK/session/provider/guards, owner-isolated Query cache, financial API, generated DTOs, calculations, Back and hosted data remain unchanged. No dependencies added. MDL11 is not started.

## Audit at the effective baseline

Previous navigation: private sidebar (Home, Finance, Profile, Password) → Finance horizontal menu with 13 peer links. It wraps, duplicates hierarchy and does not scale on mobile. Home mostly introduces profile setup instead of exposing implemented tools. Existing module surfaces use cards/lists, readable native selectors, TypeBox-generated Zod contracts and exact money helpers; these are retained. FinanceForm has an in-flight submission lock; module-specific card/debt forms already reserve feedback space. Public/profile fields need stable error space. Six inline non-modal archive/correction confirmations need managed focus. Tables in Net Worth/Yield need contained scrolling rather than page overflow. Evergreen/beige hardcodes need semantic tokens, including dark mode.

| Existing route | Primary / secondary actions and work surface |
| --- | --- |
| /app | Profile greeting, useful create shortcuts and grouped tools; no invented financial values |
| /profile | Save profile / return home; RHF form, loading, retry and success |
| /account/password | Update password / return; existing Auth V2 validation and feedback |
| /finance | Official currency summary, period inputs, accounts and planning links; empty/error/loading |
| /finance/accounts | Create / edit / deactivate; currency-separated cards and opening-balance form |
| /finance/transactions | Create income/expense/transfer / cancel; account/date/type filters, keyset list |
| /finance/categories | Create / deactivate; categorized list and form |
| /finance/budgets | Monthly category planning / edit/remove; summary, pace, filters, empty/action/error states |
| /finance/goals + /:goalId | Create / contribute/withdraw/edit/archive; filters, progress and event history |
| /finance/recurrences | Create / pause/edit/archive; filtered recurring list and subscription radar |
| /finance/calendar | Month navigation / recurrence management; projected agenda/totals |
| /finance/net-worth | Add item / valuation/archive/history; official metrics, chart and historical table |
| /finance/yield | Configure/version rules / project/compare/archive/history; official benchmark states and table |
| /finance/cards + /:cardId | Create / purchase/payment/version/archive; real balance, future commitment, invoice and purchase history |
| /finance/debts + /:debtId | Create / payment/terms/archive/correction; principal vs costs, simulator and history |
| /finance/safe-to-spend | Configure / refresh; safe amount, daily pace, progressive official breakdown, warnings and projected income |

## Architecture and navigation

Typed navigation configuration → grouped desktop sidebar, mobile drawer/bottom bar, local page finder, breadcrumbs and Home tools. Existing route tree → AppShell → unchanged page services/forms. Theme preference → document tokens only; no server write.

Groups: Início (Home); Finanças (Overview, Movements, Safe to Spend); Dinheiro (Accounts, Cards, Budget); Planejamento (Calendar, Recurrences, Goals, Debts); Patrimônio (Net Worth, Yield); Organização (Categories); Conta (Profile, Security, Logout). These are UI groups, not domain boundaries. No second Finance navigation. Detail breadcrumbs expose “Detalhes”, not UUIDs.

Desktop: current group remains open; other groups can expand; icon rail preference is local/non-sensitive. Mobile: Home, Finance, Movements, Planejar (Safe to Spend), More → full drawer. Page search matches labels and synonyms only, never private data; Ctrl/Cmd+K is ignored while editing a field.

## Visual and shared-component decisions

Violet primary/selection/focus; neutral surfaces; separate semantic success/warning/error tokens; tabular financial numerals. Light/Dark/System use only local preference, with early theme initialization and OS changes. Existing Button/Input/Card/Label and native selects retained. Shared PageHeader, SectionHeader, IconButton, Badge, ActionToolbar, Empty/Error/Skeleton, responsive-list styling and native modal Dialog/Drawer avoid a new cosmetic dependency.

Native dialog `showModal()` supplies background inertness and focus containment; Escape/backdrop/close/navigation dismiss and restore focus. Destructive financial requests and conditions remain exactly those of the existing services. See [native dialog semantics](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

Quick actions use a non-sensitive `action=create` query flag to open existing account/movement/card/goal editors; closing consumes only this flag and preserves filters. No mutation happens from navigation.

## Acceptance and regression risks

All 16 authenticated base destinations plus three detail routes survive direct links/reload/back/forward. Search, active state, expandable groups, breadcrumbs, keyboard, modal focus, logout and mobile all covered. Light/Dark/System tested on public/private pages. Widths 320/375/390/768/1024/1440 checked with screenshots; 200% reflow/reduced motion included. Existing Auth and MDL2–10 financial assertions must remain intact; only legitimately changed UI selectors may change.

Risks: duplicate link labels, collapsed groups hiding test locators, focus restoration competing with route focus, semantic colors in dark mode, mobile modal/list overflow and query shortcuts reopening forms. Tests must address these without weakening financial assertions. Automated visual/keyboard checks do not certify a complete WCAG audit or replace human appearance/navigation approval.

## Delivery gate

Implementation/test results and screenshot evidence are recorded here at handoff. Only a DEV checkpoint is allowed. No final PR/merge, no COMPLETE aesthetics claim. Target: UIUX_V2_STATUS=AWAITING_REAL_GATE; REAL_GATE=PENDING; MERGED_TO_MAIN=false; MDL11_STATUS=NOT_STARTED.

## Verified implementation and visual evidence

Tested implementation: `744990adeb3c2dab5645ec286f5ada8ef19a9e7d`. Node 24.11.1 / pinned pnpm 11.19.0; official scripts run through the existing compact runner and Windows Node/pnpm entry-point fallback. Lint, typecheck, build, heuristic secret scan plus manual scope review, and harness PASS. Unit: 115 PASS. Integration: 83 PASS. Full browser suite: 137 PASS, one pre-existing duplicate mobile/tablet case skipped. Existing non-UI financial assertions are unchanged in all nine adjusted browser suites; helpers/selectors changed only to reach the actual new navigation and confirmation buttons.

Browser uses the real SDK and app against isolated deterministic Auth/API boundaries; the new navigation tests prohibit financial writes. No real recovery email, remote user, fixture or financial record was created. All 19 protected base/detail destinations pass direct navigation and reload. Public signup/recovery surfaces retain their existing behavior in dark mode. Back health/live and health/ready remained 200.

Screenshots were executed, not inferred: seven representative surfaces × six widths × two themes × desktop/mobile projects. Pre-change Home/Finance comparison comes from a Git archive of the exact baseline on isolated port 3104, without copying local env/session files. Artifacts remain ignored under `.harness/tmp/`; the test reproduces after-images without any external service. CI skips the optional local before-server comparisons but always runs the new theme/width checks.

Inspected examples: `uiux-before-desktop-1440-app.png`, `uiux-desktop-1440-light-app.png`, `uiux-mobile-390-light-app.png`, `uiux-desktop-768-dark-finance.png`, `uiux-mobile-390-dark-finance-cards.png` and `uiux-desktop-1440-dark-finance-safe-to-spend.png`. Desktop exposes clear tool groups instead of thirteen peer links; mobile retains touch-sized actions, a full modal tool menu and visible breadcrumbs. Safe to Spend emphasizes the official main amount without recomputing it.

Validated and corrected presentation issues: native modal search focuses the input only after showModal; async page headings receive route focus; mobile breadcrumbs stay visible; layout-shift assertions use document coordinates rather than automatic browser scroll. New confirmations require an explicit action, retain neutral failure feedback and preserve existing mutation services/conditions. Finder/drawer Escape, backdrop, navigation closure and focus restoration passed in real Chromium.

Changed areas: `src/navigation/*`, `src/theme/*`, `public/theme-init.js`, shared UI/dialog/form feedback, AppShell integration, Home/Finance presentation, create-form UI flags, financial confirmation/table wrappers, Playwright navigation helpers/new cases, unit/integration coverage, entry/theme CSS and documentation. SDK client/store/provider/guards, services/hooks/contracts, money/date helpers, dependencies/lockfile and the entire Back remain unchanged.

Remaining limits: appearance/ease of navigation await user approval; automated semantics/contrast/keyboard checks are not a full manual screen-reader or WCAG certification. The existing monolithic bundle warning remains (970 kB minified, 259 kB gzip); no cosmetic dependency or financial refactor was added to silence it. Responsive historical tables retain readable, keyboard-scrollable native tables rather than dropping columns.

Local product-design, architecture, testing, security and checkpoint skills guided reusable presentation, focus management, unchanged financial assertions, secret isolation and compact handoff. Full historical CSS consolidation is intentionally progressive, not a blind rewrite.

Human gate: open `http://localhost:3101`, login normally, locate Cards → Movements → Budget → Safe to Spend → an existing Debt → list → Goals → Profile. Try Ctrl/Cmd+K, sidebar groups/rail, Light/Dark/System, mobile/tablet More drawer, an existing form without saving, reload and logout. Approve or reject navigation ease, appearance, clarity and responsiveness. Do not create financial fixtures for this review. No final PR/merge or MDL11 starts before approval.
