'use client';

import { formatInTimeZone } from 'date-fns-tz';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { STORE } from '@/lib/content/store';
import { getRepository } from '@/lib/data';
import { useRepoData } from '@/lib/data/hooks';
import type { OnlineOrder, OnlineOrderStatus } from '@/lib/domain/types';
import { STORE_TZ } from '@/lib/hours/hours';
import { formatCents } from '@/lib/money';
import { STATUS_LABEL, orderTotals } from '@/lib/orders/orders';
import { PayAtCounterNote } from './BasketView';
import styles from './Basket.module.css';

const STEPS: { status: OnlineOrderStatus; label: string }[] = [
  { status: 'placed', label: 'We have your order' },
  { status: 'ready', label: 'Ready for pickup' },
  { status: 'completed', label: 'Paid and picked up' },
];
const RANK: Record<OnlineOrderStatus, number> = {
  placed: 0,
  ready: 1,
  completed: 2,
  cancelled: -1,
};
const at = (iso: string) => formatInTimeZone(new Date(iso), STORE_TZ, "EEEE, MMM d 'at' h:mm a");

/** The page a customer lands on from their order link. Undefined while loading, null when it is not found. */
export function OrderStatus({ id }: { id: string }) {
  const order = useRepoData<OnlineOrder | null | undefined>((r) => r.getOnlineOrder(id), undefined);
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  if (order === undefined) return <p>Loading your order…</p>;
  if (order === null) {
    return (
      <div className={`${styles.panel} ${styles.empty}`}>
        <p>
          <b>We couldn&apos;t find that order.</b> The link may be incomplete, or the order was made
          on another device. Call {STORE.phone} and we&apos;ll look it up.
        </p>
        <ButtonLink href="/stock">Check stock</ButtonLink>
      </div>
    );
  }

  const totals = orderTotals(order.lines);
  const rank = RANK[order.status];

  async function cancel(o: OnlineOrder) {
    await getRepository().cancelOnlineOrder(o.id, 'customer', 'Cancelled by the customer');
    setConfirming(false);
    toast(`Order ${o.number} cancelled. Nothing was charged.`);
  }

  return (
    <section className={styles.panel} aria-labelledby="order-title" style={{ maxWidth: 760 }}>
      <div className={styles.panelHead}>
        <h2 id="order-title">
          Order {order.number} · {STATUS_LABEL[order.status]}
        </h2>
      </div>

      {order.status === 'cancelled' ? (
        <p className={styles.cancelled} role="status">
          This order was cancelled{order.cancelledAt ? ` on ${at(order.cancelledAt)}` : ''}. Nothing
          was charged.
        </p>
      ) : (
        <ol className={styles.steps} aria-label="Order progress">
          {STEPS.map((s) => (
            <li
              key={s.status}
              data-state={RANK[s.status] < rank ? 'done' : RANK[s.status] === rank ? 'now' : 'todo'}
              aria-current={RANK[s.status] === rank ? 'step' : undefined}
            >
              {s.label}
            </li>
          ))}
        </ol>
      )}

      <dl className={styles.facts}>
        {order.status === 'placed' && (
          <div>
            <dt>Next</dt>
            <dd>
              We&apos;re pulling your items. We&apos;ll {order.email ? 'email' : 'call'} you when
              they&apos;re ready.
            </dd>
          </div>
        )}
        {order.status === 'ready' && order.holdUntil && (
          <div>
            <dt>Pick up by</dt>
            <dd>
              <b>{at(order.holdUntil)}</b>. Pay at the counter. Give your name or {order.number}.
            </dd>
          </div>
        )}
        {order.status === 'completed' && order.completedAt && (
          <div>
            <dt>Picked up</dt>
            <dd>{at(order.completedAt)}. Thanks for shopping local.</dd>
          </div>
        )}
        <div>
          <dt>Where</dt>
          <dd>
            {STORE.name}, {STORE.locationNote}
            <br />
            {STORE.fullAddress} · <a href={STORE.phoneHref}>{STORE.phone}</a>
          </dd>
        </div>
        <div>
          <dt>Items</dt>
          <dd>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {order.lines.map((l) => (
                <li key={l.sku}>
                  {l.qty} × {l.name} · {formatCents(l.unitPriceCents * l.qty)}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>
            <b>{formatCents(totals.totalCents)}</b> ({formatCents(totals.subtotalCents)} +{' '}
            {formatCents(totals.hstCents)} HST)
          </dd>
        </div>
      </dl>
      {order.status !== 'cancelled' && order.status !== 'completed' && <PayAtCounterNote />}

      {order.status === 'placed' && (
        <div className={styles.form}>
          {confirming ? (
            <div className={styles.actions}>
              <Button onClick={() => cancel(order)} variant="red">
                Yes, cancel my order
              </Button>
              <Button variant="white" onClick={() => setConfirming(false)}>
                Keep it
              </Button>
            </div>
          ) : (
            <div className={styles.actions}>
              <Button variant="white" onClick={() => setConfirming(true)}>
                Cancel this order
              </Button>
            </div>
          )}
        </div>
      )}
      {order.status === 'ready' && (
        <p className={styles.counter}>
          Changed your mind? Call {STORE.phone} and we&apos;ll cancel it.
        </p>
      )}
    </section>
  );
}
