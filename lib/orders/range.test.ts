import { describe, expect, it } from 'vitest';
import type { OnlineOrder } from '@/lib/domain/types';
import { paidInRange } from './range';

const paid = (id: string, takenAt: string): OnlineOrder => ({
  id,
  number: id,
  name: id,
  lines: [{ sku: 'A', name: 'A', unitPriceCents: 100, qty: 1 }],
  status: 'completed',
  createdAt: takenAt,
  completedAt: takenAt,
  payment: { method: 'cash', amountCents: 113, takenAt, takenBy: 'staff' },
});

// 2026-11-11 22:30 in Toronto (EST, UTC-5) is 2026-11-12 03:30 UTC.
const NOW = new Date('2026-11-12T03:30:00Z');
const orders = [
  paid('late-tonight', '2026-11-12T03:00:00Z'), // 10 pm on the 11th
  paid('this-morning', '2026-11-11T15:00:00Z'), // 10 am on the 11th
  paid('yesterday', '2026-11-10T20:00:00Z'),
  paid('five-days-ago', '2026-11-06T20:00:00Z'),
  paid('last-month', '2026-10-20T20:00:00Z'),
  { ...paid('unpaid', '2026-11-11T15:00:00Z'), status: 'ready' as const, payment: undefined },
];
const ids = (r: Parameters<typeof paidInRange>[1]) => paidInRange(orders, r, NOW).map((o) => o.id);

describe('payment ranges use the store day, not UTC', () => {
  it('counts a 10 pm sale on the evening it happened', () => {
    expect(ids('today')).toEqual(['late-tonight', 'this-morning']);
  });
  it('finds yesterday, the last 7 days, this month and everything', () => {
    expect(ids('yesterday')).toEqual(['yesterday']);
    expect(ids('week')).toEqual(['late-tonight', 'this-morning', 'yesterday', 'five-days-ago']);
    expect(ids('month')).toEqual(['late-tonight', 'this-morning', 'yesterday', 'five-days-ago']);
    expect(ids('all')).toHaveLength(5);
  });
  it('ignores orders that were not paid', () => {
    expect(ids('all')).not.toContain('unpaid');
  });
});
