'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { useNow, useRepoData } from '@/lib/data/hooks';
import { RepositoryError } from '@/lib/data/repository';
import {
  PAYMENT_METHODS,
  type OnlineOrder,
  type OnlineOrderStatus,
  type PaymentMethod,
} from '@/lib/domain/types';
import { formatCents } from '@/lib/money';
import {
  METHOD_LABEL,
  STATUS_LABEL,
  changeDue,
  isOverdue,
  orderTotals,
  summarizePayments,
} from '@/lib/orders/orders';
import { paidInRange } from '@/lib/orders/range';
import { ABtn, Badge, Empty, PageTitle, Panel, Stat, ago, contactOf, when } from './AdminUi';
import { useRole } from './role';
import styles from './Admin.module.css';

type Filter = 'prepare' | 'ready' | 'done' | 'cancelled' | 'all';
const FILTERS: { id: Filter; label: string; match: (s: OnlineOrderStatus) => boolean }[] = [
  { id: 'prepare', label: 'To prepare', match: (s) => s === 'placed' },
  { id: 'ready', label: 'Ready for pickup', match: (s) => s === 'ready' },
  { id: 'done', label: 'Paid and picked up', match: (s) => s === 'completed' },
  { id: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' },
  { id: 'all', label: 'All', match: () => true },
];
const TONE = { placed: 'warn', ready: 'info', completed: 'ok', cancelled: 'muted' } as const;

/** "12.50" or "$12.50" → 1250. Null when it is not a usable amount. */
function dollarsToCents(text: string): number | null {
  const n = Number(text.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export function OrdersPage() {
  const toast = useToast();
  const { role, isOwner } = useRole();
  const now = useNow(new Date().toISOString(), 30_000);
  const orders = useRepoData<OnlineOrder[] | null>((r) => r.listOnlineOrders(), null);
  const [filter, setFilter] = useState<Filter>('prepare');
  const [q, setQ] = useState('');
  const [paying, setPaying] = useState<OnlineOrder | null>(null);
  const [cancelling, setCancelling] = useState<OnlineOrder | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    for (const f of FILTERS) c[f.id] = (orders ?? []).filter((o) => f.match(o.status)).length;
    return c;
  }, [orders]);

  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    const needle = q.trim().toLowerCase();
    return (orders ?? [])
      .filter((o) => f.match(o.status))
      .filter(
        (o) =>
          !needle ||
          `${o.number} ${o.name} ${o.phone ?? ''} ${o.email ?? ''} ${o.lines.map((l) => l.name).join(' ')}`
            .toLowerCase()
            .includes(needle),
      );
  }, [orders, filter, q]);

  if (!orders) return <p>Loading…</p>;

  const overdue = orders.filter((o) => isOverdue(o, now)).length;
  const today = summarizePayments(paidInRange(orders, 'today', now));

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast(message);
    } catch (e) {
      toast(e instanceof RepositoryError ? e.message : 'Something went wrong.');
    }
  }

  async function copyPickList(o: OnlineOrder) {
    const text = [
      `Pick list ${o.number} for ${o.name}`,
      ...o.lines.map((l) => `${l.qty} x ${l.name} (${l.sku})`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast(`Pick list for ${o.number} copied.`);
    } catch {
      toast('Could not copy. Select the items and copy by hand.');
    }
  }

  return (
    <>
      <PageTitle title="Online orders">
        Customers fill a basket on the website and pay here, at the counter. Pull the items, mark
        the order ready, then take payment when they collect. Nothing is ever charged online.
      </PageTitle>

      <div className={styles.stats}>
        <Stat
          label="To prepare"
          value={counts.prepare}
          tone={counts.prepare ? 'warn' : undefined}
        />
        <Stat
          label="Ready for pickup"
          value={counts.ready}
          tone={counts.ready ? 'info' : undefined}
        />
        <Stat label="Past pickup time" value={overdue} tone={overdue ? 'bad' : undefined} />
        <Stat label="Taken today" value={formatCents(today.totalCents)} />
      </div>

      <Panel
        id="orders"
        title={`Orders (${list.length})`}
        action={<Link href="/admin/payments">Counter payments</Link>}
      >
        <div className={styles.chips} role="group" aria-label="Order status">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label} ({counts[f.id]})
            </button>
          ))}
        </div>
        <div className={styles.row} style={{ marginBottom: 12 }}>
          <label className="sr-only" htmlFor="order-q">
            Search orders
          </label>
          <input
            id="order-q"
            className={styles.inline}
            style={{ maxWidth: 320 }}
            type="search"
            placeholder="Search number, name, phone or item"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {list.length === 0 ? (
          <Empty>
            {orders.length === 0
              ? 'No online orders yet. Add something to the basket on the public stock checker.'
              : 'No orders match.'}
          </Empty>
        ) : (
          <ul className={styles.orders}>
            {list.map((o) => {
              const t = orderTotals(o.lines);
              const late = isOverdue(o, now);
              return (
                <li key={o.id} className={styles.order} data-testid="online-order">
                  <div className={styles.orderHead}>
                    <h3>
                      {o.number} · {o.name}
                    </h3>
                    <span className={styles.row}>
                      <Badge tone={TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                      {late && <Badge tone="bad">Past pickup time</Badge>}
                      <span className={styles.note}>placed {ago(o.createdAt)}</span>
                    </span>
                  </div>
                  <div className={styles.orderBody}>
                    <div className={styles.note}>
                      {contactOf(o)}
                      {o.status === 'ready' && o.holdUntil && ` · kept until ${when(o.holdUntil)}`}
                    </div>
                    <ul className={styles.lineList}>
                      {o.lines.map((l) => (
                        <li key={l.sku}>
                          <span>
                            {l.qty} × {l.name} <small className={styles.note}>{l.sku}</small>
                          </span>
                          <span className={styles.money}>
                            {formatCents(l.unitPriceCents * l.qty)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className={styles.totalRow}>
                      <span>
                        Total with HST{' '}
                        <small className={styles.note}>
                          ({formatCents(t.subtotalCents)} + {formatCents(t.hstCents)})
                        </small>
                      </span>
                      <span className={styles.money}>{formatCents(t.totalCents)}</span>
                    </div>
                    {o.note && <p>Customer note: “{o.note}”</p>}
                    {o.status === 'cancelled' && (
                      <p className={styles.note}>
                        Cancelled {o.cancelledAt ? ago(o.cancelledAt) : ''} by{' '}
                        {o.cancelledBy === 'customer' ? 'the customer' : 'staff'}
                        {o.cancelReason ? `: ${o.cancelReason}` : ''}. Nothing was charged.
                      </p>
                    )}
                    {o.payment && (
                      <p className={styles.payBox}>
                        <b>Paid at the counter</b> · {METHOD_LABEL[o.payment.method]}{' '}
                        {formatCents(o.payment.amountCents)} · {when(o.payment.takenAt)} by{' '}
                        {o.payment.takenBy === 'owner' ? 'the owner' : 'staff'}
                        {o.payment.method === 'cash' &&
                        o.payment.tenderedCents !== undefined &&
                        o.payment.tenderedCents > o.payment.amountCents
                          ? ` · change ${formatCents(o.payment.tenderedCents - o.payment.amountCents)}`
                          : ''}
                        {o.payment.reference ? ` · ref ${o.payment.reference}` : ''}
                      </p>
                    )}
                    <StaffNote order={o} />
                    <div className={styles.actions}>
                      {o.status === 'placed' && (
                        <ABtn
                          kind="primary"
                          onClick={() =>
                            run(
                              () => getRepository().markOrderReady(o.id),
                              o.email
                                ? `${o.number} is ready. Would email ${o.name} in the full build (logged to the demo outbox).`
                                : `${o.number} is ready. Call ${o.name} to let them know.`,
                            )
                          }
                          aria-label={`Mark ready: ${o.number}`}
                        >
                          Mark ready
                        </ABtn>
                      )}
                      {o.status === 'ready' && (
                        <ABtn
                          kind="primary"
                          onClick={() => setPaying(o)}
                          aria-label={`Take payment for ${o.number}`}
                        >
                          Take payment
                        </ABtn>
                      )}
                      {(o.status === 'placed' || o.status === 'ready') && (
                        <>
                          <ABtn
                            onClick={() => copyPickList(o)}
                            aria-label={`Copy pick list for ${o.number}`}
                          >
                            Copy pick list
                          </ABtn>
                          <ABtn
                            kind="danger"
                            onClick={() => setCancelling(o)}
                            aria-label={`Cancel order: ${o.number}`}
                          >
                            Cancel order
                          </ABtn>
                        </>
                      )}
                      {o.status === 'completed' &&
                        (isOwner ? (
                          voiding === o.id ? (
                            <>
                              <ABtn
                                kind="danger"
                                onClick={async () => {
                                  await run(
                                    () => getRepository().voidCounterPayment(o.id),
                                    `Payment on ${o.number} undone. It is back to ready.`,
                                  );
                                  setVoiding(null);
                                }}
                              >
                                Yes, undo payment on {o.number}
                              </ABtn>
                              <ABtn onClick={() => setVoiding(null)}>Keep it</ABtn>
                            </>
                          ) : (
                            <ABtn
                              onClick={() => setVoiding(o.id)}
                              aria-label={`Undo payment on ${o.number}`}
                            >
                              Undo payment
                            </ABtn>
                          )
                        ) : (
                          <span className={styles.note}>Only the owner can undo a payment.</span>
                        ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {paying && (
        <PaymentDialog
          order={paying}
          onClose={() => setPaying(null)}
          onPaid={(o) => {
            setPaying(null);
            toast(`${o.number} paid at the counter: ${formatCents(o.payment!.amountCents)}.`);
          }}
          by={role ?? 'staff'}
        />
      )}
      {cancelling && (
        <CancelDialog
          order={cancelling}
          onClose={() => setCancelling(null)}
          onDone={(o) => {
            setCancelling(null);
            toast(`${o.number} cancelled. The items are available to sell again.`);
          }}
        />
      )}
    </>
  );
}

function StaffNote({ order }: { order: OnlineOrder }) {
  const id = useId().replace(/:/g, '');
  const toast = useToast();
  const [text, setText] = useState(order.staffNote ?? '');
  const dirty = text.trim() !== (order.staffNote ?? '');
  return (
    <div className={styles.row} style={{ alignItems: 'flex-end' }}>
      <div style={{ flex: '1 1 240px' }}>
        <label htmlFor={id} className={styles.note}>
          Staff note (not shown to the customer)
        </label>
        <input
          id={id}
          className={styles.inline}
          value={text}
          maxLength={400}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <ABtn
        disabled={!dirty}
        onClick={async () => {
          await getRepository().setOrderStaffNote(order.id, text);
          toast(`Note saved on ${order.number}.`);
        }}
        aria-label={`Save note on ${order.number}`}
      >
        Save note
      </ABtn>
    </div>
  );
}

function PaymentDialog({
  order,
  by,
  onClose,
  onPaid,
}: {
  order: OnlineOrder;
  by: 'owner' | 'staff';
  onClose: () => void;
  onPaid: (o: OnlineOrder) => void;
}) {
  return (
    <Dialog open onClose={onClose} title={`Take payment · ${order.number}`}>
      <PaymentForm order={order} by={by} onClose={onClose} onPaid={onPaid} />
    </Dialog>
  );
}

function PaymentForm({
  order,
  by,
  onClose,
  onPaid,
}: {
  order: OnlineOrder;
  by: 'owner' | 'staff';
  onClose: () => void;
  onPaid: (o: OnlineOrder) => void;
}) {
  const id = useId().replace(/:/g, '');
  const total = orderTotals(order.lines).totalCents;
  const [method, setMethod] = useState<PaymentMethod>('debit');
  const [cash, setCash] = useState((total / 100).toFixed(2));
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const tendered = dollarsToCents(cash);
  const change = tendered === null ? null : changeDue(total, tendered);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (method === 'cash' && (tendered === null || change === null)) {
      setError(`Cash handed over must be at least ${formatCents(total)}.`);
      return;
    }
    setBusy(true);
    try {
      const paid = await getRepository().takeCounterPayment(
        order.id,
        {
          method,
          tenderedCents: method === 'cash' ? (tendered ?? undefined) : undefined,
          reference,
        },
        by,
      );
      onPaid(paid);
    } catch (err) {
      setError(
        err instanceof RepositoryError
          ? (err.fields?.tenderedCents ?? err.message)
          : 'Something went wrong.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 14, padding: 18 }}>
      <p style={{ fontWeight: 700 }}>
        {order.name} · {order.lines.reduce((n, l) => n + l.qty, 0)} items
        <br />
        <span className={styles.change} data-testid="pay-total">
          {formatCents(total)}
        </span>{' '}
        <span className={styles.note}>with HST. Take this amount at the till.</span>
      </p>
      <fieldset className={styles.methods}>
        <legend>How did they pay?</legend>
        {PAYMENT_METHODS.map((m) => (
          <label key={m} className={styles.method}>
            <input
              type="radio"
              name={`${id}-method`}
              value={m}
              checked={method === m}
              onChange={() => setMethod(m)}
            />
            <span>{METHOD_LABEL[m]}</span>
          </label>
        ))}
      </fieldset>
      {method === 'cash' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <TextField
            id={`${id}-cash`}
            label="Cash handed over ($)"
            inputMode="decimal"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            error={tendered === null ? 'Enter an amount like 40.00.' : undefined}
          />
          <p aria-live="polite" className={styles.change}>
            {change === null ? (
              <span className={styles.changeLow}>
                Not enough: the total is {formatCents(total)}
              </span>
            ) : (
              <>Change due: {formatCents(change)}</>
            )}
          </p>
        </div>
      )}
      <TextField
        id={`${id}-ref`}
        label={
          method === 'gift-card'
            ? 'Gift card number (optional)'
            : 'Receipt number or last 4 digits (optional)'
        }
        value={reference}
        maxLength={40}
        onChange={(e) => setReference(e.target.value)}
      />
      {error && (
        <p role="alert" style={{ color: 'var(--red)', fontWeight: 700 }}>
          {error}
        </p>
      )}
      <p className={styles.note}>
        This records a sale you took at the counter. The website never touches card details.
      </p>
      <div className={styles.actions}>
        <ABtn type="submit" kind="primary" disabled={busy}>
          {busy ? 'Saving…' : 'Payment taken, complete order'}
        </ABtn>
        <ABtn onClick={onClose}>Cancel</ABtn>
      </div>
    </form>
  );
}

function CancelDialog({
  order,
  onClose,
  onDone,
}: {
  order: OnlineOrder;
  onClose: () => void;
  onDone: (o: OnlineOrder) => void;
}) {
  const id = useId().replace(/:/g, '');
  const [reason, setReason] = useState('Customer called');
  const [other, setOther] = useState('');
  const [error, setError] = useState('');
  const text = reason === 'Other' ? other : reason;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      onDone(await getRepository().cancelOnlineOrder(order.id, 'staff', text));
    } catch (err) {
      setError(
        err instanceof RepositoryError
          ? (err.fields?.reason ?? err.message)
          : 'Something went wrong.',
      );
    }
  }

  return (
    <Dialog open onClose={onClose} title={`Cancel ${order.number}`}>
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 14, padding: 18 }}>
        <p>
          Cancel the order for <b>{order.name}</b>? The items go back on sale. Nothing was charged
          online, so there is nothing to refund.
        </p>
        <SelectField
          id={`${id}-r`}
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option>Customer called</option>
          <option>Not picked up in time</option>
          <option>Item not available</option>
          <option>Other</option>
        </SelectField>
        {reason === 'Other' && (
          <TextAreaField
            id={`${id}-o`}
            label="What happened?"
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
        )}
        {error && (
          <p role="alert" style={{ color: 'var(--red)', fontWeight: 700 }}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <ABtn type="submit" kind="danger">
            Cancel order and release the items
          </ABtn>
          <ABtn onClick={onClose}>Keep the order</ABtn>
        </div>
      </form>
    </Dialog>
  );
}
