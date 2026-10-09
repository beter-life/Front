# Project state

| Field | Value |
| --- | --- |
| MODULE | UI/UX Foundation V2 — approved blue/green identity and unified profile |
| DESIGN_ITERATION | V2.3_BLUE_GREEN |
| UIUX_V2_STATUS | LOCAL_REGRESSION_PASS_PENDING_PROMOTION |
| UIUX_HUMAN_VISUAL_GATE | PASS; user closure request records “O UX já ficou bem legal para fechar.” |
| REAL_GATE | PASS for the evaluated visual experience; final profile/security adjustment validated through automated boundaries |
| MERGED_TO_MAIN | false |
| READY_FOR_MDL11 | false; exact branch, PR and main CI are prerequisites |
| MDL11_STATUS | NOT_STARTED |
| BRANCH | codex/uiux-v2-navigation-foundation |
| BASELINE_FRONT_MAIN | 38d32a35f69ac79367ccf9f94fc65523ba669bb5 |
| BASELINE_BACK_MAIN | ca6746c83483d70c69bdfaf31137db6c74546d04; MDL10 merged in Back PR8; main CI37790612267 PASS; historical Back snapshot predates merge |
| LAST_TESTED_COMMIT | 64d58b21f55435a334c083b53929e319d1a80488; final profile/security implementation and tests passed local regression. Closure handoff commit changes documentation only; exact published HEAD CI is required before promotion |
| DESIGN_SYSTEM | Blue actions, green brand, neutral Light/Dark/System; shared full-width surfaces, bounded form grids, 24px content stacks, accessible native-field calendar adapter and visible standard scrollbars |
| NAVIGATION | One account destination: Meu perfil. Personal-data/security tabs, explicit selected state, arrows/Home/End, URL persistence. Search aliases open /profile?tab=security. Protected /account/password redirects with replace. Breadcrumbs and active Meu perfil state retained; Security removed from sidebar/mobile/account menu |
| AUTH_PRESERVATION | Original newPasswordSchema/updateUser/pending guard/feedback/reset/session behavior reused in PasswordChangeFormV2. No SDK/session/provider/guards/recovery change; public Forgot Password unchanged. Password tests are synthetic, not a real user password change |
| FINANCE_PRESERVATION | No financial handlers/calculations, API clients/contracts, Back, Supabase, migrations, hosted data or env files changed by UI closure |
| TESTS | 131 unit, 91 integration and 179 browser PASS; three existing exclusions retained. Focused profile/auth browser8 PASS plus final settled profile captures2 PASS desktop/mobile. Lint/typecheck/build/secret scan/harness PASS; Auth V2/Finance/Safe to Spend regression retained |
| COMMANDS | Official pnpm lint,typecheck,test,test:integration,test:e2e,build,security:scan,harness via compact runner; focused profile/auth boundaries first |
| LOGS | Ignored .harness/logs: unit17-05-30-806Z, integration17-05-31-296Z, focused browser17-06-11-929Z, full browser17-08-01-496Z, lint17-05-30-384Z, typecheck17-05-30-793Z, build17-05-30-425Z, scan17-05-30-055Z, harness17-05-30-795Z (2026-10-09) |
| VISUAL | V2.3 gallery128 real before/after pairs plus54 extras retained. New profile Security desktop/mobile Light/Dark captures inspected under ignored .harness/tmp/profile-security-*.png. No global redesign |
| CI_FRONT | Prior V2.3 run37960853065 PASS on b992fcb; closure HEAD CI pending |
| UIUX_PR | Not created yet; required title feat(ui): complete UI/UX foundation v2, base main, merge method merge commit |
| UIUX_PR_CI | PENDING |
| UIUX_MAIN_CI | PENDING |
| CHECKPOINT | DEV review tag checkpoint/uiux-v2-blue-green-review-2026-10-09 preserved. COMPLETE tag checkpoint/uiux-v2-navigation-foundation-complete-2026-10-09 only after exact closure branch CI PASS |
| LOCAL_APP | Front localhost:3101 and Back localhost:3001; ignored env files preserved |
| LIMITATIONS | Chromium/emulated mobile; no screen-reader/WCAG/physical-device/Safari/Firefox certification. Native month/OS scrollbars; small calendar cells36px; existing bundle warning>500kB |
| BLOCKERS | Branch/PR/main CI pending; no local regression blocker |
| NEXT | Push closure without force, verify exact HEAD CI, publish COMPLETE checkpoint, create/attach PR, verify PR CI/conflicts, merge commit and validate main CI. Reconcile final documentation and retest any new main commit. Only then create MDL11 branches. Stop if PR/merge/main CI fails |
