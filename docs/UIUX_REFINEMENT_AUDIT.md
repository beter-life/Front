# UI/UX V2.3 — refinement audit

Baseline `cca341754e6177ea8b76a75b96cb43337b07f143`, branch `codex/uiux-v2-navigation-foundation`. Preserve prior V2.2 commits/checkpoints. This addresses blue/green, widths, scrollbars, rail, calendars, recovery and content. The initial V2.3 paste contains text without its two referenced images. The subsequent Budget screenshot was received and inspected: it informed the editor/collection correction below. Reproduced defects in isolated application captures and preserved prior visual evidence.

## Research

Exa: three complementary searches, 15 results, covering accessible calendars, native input integration and standard scrolling/accessibility. Primary references and applied decisions:

- [DayPicker](https://daypicker.dev), [accessibility](https://daypicker.dev/guides/accessibility), [input integration](https://daypicker.dev/guides/input-fields), [localization](https://daypicker.dev/guides/translation): maintained keyboard grid and explicit native field adapter. Compared [React Aria DatePicker](https://react-spectrum.adobe.com/react-aria/DatePicker.html); chose calendar-only integration to preserve financial conversions.
- [WAI-ARIA date-picker dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/): modality, initial day focus, arrows, Enter/Space, Escape/focus return. Automated operations pass; screen-reader certification is not claimed.
- [MDN scrollbar-color](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color), [width](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-width), [gutter](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter): standards, usable targets, forced colors, stable classic gutters, isolated WebKit fallback.
- [Atlassian spacing](https://atlassian.design/foundations/spacing), [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): shared scale; meaningful text/control/focus boundaries distinct from decorative borders.

GitHub read-only observed published UI branch `e911ac9`; this does not establish CI for new local changes. Supabase/Auth SDK/configuration/hosted data remain untouched. Sites considered for existing local preview only; no hosting project/deployment. No OpenAI API features/credentials introduced into this UI task.

## Findings and corrections

| Area | Cause and correction |
| --- | --- |
| Consecutive panels | 800px `:has(form)` and 840px Safe caps narrowed only editors. Shared full-width outer surfaces plus bounded internal grids; actual Movements left/right edges measured. |
| Fields/filters | Semantic two-column groups, one mobile column. Dates/actions complete Movements second filter row. Profile three proportionate columns; passwords two. Compact numbers bounded. |
| Budget allocation feedback | User screenshot exposed an editor touching the category collection and an oversized money field. Shared24px content stack, compact adaptive field grid (amount280px/selects320px), full-width single category. Creation/edit/cancel measured in six widths and both themes; no financial write. |
| Identity | Blue actions/focus/selection, green brand/today, neutral surfaces at the token source. Dark buttons have dark text. Financial/status semantic colors and labels preserved. |
| Scrollbars | Normal standard width/stable theme gutters; isolated fallback/system forced colors. Sidebar independent flex/min-height scrolling. Snapshots explicitly retain scrollbar rendering. |
| Rail | 96px accommodates classic gutters and 44px targets. Explicit flex centering fixes logout offset. Portaled tooltips reposition on focus-induced scroll. Icon center spread <=1px. |
| Calendar | DayPicker10.0.2 lazy grid. Native field authoritative. Fixed warm-load focus relative to showModal so Space selects the day rather than closing. Preserves civil date/time/bounds. |
| Financial Calendar | Shared appearance; same monthly projections, filters/currencies and warnings. No recurrence/ledger write. |
| Forgot | Compared initial Auth V2 green composition and V2.1 red centered/compact. User chose V2.1; restored 420px centered layout/padding only, with current neutral recovery handlers. |
| Content | Functional titles/empty states, concise subtitles, removed decorative module/auth slogans, localized yield history. Critical distinctions and destructive confirmations remain visible. |

## Preservation and dependency

Read-only TypeScript AST comparison against `cca3417`: unchanged submit/change/mutation handlers in **15 affected finance/auth/profile files**. Protected API clients/contracts/hooks, Auth V2 SDK/session/provider/guards/login/signup/recovery/confirmation, money/date helpers untouched. Back has no local code changes. Env contents never printed/committed; ignored local files preserved. No migration, remote auth/configuration write, production financial fixture or force push.

Only `@daypicker/react`10.0.2 added with exact pin/lock integrity, compatible React peer and MIT license. Reviewed calendar and date-fns/timezone dependencies. Lazy calendar **23.02kB gzip JS +1.63kB gzip CSS**, loaded on first opening. Existing main bundle ~261kB gzip still warns above its chunk threshold.

All prior financial/auth assertions retained. Expected headings/palette/tooltip semantics and exact date-field selectors follow the requested UI. Old 840px surface assertion replaced by stronger left/right alignment; compact reserve-field limit retained. Three pre-existing optional/duplicate exclusions remain: two baseline-server captures, one mobile duplicate of desktop tablet coverage. No new skips.

## Evidence and checks

Unit129/integration88/browser175 passed; lint/typecheck/build/security scan/harness passed. Final Budget grid inspection prompted a responsive fitting correction, followed by two dedicated desktop/mobile cases across all six widths and both themes, also PASS. Exact tested commit/logs in [PROJECT_STATE](PROJECT_STATE.md). Focused checks: FormData/reset/React Hook Form, exactly one controlled change, time suffix, civil month/DST, profile timezone today, min/max keyboard navigation, dialog focus/Escape, neutral recovery and six-width containment.

`.harness/tmp/blue-green/review.html` contains **128 real before/after pairs** from local V2.2: 1440/390px, both themes, all destinations, three details, nine editor families, four public routes. Extras: six-width Movements/date pickers/Budget creation and editing, rail/expanded menu, scrollbars, recovery and V2.1 references. Budget views start at the top before capture to avoid displaced fixed headers in full-page images. Logs/images/contact sheets ignored, not committed. Reproduce after captures with `UIUX_CAPTURE_DIR=.harness/tmp/blue-green pnpm test:e2e` (PowerShell environment assignment on Windows).

Opened and inspected actual contact sheets/full representative PNGs in Light/Dark desktop/mobile: Home/overview, Movements/filter/editor, Accounts, Budget, Goals/details/editors, Recurrences/Calendar, Net Worth/Yield, Cards/Debts/details/editors, Safe results/settings, Profile/security, Categories and public auth. Review informed rail/focus/filter corrections. Selected comparisons: `compare-form-movements-dark.png`, `compare-home-dark.png`, `compare-form-safe-settings-dark.png`, `compare-forgot-password-dark.png`. Historical recovery is separately labeled; composition restoration, not legacy Auth rollback.

## Handoff and limits

Front3101/Back3001 remain available for real human review. Back is published MDL10 main; user previously confirmed Safe to Spend opens after synchronization. Automation uses isolated Auth/API fixtures, never the live financial session.

Automated accessibility covers names/roles, keyboard/focus, text/control contrast, forced colors, reduced motion and six-width reflow. No full screen-reader/WCAG/physical-device/Firefox/Safari certification. Month popups/standard scrollbars follow browser/OS; small calendar cells36px. Existing main-bundle warning remains. Exact commit/checkpoint/CI/publication in current snapshot. Human aesthetics pending; no final PR/merge/MDL11.

```text
UIUX_V2_STATUS=AWAITING_REAL_GATE
REAL_GATE=PENDING
MERGED_TO_MAIN=false
MDL11_STATUS=NOT_STARTED
```
