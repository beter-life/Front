# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | COMPLETE |
| SCOPE | Frontend Auth V2 final cutover; MDL 2 not started |
| BRANCH | codex/mdl1f-auth-cleanroom |
| LAST_TESTED_COMMIT | 62e140e719f5225f2db3c450737c6f443b0ff48d |
| GATE_1_LOGIN | PASS |
| GATE_2_SIGNUP_CONFIRMATION | PASS |
| GATE_3_PASSWORD_RECOVERY | PASS |
| LOGIN | PASS |
| SIGNUP | PASS |
| EMAIL_CONFIRMATION | PASS |
| SESSION | PASS |
| PROFILE | PASS |
| LOGOUT | PASS |
| AUTHENTICATED_PASSWORD_CHANGE | PASS |
| PASSWORD_RECOVERY | PASS |
| RECOVERY_PASSWORD_UPDATE | PASS |
| EVIDENCE | Real Auth flows manually approved by the user on 2026-10-01. Final regression uses the installed SDK with intercepted Auth/API transport; no new real email sent |
| DONE | Auth V2 is the default entry point; legacy Auth, preview switch and temporary diagnostics removed. Full profile editor and protected password change connected to V2; private cache cleared on logout/identity changes |
| TESTS | Unit/integration 25; browser desktop/mobile 22; lint, typecheck, build, secret scan and harness PASS. Includes protected routes, session reload, logout, owner mismatch, profile persistence, password change and login after recovery |
| API | Read profile via `GET /api/v1/me`; write via `PUT /api/v1/me/profile`. Separate `GET /api/v1/me/profile` does not exist; using `/me` was explicitly approved |
| LOCAL | Front `http://localhost:3101`; Back live/ready 200 with hosted DB and TLS `verify-full`. No Back files, database, RLS, SMTP or Supabase configuration changed |
| CHECKPOINT | Pre-cutover tag `checkpoint/auth-v2-pre-cutover-2026-10-01`; final tag `checkpoint/mdl1f-auth-v2-complete-2026-10-01`. Prior stash `019edaf1` preserved |
| BLOCKERS | None. Git HTTPS helper read-only check passed |
| READY_FOR_MDL2 | true |
| NEXT | Deliver the final checkpoint report and wait for explicit MDL 2 instructions |
