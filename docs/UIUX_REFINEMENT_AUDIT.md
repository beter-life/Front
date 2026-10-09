# UI/UX V2 — comprehensive refinement audit

Baseline: `74158e155843bca3529899337083c16e8859e6b2`, branch `codex/uiux-v2-navigation-foundation`, initially clean. All prior commits and checkpoint tags remain intact. Human aesthetics were rejected; this work continues with `AWAITING_REAL_GATE` / `PENDING`, without a final PR, merge, or MDL11.

## References and inventory

The seven supplied crops expose theme-inconsistent native pickers/date controls, uneven card proportions, weak form grouping, excessive vertical space, and competing outlines. They are examples of problems, not new financial requirements. The audit inspected routing, shell, all finance pages and editors, public forms, profile/security, shared components, status/error/empty states, and Light/Dark styling before implementation.

Before captures use the existing isolated API/auth boundary, never a production session. `refinement.spec.ts` captures every protected destination, three detail routes, nine editor families, and four public routes at 1440/390 in both themes. An earlier representative capture also covers 768. Images are retained under ignored `.harness/tmp/refinement/before-*` and `.harness/tmp/crimson/before-*`.

| Area / routes | Observed issue | Correction plan |
| --- | --- | --- |
| Shell, sidebar, rail, finder, mobile drawer | Accounts/Cards require an accordion; three secondary groups compete with everyday destinations; header controls differ from forms | Seven direct everyday destinations, two secondary accordions, clear active identity; unified controls and touch targets; keep all routes/search/breadcrumbs |
| Home | Large equally bordered cards, repeated actions, large empty tool panels | Compact icon/text hierarchy, quieter surfaces, balanced essential links and tool groups |
| Finance overview, Accounts, Categories, Movements | Separate Card/panel styles; repeated title/action rows; filters fill arbitrary columns; editor actions detached | Shared surfaces and headers, bounded editors, structured filter/actions row, consistent lists and money alignment |
| Budget | Dense category totals, scattered month/actions, varying progress/status geometry | Aligned period toolbar, common summary/metric spacing, compact readable category cards; retain rollover and pace semantics |
| Goals and goal detail | Seven equally emphasized metric cells in one line, multiple primary buttons, ungrouped editor | Stable metric grid, explicit primary/secondary hierarchy and grouped form sections |
| Recurrences and Calendar | Long three-column form with no semantic sections; filter and form labels use different styles | Two-column sectioned editors, shared field tokens, compact filters, readable projected agenda |
| Net Worth and Yield | Dense disclaimers, full-width simple controls, inconsistent table headers/numbers | Bounded controls/editors; clear real-versus-estimated labels; right-aligned financial table values, preserved exact accessible data |
| Cards/Debts and details | Full-width editors, blank help rows, large pre-action gap; mobile metrics are an excessively long one-column stack; summaries are prose | Sectioned editor surfaces, adjacent cancel/save; compact metric grids, structured per-currency summaries, preserve every financial field |
| Safe to Spend | Result/settings mixed at the same emphasis, ten uniform breakdown blocks, redundant actions while editing | Bounded settings and stable actions, clear conservative headline, calmer calculation breakdown, preserve account eligibility/checkbox/FormData semantics |
| Profile / account security | Large blank validation slots, detached form actions; password form is visually different | Shared fields, explicit action footer, reserved but compact feedback; retain Auth V2 handlers |
| Login, Signup, Recovery, Confirmation | Oversized brand story and unnecessary blank field slots; validation shifts submit | Refined public composition, consistent field/button geometry, stable feedback, unchanged public auth responses |
| Loading / error / empty / confirmation dialogs | Plain loading paragraphs versus skeleton, varied empty copy/layout and destructive styling | Consistent presentation with accessible status/alert semantics, clear contextual confirmation hierarchy |

## Execution and boundaries

A: capture and inspect current pages. B/C: centralize tokens, variants, fields/surfaces/forms, remove conflicting selectors rather than append overrides. D/E: refine navigation and apply page hierarchy across every module. F: inspect real before/after PNGs, including forms, mobile, theme, and dialogs; repair remaining visual defects. G: official lint/typecheck/unit/integration/browser/build/secret/harness gates.

The UI implementation does not edit API/service/hook/generated DTO/money/date calculations, auth session/provider/guards, backend logic, Supabase/RLS, migrations, dependencies or real financial records. The user's later runtime report also required synchronizing the local Back checkout with already published MDL10; see operational verification below.

