'use client';

import { useId, useMemo, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { Verify } from '@/components/ui/Verify';
import { useCart } from '@/lib/cart/useCart';
import { STORE } from '@/lib/content/store';
import { getRepository } from '@/lib/data';
import { useRepoData } from '@/lib/data/hooks';
import { RepositoryError } from '@/lib/data/repository';
import type { OnlineOrder, Product, Settings } from '@/lib/domain/types';
import { formatCents } from '@/lib/money';
import { availableQty, orderTotals, unorderableReason } from '@/lib/orders/orders';
import { loadProducts } from '@/lib/stock/catalog';
import { ContactFields, EMPTY_CONTACT, focusFirstError, type ContactValues } from './ContactFields';
import styles from './Basket.module.css';

export function PayAtCounterNote() {
  return (
    <p className={styles.counter}>
      <b>Pay at the counter.</b> Nothing is charged online. Pay when you pick up: cash, debit or
      credit. <Verify note="which payment methods the counter takes" />
    </p>
  );
}

export function BasketView({
  initialProducts,
  initialSettings,
}: {
  initialProducts: Product[];
  initialSettings: Settings;
}) {
  const cart = useCart();
  const toast = useToast();
  const prefix = useId().replace(/:/g, '');
  const settings = useRepoData((r) => r.getSettings(), initialSettings);
  const products = useRepoData((repo, source) => loadProducts(source, repo), initialProducts);
  const reserved = useRepoData((r) => r.listReservedQuantities(), {} as Record<string, number>);

  const [values, setValues] = useState<ContactValues>(EMPTY_CONTACT);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<OnlineOrder | null>(null);

  const rows = useMemo(() => {
    const bySku = new Map(products.map((p) => [p.sku, p]));
    return cart.lines.map((line) => {
      const p = bySku.get(line.sku);
      const reason = p ? unorderableReason(p) : 'This item is no longer sold online.';
      const max = p ? availableQty(p, reserved[line.sku] ?? 0) : 0;
      return { line, p, reason, max, ok: !!p && !reason && line.qty <= max };
    });
  }, [cart.lines, products, reserved]);
  const allOk = rows.length > 0 && rows.every((r) => r.ok);
  const totals = orderTotals(
    rows.filter((r) => r.p).map((r) => ({ unitPriceCents: r.p!.priceCents, qty: r.line.qty })),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const order = await getRepository().createOnlineOrder({
        name: values.name,
        phone: values.phone,
        email: values.email,
        marketingConsent: values.consent,
        note,
        lines: cart.lines.map(({ sku, qty }) => ({ sku, qty })),
      });
      cart.clear();
      setPlaced(order);
      toast(`Order ${order.number} received. Pay at the counter when you pick it up.`);
    } catch (err) {
      if (err instanceof RepositoryError && err.code === 'validation' && err.fields) {
        setErrors(err.fields);
        requestAnimationFrame(() => focusFirstError(prefix, err.fields ?? {}));
      } else if (err instanceof RepositoryError) {
        setErrors({ form: err.fields?.lines ?? err.message });
      } else {
        setErrors({ form: `Something went wrong. Please call us at ${STORE.phone}.` });
      }
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <section className={styles.done} aria-labelledby={`${prefix}-done`}>
        <div className={styles.doneHead}>
          <h2 id={`${prefix}-done`}>Order {placed.number} received</h2>
        </div>
        <div className={styles.doneBody}>
          <p>
            Thanks, {placed.name}. We&apos;ll pull your items and {placed.email ? 'email' : 'call'}{' '}
            you when they&apos;re ready. Total{' '}
            <b>{formatCents(orderTotals(placed.lines).totalCents)}</b> with HST.
          </p>
          <p>
            <b>Pay at the counter when you pick up.</b> Nothing has been charged. Give your name or
            order number {placed.number}.
          </p>
          {placed.email && (
            <p>A confirmation email would be sent in the full build. This is a demo.</p>
          )}
          <div className={styles.actions}>
            <ButtonLink href={`/order/${placed.id}`}>See your order</ButtonLink>
            <ButtonLink href="/stock" variant="white">
              Keep shopping
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  if (!settings.onlineOrdersEnabled) {
    return (
      <div className={`${styles.panel} ${styles.empty}`}>
        <p>
          <b>Online orders are paused right now.</b> You can still hold an item from the stock
          checker, or call {STORE.phone}.
        </p>
        <ButtonLink href="/stock">Check stock</ButtonLink>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={`${styles.panel} ${styles.empty}`}>
        <p>
          <b>Your basket is empty.</b> Add items from the stock checker, then pay for them at the
          counter when you pick them up.
        </p>
        <ButtonLink href="/stock">Check stock</ButtonLink>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <section className={styles.panel} aria-labelledby={`${prefix}-items`}>
        <div className={styles.panelHead}>
          <h2 id={`${prefix}-items`}>Your basket ({cart.count})</h2>
        </div>
        <ul className={styles.lines}>
          {rows.map(({ line, p, reason, max, ok }) => {
            const name = p?.name ?? line.sku;
            const limit = Math.max(max, 0);
            return (
              <li key={line.sku} className={styles.line} data-testid="basket-line">
                <div>
                  <div className={styles.name}>{name}</div>
                  {p && (
                    <div className={styles.unit}>{formatCents(p.priceCents)} each, before HST</div>
                  )}
                </div>
                <div className={styles.lineTotal}>
                  {p ? formatCents(p.priceCents * line.qty) : '—'}
                </div>
                <div className={styles.controls}>
                  <button
                    type="button"
                    className={styles.step}
                    onClick={() => cart.setQty(line.sku, line.qty - 1, limit)}
                    aria-label={`One fewer ${name}`}
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <output className={styles.qty} aria-label={`${name} quantity`}>
                    {line.qty}
                  </output>
                  <button
                    type="button"
                    className={styles.step}
                    onClick={() => cart.setQty(line.sku, line.qty + 1, limit)}
                    disabled={line.qty >= limit}
                    aria-label={`One more ${name}`}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => cart.remove(line.sku)}
                    aria-label={`Remove ${name}`}
                  >
                    Remove
                  </button>
                </div>
                {!ok && (
                  <p className={styles.warn} role="alert">
                    {reason ??
                      (limit === 0
                        ? 'All of these are reserved by other orders right now. Remove it, or call us.'
                        : `Only ${limit} can be ordered online right now. Lower the quantity to continue.`)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCents(totals.subtotalCents)}</dd>
          </div>
          <div>
            <dt>HST (13%)</dt>
            <dd>{formatCents(totals.hstCents)}</dd>
          </div>
          <div className={styles.grand}>
            <dt>Pay at the counter</dt>
            <dd data-testid="basket-total">{formatCents(totals.totalCents)}</dd>
          </div>
        </dl>
        <PayAtCounterNote />
      </section>

      <form className={styles.panel} onSubmit={submit} noValidate aria-labelledby={`${prefix}-who`}>
        <div className={styles.panelHead}>
          <h2 id={`${prefix}-who`}>Who&apos;s picking it up?</h2>
        </div>
        <div className={styles.form}>
          <ContactFields idPrefix={prefix} values={values} errors={errors} onChange={setValues} />
          <TextAreaField
            id={`${prefix}-note`}
            label="Anything we should know? (optional)"
            value={note}
            error={errors.note}
            onChange={(e) => setNote(e.target.value)}
          />
          {errors.form && (
            <p className={styles.error} role="alert">
              {errors.form}
            </p>
          )}
          {!allOk && (
            <p className={styles.error}>Fix the items marked above to place your order.</p>
          )}
          <div className={styles.actions}>
            <Button type="submit" disabled={busy || !allOk}>
              {busy ? 'Placing order…' : 'Place order'}
            </Button>
          </div>
          <p className={styles.unit}>
            We&apos;ll keep your order for {settings.orderHoldHours} hours once it&apos;s ready.{' '}
            <Verify note="how long ready orders are kept" />
          </p>
          <p className={styles.unit}>Demo: your details stay in this browser only.</p>
        </div>
      </form>
    </div>
  );
}
