# MDL 6 — Net Worth / Patrimônio

Protected route `/finance/net-worth`, using the existing Auth V2 provider/guards
and session-scoped Finance Query cache. Back-generated strict Zod contracts stay
byte-identical to the TypeBox source; there is no backend runtime dependency.

Select one currency explicitly (BRL default); never add different currencies.
Money remains integer strings/BigInt, including formatting and 0/2/3 currency
exponents. Only dimensionless chart coordinates use Number.

Cards show assets, liabilities and net worth. Breakdown includes signed balances
of active/inactive accounts, read-only, plus external ASSET/LIABILITY items.
Do not duplicate account money as manual items. The Back reconstructs positions
from the existing ledger and observations; it never posts or changes MDL2–MDL5.
Account opening balances enter history from account creation, not earlier.

Create requires compatible category, immutable kind/currency and positive first
value. Edit changes metadata only. Subsequent valuations accept zero and preserve
all observations. Latest date <= asOf wins with deterministic timestamp/id ties.
Dates are civil YYYY-MM-DD, <=today in profile timezone (UTC fallback); account
cutoff is next local midnight. Archive is terminal, preserves earlier history,
excludes current position and disables edits/new valuations. No delete/restore.

Summary GET `/api/v1/finance/net-worth?asOf=` and monthly `/history` use server
dates/totals. History `from/to` are inclusive YYYY-MM, max60 months, no future.
The screen shows up to12 months with SVG titles and exact accessible table.
Items/valuation lists use server cursors, default50/max100. Mutation invalidates
owner-specific Finance reads. Loading, empty, safe error/retry and keyboard states
are present; archived history remains available. No FX, yield/debt planner or AI.

Unit/integration and desktop/mobile/tablet browser fixtures exercise interactions;
Back disposable PostgreSQL17 tests prove accounting and RLS. They do not replace
hosted human validation. Approved real gate: record BRL baseline, add Carro50,000,
add Financiamento20,000, revalue Carro55,000, verify baseline+35,000 and retained
50,000 history, reload, verify account breakdown, archive debt, check currencies
and confirm earlier financial modules unchanged. Automation inserts no hosted fixture.

MDL6_STATUS=COMPLETE; REAL_GATE=PASS; READY_FOR_MDL7=true.

Human gate approved by the user on 2026-10-05: net worth, account breakdown,
manual asset/liability, valuation/history, monthly history, reload, archive,
currency separation, financial isolation and ownership PASS. Final closure
regression PASS; do not start MDL7 without a separate explicit request.