Guidance: [Atlassian spacing](https://atlassian.design/foundations/spacing), [Radix select accessibility and behavior](https://www.radix-ui.com/primitives/docs/components/select), [Material text fields](https://m3.material.io/components/text-fields/overview). Selects retain native semantics; [MDN customizable selects](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) guides progressive picker styling with a classic native fallback.

## Final research and corrections — 2026-10-09

The user requested another Exa review before delivery and specifically quieter dark borders. Three targeted Exa searches reviewed 15 results across borders/elevation, fields/native pickers, and focus/reflow. Primary design-system and browser/W3C sources were preferred; research is guidance, not an accessibility certification.

| Evidence | Applied decision |
| --- | --- |
| [Atlassian border](https://atlassian.design/foundations/border), [elevation](https://atlassian.design/foundations/elevation), [tokens](https://atlassian.design/components/tokens/all-tokens) | Separate decorative dividers from interactive field boundaries. Dark surface `#1d1f23`, divider `#30343a`, control `#1a1c20`, field boundary `#707780`; 1px decorative borders, restrained shadows and explicit 2px keyboard focus. No blue/purple decorative outlines |
| [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | Keep identifying field boundaries and focus visible against adjacent surfaces. Decorative separators can remain quiet; readable labels and buttons do not rely exclusively on color |
| [MDN customizable selects](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) | Native controls retain FormData/keyboard semantics. `@supports (appearance:base-select)` styles the picker progressively; classic native fallback and `color-scheme` remain. Explicit label IDs avoid accessible names including every option |
| [W3C focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) | Mobile scroll padding accounts for sticky navigation; dialog/finder/drawer focus tests remain. Touch controls have at least 44px height |

Visual inspection found and fixed the desktop menu button incorrectly appearing beside the rail; picker chevrons sitting below their fields; inconsistent label line heights between shared/native fields; oversized editor widths; blank help rows; seven-metric orphan cells; unstructured currency summaries; detached cancel/save actions; and public validation moving the submit button. Card/debt fields now use explicit accessible labels. Form sections and final action footers are shared; validation/submission handlers remain unchanged.

The user's all-page spacing feedback prompted a second density pass: general empty feedback rows now collapse, while inline profile errors and Safe settings keep the reservation required to retain stable controls. Public forms use a stable top offset instead of centering their changing height. Forms/metrics/dialog spacing is regularized to 16/24px; Home essentials are smaller; movement selectors align their heights and responsive widths; whole action buttons wrap when labels cannot fit. Existing validation assertions were retained and detected the initial public-centering displacement; the layout was corrected and the targeted public validation passed in desktop/mobile.

The palette and shared component styles live in `styles.css`; shell/home in `uiux-v2.css`; financial layouts in `finance.css`. Financial CSS was moved out of its former mixed source and conflicting selectors were removed, rather than accumulating override files. No library or lockfile change.

## Executed visual and regression evidence

Actual before/after PNGs were opened and inspected for Home, overview, accounts/categories/movements, budgets, goals/detail, recurrences/calendar, net worth/yield, cards/debts/details/editors, Safe to Spend/settings, profile/security and public forms, including light/dark and mobile. The isolated visual inventory produces 128 images before and 128 after; representative captures additionally cover tablet/rail/drawer. Six-width geometry checks cover every protected destination and nine editor families in both themes. New tests also exercise native-picker keyboard selection and stable public validation. All new audit tests assert no financial writes where applicable.

Local evidence is ignored and never committed: `.harness/tmp/refinement/review.html` contains all 128 real pairs; `compare-home-dark.png`, `compare-form-cards-dark.png`, `compare-form-safe-settings-dark.png` show selected comparisons. `refinement.spec.ts` reproduces the after inventory without production credentials. Human gate may use the existing local login/session; automation uses isolated boundaries only.

Official local results: lint/typecheck/build/security scan/harness PASS; 117 unit and 84 integration PASS; 161 browser PASS in Chromium desktop/mobile (8.1 minutes). A final 26-case visual/form/width regression passed after the last responsive action-label adjustment and refreshed the captures. Three pre-existing exclusions in the full suite remain unchanged: two optional earlier-baseline server captures when `UIUX_BASELINE_URL` is absent, and a duplicate mobile/tablet case covered in desktop. The new inventory captures before/after separately and adds no skips. No financial assertion was removed or weakened. Complete repeated browser log: `.harness/logs/2026-10-09T12-23-10-498Z-node.log`; final visual/geometry run: `.harness/logs/2026-10-09T12-31-59-048Z-node.log`; public validation/captures after the anchoring correction: `.harness/logs/2026-10-09T12-22-28-068Z-node.log`.

A read-only TypeScript AST scope check compared affected financial/auth submit handlers to baseline and confirmed unchanged bodies. Protected Front client/contracts/hooks, Auth SDK/session/provider/guards, money/date helpers and package/lockfile remain untouched. No local Back code edit, migration, dependency install, remote auth action or real financial mutation was performed.

## Operational verification

The local Back was on MDL9 `6e8b8bd`, despite MDL10 already being integrated in remote main. This caused Safe to Spend's missing endpoints. `git fetch origin` followed by `git merge --ff-only origin/main` synchronized it to `ca6746c83483d70c69bdfaf31137db6c74546d04`. The `.env` hash remained identical and the dependency manifests were unchanged; only the server launched in this session was restarted. No backend commit or push.

Read-only live checks returned 200 for Back `/api/v1/health/live` and `/api/v1/health/ready` on 3001 and Front `/finance/budgets` on 3101. Safe to Spend/settings endpoints now return the expected 401 without a bearer token instead of 404. A catalog-only query confirmed both published Safe tables exist with RLS enabled, so no migration was needed. The user explicitly confirmed the authenticated Safe to Spend page opens after reload.

Limits: automated browser verification is Chromium, including mobile emulation; full screen-reader, Firefox/Safari and WCAG certification are not claimed. Older native pickers may follow browser/OS presentation. The existing large single-bundle build warning remains. Financial tables intentionally scroll inside their containers. Aesthetics require user approval; `UIUX_V2_STATUS=AWAITING_REAL_GATE`, `REAL_GATE=PENDING`, `MERGED_TO_MAIN=false`, `MDL11_STATUS=NOT_STARTED`.
