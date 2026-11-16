'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { addLine, cartCount, parseCart, removeLine, setLineQty, type CartLine } from './lines';

const KEY = 'sgal-cart-v1';
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();

/** Used when localStorage is blocked, so the basket still works for the visit. */
let memory: CartLine[] = EMPTY;
let cache: { raw: string | null; lines: CartLine[] } | null = null;

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return memory;
    if (cache && cache.raw === raw) return cache.lines;
    const lines = parseCart(raw);
    cache = { raw, lines };
    return lines;
  } catch {
    return memory;
  }
}

function write(lines: CartLine[]) {
  memory = lines.length ? lines : EMPTY;
  try {
    if (lines.length) window.localStorage.setItem(KEY, JSON.stringify(lines));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Blocked or full: the in-memory basket keeps working until the tab closes.
  }
  cache = null;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cache = null;
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

/** The shopper's basket, kept in this browser. Server render and hydration see an empty basket. */
export function useCart() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const add = useCallback(
    (sku: string, qty = 1, max?: number) => write(addLine(read(), sku, qty, max)),
    [],
  );
  const setQty = useCallback(
    (sku: string, qty: number, max?: number) => write(setLineQty(read(), sku, qty, max)),
    [],
  );
  const remove = useCallback((sku: string) => write(removeLine(read(), sku)), []);
  const clear = useCallback(() => write(EMPTY), []);
  return { lines, count: cartCount(lines), add, setQty, remove, clear };
}
