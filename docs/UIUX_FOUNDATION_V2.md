# UI/UX Foundation V2.2 — comprehensive refinement

## Entry gate and scope

MDL10 human gate PASS. Back main `ca6746c83483d70c69bdfaf31137db6c74546d04` ([CI](https://github.com/beter-life/Back/actions/runs/37790612267)); Front merged baseline `38d32a35f69ac79367ccf9f94fc65523ba669bb5` ([CI](https://github.com/beter-life/Front/actions/runs/37790545926)). This refinement starts from clean UI branch HEAD `74158e155843bca3529899337083c16e8859e6b2`, preserving earlier commits/checkpoints.

Presentation and navigation only. Auth V2 SDK/session/provider/guards, isolated cache, clients/contracts/hooks, financial request/calculation handlers, Back, Supabase/RLS, migrations, real data and dependencies are preserved. No MDL11. Detailed inventory, research, decisions and evidence: [refinement audit](UIUX_REFINEMENT_AUDIT.md).

## Navigation

Seven direct everyday destinations: Home, overview, movements, accounts, cards, budget, Safe to Spend. Two secondary accordions: Planning (calendar, recurrences, goals), Patrimony (net worth, yield). More exposes debts/categories directly; profile/security/logout remain at the bottom. The active secondary group opens automatically. Rail retains accessible names and local preference.

Mobile keeps Home/Finance/Movements/Planning/More and the complete modal drawer. Local page finder matches route labels/aliases, never private financial data; Ctrl/Cmd+K excludes field editing. Breadcrumbs omit UUIDs. All 16 base destinations and three detail routes remain available through direct links, reload and existing history navigation. Create shortcuts open existing editors and do not submit requests.

## Design system and layouts

`styles.css` is the sole palette/geometry and shared component source; `uiux-v2.css` owns shell/home; `finance.css` owns financial layouts. Legacy overlapping selectors were removed. Red identity is restrained; income/expense/warning/info/error keep their distinct meanings. Light/Dark/System preference remains local and follows OS updates.

- Neutral light/dark surfaces; dark `#141518` background, `#1d1f23` card, `#30343a` decorative border and `#707780` field boundary. Primary white-on-deep-red actions use `#b91c1c`; dark links/focus use `#e05d5d`.
- Spacing 4/8/12/16/24/32/48px; 12px card and 10px control radii; shared 1px boundaries and 2px focus. Controls 48px, buttons at least 44px; explicit primary/secondary/ghost/destructive variants.
- Bounded editors (usually 800px; Safe settings 840px); two-column semantic fieldsets become one column on mobile. Cancel/save sit beside final fields. General feedback appears below actions without empty 64–96px blocks. Only inline profile validation and the existing stable Safe settings feedback reserve space; validation does not move actions.
- Shared labels/help text, aligned native/shared fields, themed progressive native pickers with classic fallback. CardField has explicit label IDs and retains native inputs/FormData.
- Compact Home essentials/tool groups; structured per-currency summaries; three-column metrics becoming two/one on small screens; exact monetary values with tabular numerals. Charts, status meaning and table data remain intact; tables use contained horizontal scrolling.
- Native modal confirmations retain inertness/focus restoration; destructive actions have explicit styling. Mobile scroll padding reserves sticky header/footer space. Loading/error/empty states preserve status/alert semantics.

Shared page/section spacing is 16/24px, with 32px for structural separation. Home essentials are 112px minimum instead of oversized 132px cells. Movement type selectors share height and distribute width while retaining enough room for their labels at 320px. Mobile action footers wrap entire buttons when needed rather than breaking their labels into uneven button heights. Public forms start at a stable top offset, so adding feedback does not shift a vertically centered form.

Every finance module and its existing editors, profile/security and public auth forms use the shared hierarchy. Safe results are temporarily hidden during configuration editing and restored on cancel/save; account eligibility, reserve and planning handlers are unchanged. Labels describe existing values; no new aggregation or financial formula.

## Validation and delivery

Official local gates PASS: lint, typecheck, unit (117), integration (84), full browser (161), build, heuristic secret scan plus manual scope review, harness. Browser contains three unchanged pre-existing optional/duplicate exclusions; new tests add no skips and retain financial assertions. Tests cover widths 320/375/390/768/1024/1440, light/dark, keyboard/focus, native-picker selection, stable feedback, reload, modal/rail/drawer, theme persistence, zoom/reduced motion and financial/auth regressions.

The isolated Auth/API boundary produces 128 before and 128 after screenshots without real mutations. Actual images were inspected and used to correct remaining details. Local gallery: `.harness/tmp/refinement/review.html`; selected real pairs: `compare-home-dark.png`, `compare-form-cards-dark.png`, `compare-form-safe-settings-dark.png`. Images/logs are ignored; after-images are reproducible through `tests/e2e/refinement.spec.ts`.

Front runs on localhost:3101. The local Back checkout was still on MDL9 `6e8b8bd` and lacked Safe to Spend routes; after the user's report it was fast-forwarded to the already published MDL10 main `ca6746c`, with no local backend edits, dependencies changed, migrations executed or env changes. The restarted Back on 3001 returns 200 for `/api/v1/health/live` and `/api/v1/health/ready`; MDL10 routes require authentication (401, replacing missing routes). A catalog-only query confirmed both Safe tables exist with RLS. The user confirmed the page opens after reload. Live authenticated aesthetics remain the user's next gate, distinct from isolated browser regression. Exact implementation commit and delivery status: [PROJECT_STATE](PROJECT_STATE.md). Branch [CI](https://github.com/beter-life/Front/actions?query=branch%3Acodex%2Fuiux-v2-navigation-foundation) must pass on the delivered HEAD.

Limits: Chromium desktop/mobile emulation, not full browser/device or screen-reader certification. Native fallback depends on browser/OS; existing single-bundle size warning retained. Visual approval is pending.

```text
UIUX_V2_STATUS=AWAITING_REAL_GATE
REAL_GATE=PENDING
MERGED_TO_MAIN=false
MDL11_STATUS=NOT_STARTED
```

No final PR/merge before user visual approval.
