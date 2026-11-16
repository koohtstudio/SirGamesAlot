import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { OnlineOrder } from '@/lib/domain/types';
import { STORE_TZ } from '@/lib/hours/hours';

export const PAYMENT_RANGES = ['today', 'yesterday', 'week', 'month', 'all'] as const;
export type PaymentRange = (typeof PAYMENT_RANGES)[number];

export const RANGE_LABEL: Record<PaymentRange, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'Last 7 days',
  month: 'This month',
  all: 'All time',
};

/** The store's calendar day (America/Toronto) an instant falls on, as yyyy-MM-dd. */
export const storeDay = (iso: string | Date) =>
  formatInTimeZone(new Date(iso), STORE_TZ, 'yyyy-MM-dd');

/** Orders paid within a range. Days are store days, so a sale at 11 pm still counts for that evening. */
export function paidInRange(orders: OnlineOrder[], range: PaymentRange, now: Date): OnlineOrder[] {
  const today = storeDay(now);
  const yesterday = storeDay(addDays(new Date(`${today}T12:00:00Z`), -1));
  const weekStart = storeDay(addDays(new Date(`${today}T12:00:00Z`), -6));
  return orders
    .filter((o) => o.status === 'completed' && o.payment)
    .filter((o) => {
      const day = storeDay(o.payment!.takenAt);
      switch (range) {
        case 'today':
          return day === today;
        case 'yesterday':
          return day === yesterday;
        case 'week':
          return day >= weekStart && day <= today;
        case 'month':
          return day.slice(0, 7) === today.slice(0, 7);
        default:
          return true;
      }
    })
    .sort((a, b) => b.payment!.takenAt.localeCompare(a.payment!.takenAt));
}
