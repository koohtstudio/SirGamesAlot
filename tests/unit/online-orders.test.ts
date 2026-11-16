import { beforeEach, describe, expect, it } from 'vitest';
import { MockRepository, STATE_KEY } from '@/lib/data/mock/mock-repository';
import { RepositoryError } from '@/lib/data/repository';
import { orderTotals } from '@/lib/orders/orders';
import { summarizePayments } from '@/lib/orders/orders';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

const NOW = new Date('2026-11-11T17:00:00Z');
let storage: MemoryStorage;
let repo: MockRepository;
beforeEach(() => {
  storage = new MemoryStorage();
  repo = new MockRepository({ storage, now: () => NOW });
});

async function catchError(p: Promise<unknown>): Promise<RepositoryError> {
  try {
    await p;
  } catch (e) {
    return e as RepositoryError;
  }
  throw new Error('expected a RepositoryError');
}

const who = { name: 'Casey Buyer', phone: '705-555-0100', email: '', note: '' };

describe('placing an online order', () => {
  it('prices every line from the POS, never from the browser', async () => {
    const order = await repo.createOnlineOrder({
      ...who,
      // A browser could try to add its own price or name. Only sku and qty are read.
      lines: [{ sku: 'PT-LEADBELCHER', qty: 2, unitPriceCents: 1, name: 'Free paint' } as never],
      marketingConsent: false,
    });
    expect(order.lines).toEqual([
      { sku: 'PT-LEADBELCHER', name: 'Leadbelcher', unitPriceCents: 725, qty: 2 },
    ]);
    expect(order.status).toBe('placed');
    expect(order.number).toBe('SGL-1006');
    expect(orderTotals(order.lines).totalCents).toBe(1639);
  });

  it('merges repeated lines and numbers orders one after the other', async () => {
    const a = await repo.createOnlineOrder({
      ...who,
      lines: [
        { sku: 'PT-ABADDON', qty: 1 },
        { sku: 'PT-ABADDON', qty: 2 },
      ],
      marketingConsent: false,
    });
    expect(a.lines).toHaveLength(1);
    expect(a.lines[0]!.qty).toBe(3);
    const b = await repo.createOnlineOrder({
      ...who,
      lines: [{ sku: 'DD-DICE7', qty: 1 }],
      marketingConsent: false,
    });
    expect(b.number).toBe('SGL-1007');
  });

  it('refuses items with no price, out of stock, or order-in only', async () => {
    for (const sku of ['WH-ARMAGEDDON', 'PT-MACRAGGE', 'WH-KT-START']) {
      const e = await catchError(
        repo.createOnlineOrder({ ...who, lines: [{ sku, qty: 1 }], marketingConsent: false }),
      );
      expect(e.code).toBe('conflict');
    }
    const unknown = await catchError(
      repo.createOnlineOrder({ ...who, lines: [{ sku: 'NOPE', qty: 1 }], marketingConsent: false }),
    );
    expect(unknown.code).toBe('not-found');
  });

  it('needs a name, a way to reach the customer and a sensible quantity', async () => {
    const noContact = await catchError(
      repo.createOnlineOrder({
        name: 'Casey',
        phone: '',
        email: '',
        note: '',
        lines: [{ sku: 'DD-DICE7', qty: 1 }],
        marketingConsent: false,
      }),
    );
    expect(noContact.code).toBe('validation');
    const tooMany = await catchError(
      repo.createOnlineOrder({
        ...who,
        lines: [{ sku: 'DD-DICE7', qty: 11 }],
        marketingConsent: false,
      }),
    );
    expect(tooMany.code).toBe('validation');
    const empty = await catchError(
      repo.createOnlineOrder({ ...who, lines: [], marketingConsent: false }),
    );
    expect(empty.code).toBe('validation');
  });

  it('holds stock for open orders so the same unit is never sold twice', async () => {
    // Wingspan: 2 on the shelf, the seeded order for it was cancelled.
    expect((await repo.listReservedQuantities())['BG-WINGSPAN']).toBeUndefined();
    await repo.createOnlineOrder({
      ...who,
      lines: [{ sku: 'BG-WINGSPAN', qty: 2 }],
      marketingConsent: false,
    });
    expect((await repo.listReservedQuantities())['BG-WINGSPAN']).toBe(2);
    const e = await catchError(
      repo.createOnlineOrder({
        ...who,
        lines: [{ sku: 'BG-WINGSPAN', qty: 1 }],
        marketingConsent: false,
      }),
    );
    expect(e.code).toBe('conflict');
    expect(e.message).toMatch(/reserved/);
  });

  it('can be paused in settings', async () => {
    await repo.updateSettings({ onlineOrdersEnabled: false });
    const e = await catchError(
      repo.createOnlineOrder({
        ...who,
        lines: [{ sku: 'DD-DICE7', qty: 1 }],
        marketingConsent: false,
      }),
    );
    expect(e.message).toMatch(/paused/);
  });

  it('queues a confirmation email only when there is an email, and adds the customer', async () => {
    const before = (await repo.listOutbox()).length;
    await repo.createOnlineOrder({
      ...who,
      lines: [{ sku: 'DD-DICE7', qty: 1 }],
      marketingConsent: false,
    });
    expect(await repo.listOutbox()).toHaveLength(before);
    await repo.createOnlineOrder({
      ...who,
      name: 'Email Person',
      phone: '',
      email: 'ep@x.test',
      lines: [{ sku: 'DD-DICE7', qty: 1 }],
      marketingConsent: true,
    });
    const out = await repo.listOutbox();
    expect(out[0]).toMatchObject({ kind: 'order-received', to: 'ep@x.test' });
    expect(out[0]!.body).toMatch(/Nothing has been charged/);
    const customers = await repo.listCustomers();
    expect(customers.find((c) => c.email === 'ep@x.test')).toMatchObject({
      marketingConsent: true,
      consentSource: 'website basket',
    });
  });
});

