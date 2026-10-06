# Cards human gate — MDL8

Route: http://localhost:3101/finance/cards (real authenticated session).
Backend: http://localhost:3001. The model/API is maintained in Back/docs/CARDS_INVOICES.md.

Cards shows real signed balance, invoice recognized/scheduled totals and future
commitments separately. Future commitments do not increase current Net Worth.
Purchases are expenses; payments are transfers, never expenses. Currencies remain
separate. Limit is informative, including over-limit and positive credit states.

Create a BRL test card, limit5000, closing10/due17, new credit account with debt0.
Create a300 purchase1x, then pay300 from an existing same-currency bank account.
Check source balance, credit balance0, invoice PAID and only one300 expense.
Create1000/3:333.33/333.33/333.34; recognized first installment,666.67 future.
Reload; verify card/purchases/installments/invoices/payment persist.
Add a future close12/due20 rule; older cycles stay unchanged.
Correct a separate eligible unpaid purchase; CANCELLED history remains.
Archive at the end: purchases/rules blocked, history/future installments/payment
still available. Budget counts each installment once; Net Worth only real balance.
Goals/Recurrences/Yield unchanged. If another user exists, confirm isolation.

Forms preserve space for helper/error/loading and a fixed-height scrollable preview.
The authoritative final cycle/amount is returned by the backend. A retry of an
unchanged purchase/payment keeps its idempotency key. No PAN/CVV/PIN or credentials
are accepted; only optional last4. No processor, FX, revolving interest or refund.
Calendar contract is unchanged; due dates are available on the Cards page.

## Approved result

The user completed and approved this gate on 2026-10-06: card, purchase1x,
transfer payment/no double counting, installments/exact split/future commitments,
reload, billing-rule versioning, correction, archive, Budget/Net Worth integration,
financial isolation and ownership. REAL_GATE=PASS; MDL8=COMPLETE.
The steps above remain a reference, not a request to repeat the gate. DEV records
are preserved; no additional financial fixtures or MDL9 implementation.
