import { MAX_LINES_PER_ORDER, MAX_QTY_PER_LINE } from '@/lib/domain/schemas';

/** A basket line is only a sku and a quantity. Names and prices are always looked up fresh. */
export interface CartLine {
  sku: string;
  qty: number;
}

const clamp = (qty: number, max: number) =>
  Math.max(0, Math.min(Math.floor(qty), Math.min(max, MAX_QTY_PER_LINE)));

/** Add units of an item, never past `max` (what the website will still sell) or the per-line limit. */
export function addLine(
  lines: CartLine[],
  sku: string,
  qty = 1,
  max = MAX_QTY_PER_LINE,
): CartLine[] {
  const existing = lines.find((l) => l.sku === sku);
  if (existing) {
    return lines.map((l) => (l.sku === sku ? { ...l, qty: clamp(l.qty + qty, max) } : l));
  }
  if (lines.length >= MAX_LINES_PER_ORDER) return lines;
  const q = clamp(qty, max);
  return q > 0 ? [...lines, { sku, qty: q }] : lines;
}

/** Set an exact quantity. Zero removes the line. */
export function setLineQty(
  lines: CartLine[],
  sku: string,
  qty: number,
  max = MAX_QTY_PER_LINE,
): CartLine[] {
  const q = clamp(qty, max);
  return q === 0
    ? lines.filter((l) => l.sku !== sku)
    : lines.map((l) => (l.sku === sku ? { ...l, qty: q } : l));
}

export const removeLine = (lines: CartLine[], sku: string): CartLine[] =>
  lines.filter((l) => l.sku !== sku);

export const cartCount = (lines: CartLine[]): number => lines.reduce((n, l) => n + l.qty, 0);

/** Read a saved basket defensively: anything odd is dropped, so a bad value can never break the page. */
export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    const out: CartLine[] = [];
    for (const item of data) {
      if (typeof item !== 'object' || item === null) continue;
      const { sku, qty } = item as Record<string, unknown>;
      if (typeof sku !== 'string' || sku === '' || sku.length > 60 || seen.has(sku)) continue;
      if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1) continue;
      seen.add(sku);
      out.push({ sku, qty: Math.min(qty, MAX_QTY_PER_LINE) });
      if (out.length >= MAX_LINES_PER_ORDER) break;
    }
    return out;
  } catch {
    return [];
  }
}
