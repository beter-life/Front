# MDL7 — Rendimentos

Protected `/finance/yield` presents estimates from Back. Auth V2, existing private
cache/transport and financial modules remain unchanged. No Front financial engine,
BCB calls, database access, paid services or bank-specific inferred rules.

## Model

Explicit one-profile-per-account; rules ZERO/FIXED_RATE/BENCHMARK_PERCENTAGE/
SAVINGS_BR use immutable half-open versions. Money is exact minor-unit strings;
rates normalized decimal strings. BRL for CDI/Selic/savings/tax; fixed/ZERO support
existing currencies without FX. Current real balance stays distinct from scenarios.

Backend historical daily estimates compound hypothetically over eligible real
balances; savings uses complete anniversaries/minimum real balance. Future assumes
constant latest observed rates and hypothetical reinvestment, not guaranteed gain.
Future BUSINESS_252 uses weekdays without a complete holiday calendar (displayed).
Tax reference is explicit or first rule start; IR/IOF are estimates without lots.
No writes to balances, ledger, budgets, goals, recurrences or net worth.

Sources/status/date remain visible. STALE uses persisted BCB cache; missing needed
data is UNAVAILABLE, never invented. Back/docs/YIELD_ENGINE.md documents official
BCB/B3/tax sources, bounded adapter, rounding and migration integrity.

## Gate humano pendente

At http://localhost:3101/finance/yield, log in with a real existing account:

1. Configure one active BRL account with fixed10% annual; reload and verify the
   saved rule, gross/net estimates and unchanged real account/net-worth balances.
2. Create a future version CDI115%; verify previous rule/end-exclusive dates and
   historical view. Compare the same principal/horizon with CDI100%/savings/fixed.
3. Inspect30/90/365/custom horizons, BCB source dates, annual vs daily units,
   CURRENT_RATE/weekday assumption and clearly estimated IR/IOF.
4. Configure savings explicitly on another eligible account when appropriate;
   check birthday/minimum balance, no fictitious daily credit or partial month.
5. Verify archive/history, optional non-BRL fixed (no FX) and ownership using
   another user when available. Old modules/Auth must remain functional.

Do not create SQL fixtures to substitute the human gate. Automated tests use
synthetic identity and intercepted external boundaries, not human approval.
MDL7_STATUS=AWAITING_REAL_GATE; REAL_GATE=PENDING; READY_FOR_MDL8=false.
