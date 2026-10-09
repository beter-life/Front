# UI/UX Foundation V2.3 — Blue and green

## Scope

Continue `codex/uiux-v2-navigation-foundation` from local `cca341754e6177ea8b76a75b96cb43337b07f143`, preserving existing V2.2 work and checkpoints. Published branch HEAD observed through GitHub is `e911ac936571d2797f5d27b7f88332775becb4ac`. MDL0–10 remain integrated; Back main is `ca6746c83483d70c69bdfaf31137db6c74546d04`.

Presentation, navigation tooltips and calendar interaction only. Auth V2 SDK/session/provider/guards/cache, services, generated contracts, financial handlers/calculations, backend, Supabase, migrations and real data are preserved. The production dependency addition is the pinned calendar library below. Evidence: [refinement audit](UIUX_REFINEMENT_AUDIT.md).

## Color and components

`styles.css` owns shared tokens, controls, surfaces, focus and scrollbar/calendar styling; `uiux-v2.css` owns shell/public/Home composition; `finance.css` owns financial layouts. Modify these sources instead of adding competing overrides.

| Role | Light | Dark |
| --- | --- | --- |
| Background / text | `#f7f9fc` / `#1e293b` | `#0f172a` / `#f1f5f9` |
| Card / field | white / white | `#192334` / `#141f30` |
| Primary / text | `#1d4ed8` / white | `#60a5fa` / `#0f172a` |
| Brand green | `#0f766e` | `#2dd4bf` |
| Decorative border / field boundary | `#e2e8f0` / `#7a8798` | `#334155` / `#8191a7` |
| Secondary text | `#596b80` | `#cbd5e1` |

Blue identifies actions, links, focus and selection. Green supports brand/today. Neutrals occupy most surfaces. Income/success, expense, warning, error/destructive and information retain separate semantic tokens, text and icons. Action aliases resolve to primary tokens; dark actions require dark text. Light/Dark/System remain local preferences; System follows OS updates.

Use spacing 4/8/12/16/24/32/48px, 12px card and 10px control radii, 48px fields, buttons at least 44px, visible 2px focus and reduced motion. Tables retain exact accessible values and contained horizontal scrolling.

## Layout patterns

| Pattern | Purpose |
| --- | --- |
| `PageContainer` | Main landmark, shared gutters, centered maximum 1280px |
| `PageHeader` | Functional title, necessary description, contextual actions |
| `ContentSection` | Full-width section that can shrink within a grid |
| `FullWidthPanel` | Shared financial surface/padding/border/radius |
| `FormPanel` | Full outer surface; internal fields control their widths |
| `FormGrid` / `FormSection` | Two-column semantic groups; one below 720px |
| `FilterPanel` | Shared filter surface and responsive grid |
| `SummaryGrid` | Responsive metrics or currency summaries |
| `DataSection` | Full-width records/listing surface |

Consecutive creation, filter and record panels share outer edges. Removed the `:has(form)` 800px cap and Safe settings 840px cap. Existing Card/native section adapters use shared surface tokens. Collections may intentionally use multiple columns; Categories intentionally presents editor/records side by side. Do not limit an outer surface because it contains fewer fields.

Use `ContentSection` with `ui-content-stack` for consecutive header/editor/records: 24px gaps, without adding panel margins to the grid gap. `FormGrid` with `ui-form-grid-compact` bounds controls at 320px (decimal amount280px), fits three fields on a wide desktop and wraps as space permits. Budget allocations reuse these patterns; a single category fills the records area, while multiple categories share an adaptive grid. Creation, editing and cancellation keep the same financial inputs and handlers.

Movements uses sectioned two-column fields and a three-column filter grid; dates/actions complete its second row. Numeric fields remain bounded. Profile uses three balanced desktop columns/one mobile; passwords use two/one. Accounts, Budget, Goals, Recurrences, Net Worth, Yield, Cards, Debts and Safe to Spend retain names/validation/actions. Keep compact error/feedback reservations where tested flows require stable controls; general empty feedback collapses.

## Navigation and scrolling

Seven everyday destinations remain direct; Planning and Patrimony remain secondary accordions. Routes, details, breadcrumbs, finder, shortcuts, account actions, mobile drawer/bottom navigation remain available. Ctrl/Cmd+K excludes editing fields and searches page names only.

