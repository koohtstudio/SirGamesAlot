# Online orders: a basket you pay for at the counter

Customers fill a basket on the website. They are **never charged online**: no card form, no payment provider, no card
data anywhere in this code. They pay in the store when they pick up, and staff record that payment in the back office.

## The flow

```
customer                              staff (admin)
--------                              -------------
Add to basket on /stock
/basket: name, phone or email  ───►   Online orders → "To prepare"
Order SGL-1006 received                 pull the items, "Mark ready"   ──► "ready" email (demo outbox)
/order/<id>: status, cancel until     Online orders → "Ready for pickup"
  it is prepared                        customer arrives, "Take payment"
                                        cash / debit / credit / gift card / other
                                      Counter payments: totals by method, HST, cash for the drawer
```

Statuses: `placed → ready → completed (paid at the counter)`, or `cancelled` from placed or ready. A paid order cannot
be cancelled; the owner must **undo the payment** first, which puts it back to `ready`. All of that is in
`lib/orders/orders.ts` (`canMove`) and enforced again in the repository.

## Rules the code follows

- **Names and prices come from the POS, never from the browser.** The browser sends only `sku` and `qty`.
  `createOnlineOrder` looks each item up in the `InventorySource` and copies name and price onto the order line, so a
  later price change never rewrites an old order and a tampered request cannot set its own price.
- **Stock is held for open orders.** `placed` and `ready` orders reserve units, so the website never sells the same unit
  twice (`reservedBySku`, `availableQty`). The POS count stays the source of truth: when an order is paid and the unit
  leaves the shelf, the POS count drops and the reservation ends. Cancelling releases it straight away.
- **Only orderable items go in a basket**: a price above $0 and a status of in stock or low. "Ask in store", "order in"
  and out-of-stock items use the existing Hold, Order it in and Tell me when it's back flows.
- **Money is integer cents**; HST (13%) is rounded once, on the subtotal. The amount recorded at the counter is always
  the order total. There are no part payments.
- **Cash** records what the customer handed over; change due is shown to staff. The drawer figure uses the amount taken,
  not the amount handed over.
- Limits: 10 of one item, 20 different items per order. A ready order is kept for `settings.orderHoldHours` (default
  48). After that it shows as "past pickup time" and staff decide whether to cancel it. Nothing cancels itself.
- **Roles**: staff can prepare orders, take payments and cancel. Only the owner can undo a payment, export counter
  payments as CSV, and change the online-orders settings.
- The customer's link is `/order/<id>` where the id is a random value. It is not guessable, and the page is `noindex`.
  Phase 2 should replace it with a signed token and rate-limit lookups.

## Where things live

| Piece                  | File                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Rules, totals, summary | `lib/orders/orders.ts`, `lib/orders/range.ts` (store-day ranges)                                                |
| Repository methods     | `lib/data/repository.ts` (`createOnlineOrder` … `setOrderStaffNote`)                                            |
| Mock implementation    | `lib/data/mock/mock-repository.ts`, sample orders in `lib/data/mock/seed.ts`                                    |
| Basket in the browser  | `lib/cart/lines.ts`, `lib/cart/useCart.ts` (localStorage, sku and qty only)                                     |
| Public pages           | `/basket`, `/order/[id]`, basket buttons on `/stock`, `CartBar`                                                 |
| Back office            | `/admin/orders`, `/admin/payments`, Today, Settings → Online orders                                             |
| Tests                  | `lib/orders/*.test.ts`, `lib/cart/lines.test.ts`, `tests/unit/online-orders.test.ts`, `tests/e2e/flows.spec.ts` |

## Not built (on purpose)

- Online card payment, deposits, gift cards sold online, shipping, delivery.
- Part payments, refunds and returns. Refunds happen on the till; the store's POS is the record for them.
- Discounts and the d20 roll. Those are applied at the counter, so a counter total can differ from the order total.
  If the owner wants them recorded, add an "adjustment" to the payment in Phase 2.
- Event fees. Those are still "pay at the counter" on the event, outside this ledger.
