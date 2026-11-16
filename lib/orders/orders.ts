import { hstCents } from '@/lib/money';
import type {
  OnlineOrder,
  OnlineOrderStatus,
  OrderLine,
  PaymentMethod,
  Product,
} from '@/lib/domain/types';
import { MAX_QTY_PER_LINE } from '@/lib/domain/schemas';

/** Statuses that still hold stock for the customer. */
export const OPEN_STATUSES: OnlineOrderStatus[] = ['placed', 'ready'];

export const isOpen = (o: Pick<OnlineOrder, 'status'>) => OPEN_STATUSES.includes(o.status);

export interface Totals {
  subtotalCents: number;
  hstCents: number;
  totalCents: number;
  units: number;
}

/** Prices are before HST (13%). HST is rounded once, on the subtotal, the way a till does it. */
export function orderTotals(lines: Pick<OrderLine, 'unitPriceCents' | 'qty'>[]): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.qty, 0);
  const hst = hstCents(subtotalCents);
  return {
    subtotalCents,
    hstCents: hst,
    totalCents: subtotalCents + hst,
    units: lines.reduce((sum, l) => sum + l.qty, 0),
  };
}

/** SKU → units promised to open orders. They come off what the website will sell, until picked up or cancelled. */
export function reservedBySku(
  orders: Pick<OnlineOrder, 'status' | 'lines'>[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of orders) {
    if (!isOpen(o)) continue;
    for (const l of o.lines) out[l.sku] = (out[l.sku] ?? 0) + l.qty;
  }
  return out;
}

/** Why an item can't go in an online basket, or null when it can. */
export function unorderableReason(p: Pick<Product, 'priceCents' | 'status'>): string | null {
  if (p.priceCents <= 0) return 'Ask in store for the price.';
  if (p.status === 'out') return 'Out of stock.';
  if (p.status === 'order') return 'Not on the shelf. Use "Order it in" instead.';
  return null;
}

/**
 * How many of an item the website will still sell. The POS count minus what open orders already hold.
 * When staff pinned the status by hand (so the POS count is not trusted), the per-line limit applies.
 */
export function availableQty(
  p: Pick<Product, 'count' | 'statusOverridden' | 'priceCents' | 'status'>,
  reserved: number,
): number {
  if (unorderableReason(p)) return 0;
  const left = Math.max(p.count - reserved, 0);
  if (left === 0 && p.statusOverridden) return MAX_QTY_PER_LINE;
  return Math.min(left, MAX_QTY_PER_LINE);
}

const NEXT: Record<OnlineOrderStatus, OnlineOrderStatus[]> = {
  placed: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};
export const canMove = (from: OnlineOrderStatus, to: OnlineOrderStatus) => NEXT[from].includes(to);

export const STATUS_LABEL: Record<OnlineOrderStatus, string> = {
  placed: 'To prepare',
  ready: 'Ready for pickup',
  completed: 'Paid and picked up',
  cancelled: 'Cancelled',
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  debit: 'Debit',
  credit: 'Credit',
  'gift-card': 'Gift card',
  other: 'Other',
};

/** A ready order that was not picked up in time. Staff decide whether to keep or cancel it. */
export function isOverdue(o: Pick<OnlineOrder, 'status' | 'holdUntil'>, now: Date): boolean {
  return o.status === 'ready' && !!o.holdUntil && new Date(o.holdUntil).getTime() < now.getTime();
}

export function formatOrderNumber(seq: number): string {
  return `SGL-${seq}`;
}

/** Change to hand back on a cash sale. Null when the customer has not handed over enough. */
export function changeDue(totalCents: number, tenderedCents: number): number | null {
  return tenderedCents >= totalCents ? tenderedCents - totalCents : null;
}

export interface PaymentSummary {
  count: number;
  subtotalCents: number;
  hstCents: number;
  totalCents: number;
  byMethod: Record<PaymentMethod, { count: number; totalCents: number }>;
  /** Cash the drawer should hold from these sales: amounts taken, not what was handed over. */
  cashCents: number;
}

/** Totals for the orders paid at the counter. Pass orders already filtered to the day or range you want. */
export function summarizePayments(
  orders: Pick<OnlineOrder, 'lines' | 'payment' | 'status'>[],
): PaymentSummary {
  const out: PaymentSummary = {
    count: 0,
    subtotalCents: 0,
    hstCents: 0,
    totalCents: 0,
    byMethod: {
      cash: { count: 0, totalCents: 0 },
      debit: { count: 0, totalCents: 0 },
      credit: { count: 0, totalCents: 0 },
      'gift-card': { count: 0, totalCents: 0 },
      other: { count: 0, totalCents: 0 },
    },
    cashCents: 0,
  };
  for (const o of orders) {
    if (o.status !== 'completed' || !o.payment) continue;
    const t = orderTotals(o.lines);
    out.count += 1;
    out.subtotalCents += t.subtotalCents;
    out.hstCents += t.hstCents;
    out.totalCents += o.payment.amountCents;
    out.byMethod[o.payment.method].count += 1;
    out.byMethod[o.payment.method].totalCents += o.payment.amountCents;
    if (o.payment.method === 'cash') out.cashCents += o.payment.amountCents;
  }
  return out;
}