describe('preparing, paying and cancelling', () => {
  async function place(sku = 'PT-ABADDON', qty = 2) {
    return repo.createOnlineOrder({
      ...who,
      email: 'pay@x.test',
      lines: [{ sku, qty }],
      marketingConsent: false,
    });
  }

  it('goes placed → ready (with a pickup hold) → paid at the counter', async () => {
    const o = await place();
    const ready = await repo.markOrderReady(o.id);
    expect(ready.status).toBe('ready');
    expect(ready.holdUntil).toBe(new Date(NOW.getTime() + 48 * 3_600_000).toISOString());
    expect((await repo.listOutbox())[0]).toMatchObject({ kind: 'order-ready', to: 'pay@x.test' });

    const total = orderTotals(o.lines).totalCents;
    const paid = await repo.takeCounterPayment(
      o.id,
      { method: 'cash', tenderedCents: total + 500, reference: '' },
      'staff',
    );
    expect(paid.status).toBe('completed');
    expect(paid.payment).toMatchObject({
      method: 'cash',
      amountCents: total,
      tenderedCents: total + 500,
      takenBy: 'staff',
    });
    // Paid orders no longer hold stock: the unit left the shelf (the POS count takes over).
    expect((await repo.listReservedQuantities())['PT-ABADDON']).toBeUndefined();
  });

  it('cannot take payment before ready, or twice', async () => {
    const o = await place();
    expect(
      (await catchError(repo.takeCounterPayment(o.id, { method: 'debit', reference: '' }, 'staff')))
        .message,
    ).toMatch(/ready/);
    await repo.markOrderReady(o.id);
    await repo.takeCounterPayment(o.id, { method: 'debit', reference: '1234' }, 'owner');
    const again = await catchError(
      repo.takeCounterPayment(o.id, { method: 'debit', reference: '' }, 'owner'),
    );
    expect(again.code).toBe('conflict');
  });

  it('rejects cash that does not cover the total', async () => {
    const o = await place();
    await repo.markOrderReady(o.id);
    const e = await catchError(
      repo.takeCounterPayment(o.id, { method: 'cash', tenderedCents: 100, reference: '' }, 'staff'),
    );
    expect(e.code).toBe('validation');
    expect(e.fields?.tenderedCents).toMatch(/less than/);
    expect((await repo.getOnlineOrder(o.id))!.status).toBe('ready');
  });

  it('card and other methods ignore a tendered amount', async () => {
    const o = await place();
    await repo.markOrderReady(o.id);
    const paid = await repo.takeCounterPayment(
      o.id,
      { method: 'credit', tenderedCents: 99999, reference: 'AUTH 77' },
      'staff',
    );
    expect(paid.payment!.tenderedCents).toBeUndefined();
    expect(paid.payment!.reference).toBe('AUTH 77');
  });

  it('undoing a payment puts the order back to ready', async () => {
    const o = await place();
    await repo.markOrderReady(o.id);
    await repo.takeCounterPayment(o.id, { method: 'debit', reference: '' }, 'staff');
    const undone = await repo.voidCounterPayment(o.id);
    expect(undone.status).toBe('ready');
    expect(undone.payment).toBeUndefined();
    expect((await catchError(repo.voidCounterPayment(o.id))).code).toBe('conflict');
  });

  it('cancelling releases the stock and says who cancelled', async () => {
    const o = await place('BG-WINGSPAN', 2);
    expect((await repo.listReservedQuantities())['BG-WINGSPAN']).toBe(2);
    const c = await repo.cancelOnlineOrder(o.id, 'staff', 'Customer called');
    expect(c).toMatchObject({
      status: 'cancelled',
      cancelledBy: 'staff',
      cancelReason: 'Customer called',
    });
    expect((await repo.listReservedQuantities())['BG-WINGSPAN']).toBeUndefined();
    expect((await repo.listOutbox())[0]).toMatchObject({ kind: 'order-cancelled' });
    expect((await catchError(repo.cancelOnlineOrder(o.id, 'staff'))).code).toBe('conflict');
    expect((await catchError(repo.markOrderReady(o.id))).code).toBe('conflict');
  });

  it('will not cancel a paid order until the payment is undone', async () => {
    const o = await place();
    await repo.markOrderReady(o.id);
    await repo.takeCounterPayment(o.id, { method: 'debit', reference: '' }, 'staff');
    expect((await catchError(repo.cancelOnlineOrder(o.id, 'staff'))).message).toMatch(
      /Undo the payment/,
    );
  });

  it('keeps staff notes short and trimmed', async () => {
    const o = await place();
    await repo.setOrderStaffNote(o.id, '  Bag separately  ');
    expect((await repo.getOnlineOrder(o.id))!.staffNote).toBe('Bag separately');
    await repo.setOrderStaffNote(o.id, '   ');
    expect((await repo.getOnlineOrder(o.id))!.staffNote).toBeUndefined();
  });

  it('finds an order by its own id only', async () => {
    const o = await place();
    expect((await repo.getOnlineOrder(o.id))!.number).toBe(o.number);
    expect(await repo.getOnlineOrder('oo-nope')).toBeNull();
  });
});

describe('sample orders and saved demo data', () => {
  it('seeds orders in every status and a payment summary that adds up', async () => {
    const all = await repo.listOnlineOrders();
    expect(new Set(all.map((o) => o.status))).toEqual(
      new Set(['placed', 'ready', 'completed', 'cancelled']),
    );
    const s = summarizePayments(all);
    expect(s.count).toBe(2);
    expect(s.totalCents).toBe(s.subtotalCents + s.hstCents);
    expect(s.byMethod.cash.count).toBe(1);
    expect(s.byMethod.debit.count).toBe(1);
  });

  it('survives a reload from storage', async () => {
    const o = await repo.createOnlineOrder({
      ...who,
      lines: [{ sku: 'DD-DICE7', qty: 1 }],
      marketingConsent: false,
    });
    const again = new MockRepository({ storage, now: () => NOW });
    expect((await again.getOnlineOrder(o.id))!.number).toBe(o.number);
  });

  it('replaces older saved demo data that has no orders', async () => {
    storage.setItem(STATE_KEY, JSON.stringify({ version: 1, settings: {} }));
    const fresh = new MockRepository({ storage, now: () => NOW });
    expect(await fresh.listOnlineOrders()).toHaveLength(5);
  });
});