The rail is 96px so 44px targets fit beside normal classic scrollbar gutters. Brand/collapse/navigation/profile/security/logout icons share an axis. Internal navigation scroll remains separate from the page. Labeled tooltips use a portal outside its clip, expose `aria-describedby` and reposition during focus-induced scrolling.

Use standard `scrollbar-color`, normal `scrollbar-width:auto`, stable gutters. Standard-capable browsers use this path exclusively; a rounded 12px WebKit fallback is isolated by `@supports not`. Root/navigation/dialogs/finder/tables/menus inherit theme colors. Forced colors restores system colors. Never hide scrollbars; OS overlay preferences remain authoritative. Browser snapshots retain scrollbar rendering.

## Date controls

Use shared `Input` for `date`/`datetime-local`; it selects `DateInput` automatically. Supply meaningful `calendarLabel` for raw/wrapped fields when their label cannot be inferred. Other input types remain native.

`@daypicker/react` **10.0.2** supplies the mature localized keyboard grid, selected/today/disabled states and month navigation. Chosen over a larger date-field framework to retain existing native fields and financial conversions. MIT, compatible React peer range, pinned manifest/lock integrity. Lazy build cost: JS **80.45kB /23.02kB gzip**, CSS **7.96kB /1.63kB gzip**.

Modal dialog with accessible title/format description. Arrows navigate; Enter/Space selects; Escape closes; focus returns to the field. Cold/warm calendars receive the same initial day focus. Month bounds/unavailable days honor min/max. At 320/375px day cells are 36px; larger widths use 44px. Locale selects pt-BR/en-US/es; today uses the profile timezone.

Native ref/name/required/min/max, controlled/uncontrolled value, React Hook Form, FormData/reset and mobile hour entry remain. Values are civil strings, without UTC parsing. `datetime-local` preserves the hour/minute/second suffix; blank values start at 00:00. Selection emits native events once and never submits. API timestamps, timezone conversion, financial DST helpers and inclusive/exclusive intervals are unchanged. `month` inputs retain functional native fallback; OS popups cannot be themed uniformly.

Financial Calendar retains server projections, filters, currencies, civil month boundaries and the warning that projected net is not available cash. Calendar interaction creates no transactions.

## Recovery and content

User chose **V2.1 compact centered** after comparing two historical compositions. Only `/forgot-password` restores vertical centering, maximum 420px and compact 44px desktop/36px mobile padding in the new colors. Feedback reservation preserves validation stability. Auth V2 request/neutral response/callback/token/session/password update/error handlers are unchanged. Composition restoration, not pixel-identical legacy code.

Titles name functions; subtitles explain necessary tasks. Home is “Início”; auth headings are “Entrar”, “Criar conta”, “Recuperar senha”, “Nova senha”. Accounts/Movements/Goals/Recurrences empty states name what is missing and point to a contextual action. Decorative module/auth slogans are removed. Yield history uses Portuguese while retaining estimated-versus-confirmed, composition, minimum savings balance, no reinvestment and bank-payment limitations. Critical warnings/confirmations remain, including Safe to Spend, projections, eligibility, cancellation and terminal archival.

## Validation and handoff

Run all official lint/typecheck/unit/integration/browser/build/security/harness scripts. Geometry checks measure outer edges, grid reflow and rail icon centers; other tests cover keyboard/focus/tooltips/scrolling, theme/contrast/forced colors, native form contracts, timezone/month/DST and neutral recovery. No new skips; financial assertions retained. Obsolete palette/copy/width assertions now verify requested UI and actual alignment.

Ignored `.harness/tmp/blue-green/review.html` holds 128 real V2.2/V2.3 pairs, plus six-width movement/calendar screenshots, expanded/collapsed sidebar, scrollbars and historical V2.1 recovery. Fixtures only. Exact final results/commit/checkpoint: [PROJECT_STATE](PROJECT_STATE.md).

Limits: Chromium desktop/mobile emulation; no Safari/Firefox/physical-device or screen-reader certification. Native month popups/scrollbars follow browser/OS. Existing main-bundle warning remains. Front3101/Back3001 stay available for the human gate. No final PR/merge/MDL11.

```text
UIUX_V2_STATUS=AWAITING_REAL_GATE
REAL_GATE=PENDING
MERGED_TO_MAIN=false
MDL11_STATUS=NOT_STARTED
```
