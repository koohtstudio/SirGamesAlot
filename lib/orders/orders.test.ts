import { describe, expect, it } from 'vitest';
import type { OnlineOrder } from '@/lib/domain/types';
import {
  availableQty,
  canMove,
  changeDue,
  isOverdue,
  orderTotals,
  reservedBySku,
  summarizePayments,
  unorderableReason,
} from './orders';

const line = (sku: string, qty: number, unitPriceCents = 725) => ({
  sku,
  name: sku,
  unitPriceCents,
  qty,
});
const order = (over: Partial<OnlineOrder>): OnlineOrder => ({
  id: 'o1',
  number: 'SGL-1',
  name: 'Test',
  lines: [line('A', 1)],
  status: 'placed',
  createdAt: '2026-11-11T15:00:00.000Z',
  ...over,
});

describe('order totals', () => {
  it('adds HST once, on the subtotal, in whole cents', () => {
    // 3 x $7.25 = $21.75, HST $2.83 (2.8275 rounds up), total $24.58
    expect(orderTotals([line('A', 3)])).toEqual({
      subtotalCents: 2175,
      hstCents: 283,
      totalCents: 2458,
      units: 3,
    });
  });
  it('handles an empty basket', () => {
    expect(orderTotals([]).totalCents).toBe(0);
  });
});

describe('reserved stock', () => {
  it('counts placed and ready orders, not completed or cancelled', () => {
    const reserved = reservedBySku([
      order({ status: 'placed', lines: [line('A', 2), line('B', 1)] }),
      order({ status: 'ready', lines: [line('A', 1)] }),
      order({ status: 'completed', lines: [line('A', 5)] }),
      order({ status: 'cancelled', lines: [line('A', 9)] }),
    ]);
    expect(reserved).toEqual({ A: 3, B: 1 });
  });
});

describe('availability', () => {
  const p = { count: 4, statusOverridden: false, priceCents: 725, status: 'in' as const };
  it('is the POS count minus reserved, capped per line', () => {
    expect(availableQty(p, 1)).toBe(3);
    expect(availableQty({ ...p, count: 40 }, 0)).toBe(10);
    expect(availableQty(p, 4)).toBe(0);
    expect(availableQty(p, 9)).toBe(0);
  });
  it('refuses items with no price, out of stock, or only orderable', () => {
    expect(unorderableReason({ priceCents: 0, status: 'in' })).toMatch(/price/);
    expect(unorderableReason({ priceCents: 100, status: 'out' })).toMatch(/Out of stock/);
    expect(unorderableReason({ priceCents: 100, status: 'order' })).toMatch(/Order it in/);
    expect(unorderableReason({ priceCents: 100, status: 'low' })).toBeNull();
    expect(availableQty({ ...p, priceCents: 0 }, 0)).toBe(0);
  });
  it('trusts a hand-set status when the POS count says zero', () => {
    expect(availableQty({ ...p, count: 0, statusOverridden: true }, 0)).toBe(10);
  });
});

describe('order flow', () => {
  it('only moves forward, and finished orders stay finished', () => {
    expect(canMove('placed', 'ready')).toBe(true);
    expect(canMove('placed', 'completed')).toBe(false);
    expect(canMove('ready', 'completed')).toBe(true);
    expect(canMove('ready', 'placed')).toBe(false);
    expect(canMove('completed', 'cancelled')).toBe(false);
    expect(canMove('cancelled', 'ready')).toBe(false);
  });
  it('flags a ready order past its pickup time', () => {
    const o = order({ status: 'ready', holdUntil: '2026-11-13T15:00:00.000Z' });
    expect(isOverdue(o, new Date('2026-11-13T14:59:00Z'))).toBe(false);
    expect(isOverdue(o, new Date('2026-11-13T15:01:00Z'))).toBe(true);
    expect(isOverdue({ ...o, status: 'placed' }, new Date('2027-01-01'))).toBe(false);
  });
});

describe('cash change', () => {
  it('works out change and rejects too little', () => {
    expect(changeDue(2458, 3000)).toBe(542);
    expect(changeDue(2458, 2458)).toBe(0);
    expect(changeDue(2458, 2000)).toBeNull();
  });
});

describe('payment summary', () => {
  it('totals by method and tracks cash for the drawer', () => {
    const paid = (method: 'cash' | 'debit', qty: number): OnlineOrder => {
      const lines = [line('A', qty)];
      const t = orderTotals(lines);
      return order({
        status: 'completed',
        lines,
        payment: { method, amountCents: t.totalCents, takenAt: 'x', takenBy: 'staff' },
      });
    };
    const s = summarizePayments([
      paid('cash', 1),
      paid('debit', 2),
      order({ status: 'ready' }),
      order({ status: 'cancelled' }),
    ]);
    expect(s.count).toBe(2);
    expect(s.subtotalCents).toBe(725 + 1450);
    expect(s.totalCents).toBe(s.subtotalCents + s.hstCents);
    expect(s.byMethod.cash.count).toBe(1);
    expect(s.byMethod.debit.count).toBe(1);
    expect(s.cashCents).toBe(819);
  });
});
