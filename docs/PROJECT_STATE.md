# Project state

| Field | Value |
| --- | --- |
| MODULE | MDL 1F — Frontend Foundation & Identity |
| STATUS | READY_FOR_GATE_1_LOGIN |
| SCOPE | Frontend clean-room Auth preview; no cutover or MDL 2 |
| BRANCH | codex/mdl1f-auth-cleanroom |
| LAST_TESTED_COMMIT | 1da42e2ad4ca9b1dddbdd31567cc068fc4627fc6 |
| DONE | Independent `src/auth-v2/` login, signup, TokenHash confirmation/recovery, logout, protected routes and `GET /api/v1/me` preview. Old Auth remains intact in the default mode; preview runs with `--mode auth-v2`. Pre-change work saved in stash `019edaf1`. No real email sent |
| TESTS | Unit/integration 66; new browser desktop/mobile 18; legacy browser desktop/mobile 18; lint, typecheck, both builds, secret scan, harness PASS. Browser Auth/API responses mocked; real login not yet tested |
| LOCAL | Front `http://localhost:3101/login`; Back `http://localhost:3001` live/ready 200 with hosted DB and TLS `verify-full`. Back CORS for `localhost:3101` is process-only; no Back files changed |
| BLOCKERS | None for Gate 1. Remote email templates and real delivery remain unverified for Gates 2–3. Push deferred by scope and broken Git HTTPS helper |
| NEXT | Human: sign in once with the existing confirmed account at `http://localhost:3101/login`; confirm protected `/app`, owner/profile from `GET /api/v1/me`, then logout. Report results and stop. Do not request signup or recovery email before Gate 1 passes |
