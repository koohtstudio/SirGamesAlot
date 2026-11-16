import { describe, expect, it } from 'vitest';
import { addLine, cartCount, parseCart, removeLine, setLineQty } from './lines';

describe('basket lines', () => {
  it('adds, increases and caps quantities', () => {
    let l = addLine([], 'A');
    expect(l).toEqual([{ sku: 'A', qty: 1 }]);
    l = addLine(l, 'A', 2);
    expect(l[0]!.qty).toBe(3);
    l = addLine(l, 'A', 50);
    expect(l[0]!.qty).toBe(10); // per-line limit
    expect(addLine([], 'B', 5, 2)[0]!.qty).toBe(2); // what the shop can still sell
    expect(addLine([], 'B', 1, 0)).toEqual([]);
  });
  it('sets exact quantities and removes at zero', () => {
    const l = [{ sku: 'A', qty: 2 }];
    expect(setLineQty(l, 'A', 4)[0]!.qty).toBe(4);
    expect(setLineQty(l, 'A', 0)).toEqual([]);
    expect(setLineQty(l, 'A', 99, 3)[0]!.qty).toBe(3);
    expect(removeLine(l, 'A')).toEqual([]);
    expect(
      cartCount([
        { sku: 'A', qty: 2 },
        { sku: 'B', qty: 3 },
      ]),
    ).toBe(5);
  });
  it('limits how many different items fit in one basket', () => {
    let l: { sku: string; qty: number }[] = [];
    for (let i = 0; i < 25; i += 1) l = addLine(l, `S${i}`);
    expect(l).toHaveLength(20);
  });
  it('reads a saved basket defensively', () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart('not json')).toEqual([]);
    expect(parseCart('{"a":1}')).toEqual([]);
    expect(
      parseCart(
        JSON.stringify([
          { sku: 'A', qty: 2 },
          { sku: 'A', qty: 5 },
          { sku: '', qty: 1 },
          { sku: 'B', qty: 0 },
          { sku: 'C', qty: 1.5 },
          { sku: 'D', qty: 99 },
          null,
          'x',
        ]),
      ),
    ).toEqual([
      { sku: 'A', qty: 2 },
      { sku: 'D', qty: 10 },
    ]);
  });
});
