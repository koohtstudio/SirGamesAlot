'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from '@/components/ui/Toast';
import { downloadCsv, toCsv } from '@/lib/csv';
import { useNow, useRepoData } from '@/lib/data/hooks';
import { PAYMENT_METHODS, type OnlineOrder } from '@/lib/domain/types';
import { STORE_TZ } from '@/lib/hours/hours';
import { formatCents } from '@/lib/money';
import { METHOD_LABEL, orderTotals, summarizePayments } from '@/lib/orders/orders';
import { PAYMENT_RANGES, RANGE_LABEL, paidInRange, type PaymentRange } from '@/lib/orders/range';
import { ABtn, Empty, PageTitle, Panel, Stat, when } from './AdminUi';
import { useRole } from './role';
import styles from './Admin.module.css';

/** Everything taken at the counter for online orders, with the totals a cash-up needs. */
export function CounterPaymentsPage() {
  const toast = useToast();
  const { isOwner } = useRole();
  const now = useNow(new Date().toISOString(), 60_000);
  const orders = useRepoData<OnlineOrder[] | null>((r) => r.listOnlineOrders(), null);
  const [range, setRange] = useState<PaymentRange>('today');

  const paid = useMemo(() => (orders ? paidInRange(orders, range, now) : []), [orders, range, now]);
  const summary = useMemo(() => summarizePayments(paid), [paid]);
  const waiting = useMemo(() => (orders ?? []).filter((o) => o.status === 'ready'), [orders]);

  if (!orders) return <p>Loading…</p>;

  const owed = waiting.reduce((sum, o) => sum + orderTotals(o.lines).totalCents, 0);

  function exportCsv() {
    downloadCsv(
      `counter-payments-${range}.csv`,
      toCsv(
        [
          'Paid at (store time)',
          'Order',
          'Customer',
          'Method',
          'Reference',
          'Subtotal',
          'HST',
          'Total',
          'Cash handed over',
          'Taken by',
        ],
        paid.map((o) => {
          const t = orderTotals(o.lines);
          return [
            formatInTimeZone(new Date(o.payment!.takenAt), STORE_TZ, 'yyyy-MM-dd HH:mm'),
            o.number,
            o.name,
            METHOD_LABEL[o.payment!.method],
            o.payment!.reference,
            (t.subtotalCents / 100).toFixed(2),
            (t.hstCents / 100).toFixed(2),
            (o.payment!.amountCents / 100).toFixed(2),
            o.payment!.tenderedCents !== undefined
              ? (o.payment!.tenderedCents / 100).toFixed(2)
              : '',
            o.payment!.takenBy,
          ];
        }),
      ),
    );
    toast(`Exported ${paid.length} payments.`);
  }

  return (
    <>
      <PageTitle title="Counter payments">
        Online orders are paid for in the store. This is the list of what was taken, by method, with
        HST, for your end-of-day count. It covers online orders only; your till or POS still has the
        full day.
      </PageTitle>

      <div className={styles.row} style={{ marginBottom: 14 }}>
        <label htmlFor="pay-range" className={styles.note}>
          Show
        </label>
        <select
          id="pay-range"
          className={styles.inline}
          style={{ maxWidth: 200 }}
          value={range}
          onChange={(e) => setRange(e.target.value as PaymentRange)}
        >
          {PAYMENT_RANGES.map((r) => (
            <option key={r} value={r}>
              {RANGE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.stats}>
        <Stat
          label={`Taken · ${RANGE_LABEL[range].toLowerCase()}`}
          value={formatCents(summary.totalCents)}
        />
        <Stat label="Orders paid" value={summary.count} />
        <Stat label="HST collected" value={formatCents(summary.hstCents)} />
        <Stat label="Cash in the drawer from these" value={formatCents(summary.cashCents)} />
        <Stat
          label="Ready, still to be paid"
          value={formatCents(owed)}
          tone={owed ? 'info' : undefined}
        />
      </div>

      <div className={styles.grid2}>
        <Panel id="by-method" title="By method">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Method</th>
                  <th className={styles.num}>Orders</th>
                  <th className={styles.num}>Total</th>
                </tr>
              </thead>
              <tbody>
                {PAYMENT_METHODS.map((m) => (
                  <tr key={m}>
                    <td>{METHOD_LABEL[m]}</td>
                    <td className={styles.num}>{summary.byMethod[m].count}</td>
                    <td className={`${styles.num} ${styles.money}`}>
                      {formatCents(summary.byMethod[m].totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className={styles.tfoot}>
                <tr>
                  <th scope="row">All methods</th>
                  <td className={styles.num}>{summary.count}</td>
                  <td className={`${styles.num} ${styles.money}`}>
                    {formatCents(summary.totalCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className={styles.note} style={{ marginTop: 10 }}>
            Cash is what the drawer should hold from these orders: the amount taken, not what the
            customer handed over, because change went back out.
          </p>
        </Panel>

        <Panel
          id="waiting-pay"
          title="Ready, waiting to be paid"
          action={<Link href="/admin/orders">Orders</Link>}
        >
          {waiting.length === 0 ? (
            <Empty>Nothing is waiting at the counter.</Empty>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {waiting.map((o) => (
                <li key={o.id} className={styles.row} style={{ justifyContent: 'space-between' }}>
                  <span>
                    <b>{o.number}</b> · {o.name}
                  </span>
                  <span className={styles.money}>
                    {formatCents(orderTotals(o.lines).totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        id="payments"
        title={`Payments (${paid.length})`}
        action={
          <ABtn
            onClick={exportCsv}
            disabled={!isOwner || paid.length === 0}
            title={isOwner ? undefined : 'Owner only'}
          >
            Export CSV{isOwner ? '' : ' (owner only)'}
          </ABtn>
        }
      >
        {paid.length === 0 ? (
          <Empty>No payments in this range.</Empty>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Paid at</th>
                  <th>Order</th>
                  <th>Method</th>
                  <th className={styles.num}>Subtotal</th>
                  <th className={styles.num}>HST</th>
                  <th className={styles.num}>Total</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((o) => {
                  const t = orderTotals(o.lines);
                  return (
                    <tr key={o.id} data-testid="payment-row">
                      <td>{when(o.payment!.takenAt)}</td>
                      <td>
                        {o.number}
                        <small>{o.name}</small>
                      </td>
                      <td>
                        {METHOD_LABEL[o.payment!.method]}
                        <small>
                          {o.payment!.reference ? `ref ${o.payment!.reference} · ` : ''}
                          {o.payment!.takenBy === 'owner' ? 'owner' : 'staff'}
                        </small>
                      </td>
                      <td className={`${styles.num} ${styles.money}`}>
                        {formatCents(t.subtotalCents)}
                      </td>
                      <td className={`${styles.num} ${styles.money}`}>{formatCents(t.hstCents)}</td>
                      <td className={`${styles.num} ${styles.money}`}>
                        {formatCents(o.payment!.amountCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className={styles.tfoot}>
                <tr>
                  <th scope="row" colSpan={3}>
                    Total
                  </th>
                  <td className={`${styles.num} ${styles.money}`}>
                    {formatCents(summary.subtotalCents)}
                  </td>
                  <td className={`${styles.num} ${styles.money}`}>
                    {formatCents(summary.hstCents)}
                  </td>
                  <td className={`${styles.num} ${styles.money}`}>
                    {formatCents(summary.totalCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {!isOwner && (
          <p className={styles.note} style={{ marginTop: 10 }}>
            Staff can see payments but cannot export them.
          </p>
        )}
      </Panel>
    </>
  );
}
