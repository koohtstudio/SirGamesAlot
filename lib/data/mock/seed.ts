import { addDays } from 'date-fns';
import { DEFAULT_HOURS } from '@/lib/hours/hours';
import { nthWeekdayOfMonth } from '@/lib/events/recurrence';
import { orderTotals } from '@/lib/orders/orders';
import type {
  BackInStockRequest,
  Customer,
  EventSeries,
  EventSignup,
  Hold,
  OnlineOrder,
  OneOffEvent,
  Settings,
  SpecialOrder,
} from '@/lib/domain/types';

export interface DemoState {
  /** Bumped when the shape changes. Older saved demo data is replaced by fresh sample data. */
  version: 2;
  settings: Settings;
  series: EventSeries[];
  oneOffs: OneOffEvent[];
  signups: EventSignup[];
  /** Event ids that already have their sample sign-ups, so re-seeding never duplicates. */
  seededEvents: string[];
  holds: Hold[];
  orders: SpecialOrder[];
  /** Online orders: a basket paid for at the counter. */
  onlineOrders: OnlineOrder[];
  /** Last used order number. */
  orderSeq: number;
  backInStock: BackInStockRequest[];
  customers: Customer[];
  overrides: import('@/lib/domain/types').ProductOverride[];
  outbox: import('@/lib/domain/types').OutboxMessage[];
}

export function defaultSettings(): Settings {
  return {
    // Off by default: the construction notice and Coulter Street entrance came from the old concept and may be
    // out of date (docs/CONTENT_TODO.md). The owner can switch it on in Admin → Settings.
    banner: {
      enabled: false,
      headline: "YES, WE'RE OPEN!",
      body: 'Mall construction has closed the main doors. Use the Coulter Street entrance and head to the lower level.',
      linkLabel: 'Entrance map →',
      linkHref: '/visit#entrance',
    },
    weeklyHours: structuredClone(DEFAULT_HOURS),
    holidayOverrides: [
      {
        id: 'hol-0',
        date: '2027-08-02',
        label: 'Civic Holiday (sample: open regular hours)',
        hours: { open: '09:30', close: '21:00' },
      },
      {
        id: 'hol-1',
        date: '2026-12-24',
        label: 'Christmas Eve (sample)',
        hours: { open: '09:30', close: '17:00' },
      },
      { id: 'hol-2', date: '2026-12-25', label: 'Christmas Day (sample)', hours: null },
      { id: 'hol-3', date: '2027-01-01', label: "New Year's Day (sample)", hours: null },
    ],
    holdHours: 24,
    onlineOrdersEnabled: true,
    orderHoldHours: 48,
    d20PromoEnabled: true,
    nextAnniversaryLabel: 'May 2027 · date TBA',
  };
}

const series = (): EventSeries[] => [
  {
    id: 'ser-40k',
    title: 'Warhammer 40K tournament',
    type: 'warhammer',
    rule: { kind: 'nth-weekday', weekday: 6, nth: 3 },
    startTime: '10:00',
    endTime: '18:00',
    capacity: 16,
    feeCents: 2500,
    note: 'Sample date and fee · 24 players at the last one',
    description:
      'Warhammer 40,000 tournaments run in the store: the last one had 24 players, with casual 40K, an Age of Sigmar league and a D&D table going at the same time. Date, fee and format here are examples until the owner confirms them.',
  },
  {
    id: 'ser-paint',
    title: 'Paint night',
    type: 'paint',
    rule: { kind: 'last-weekday', weekday: 2 },
    startTime: '17:30',
    endTime: '20:30',
    capacity: 12,
    feeCents: 0,
    note: 'Free with your own paints · $5 rental supplies',
    description:
      'Our monthly Paint Night, on a Tuesday from 5:30 to 8:30. Work on anything: Warhammer, D&D, Middle-earth, Battletech, historical minis or minis from board games. Newcomers and veteran painters are both welcome, and staff can show you paint thinning, contrast painting, shading, dry-brushing, highlighting and slap-chop. Rental supplies are $5 if you have none; bring your own paints and brushes and it is free. Which Tuesday of the month and the seat count are examples until confirmed.',
  },
  {
    id: 'ser-riftbound',
    title: 'Riftbound league night',
    type: 'cards',
    rule: { kind: 'nth-weekday', weekday: 5, nth: 2 },
    startTime: '18:00',
    endTime: '22:00',
    capacity: 24,
    feeCents: 1000,
    note: 'Sample event · League of Legends TCG',
    description:
      'Riftbound booster packs launched in the store and sold out fast. This league night is an example of what could run next; there is no confirmed league yet.',
  },
  {
    id: 'ser-dnd',
    title: 'D&D one-shot',
    type: 'dnd',
    rule: { kind: 'weekly', weekday: 5 },
    startTime: '18:30',
    endTime: '22:00',
    capacity: 6,
    feeCents: 1000,
    note: 'Sample event · new players welcome',
    description:
      'An example of a drop-in Dungeons & Dragons one-shot. The store has D&D tables running on busy event days (nine adventurers at the last tournament), but a weekly one-shot is not confirmed.',
  },
];

/** Third Saturday of November, or first Saturday of December if that has passed. */
function holidayEventDate(now: Date): string {
  const y = now.getUTCFullYear();
  const today = now.toISOString().slice(0, 10);
  const nov = nthWeekdayOfMonth(y, 10, 6, 3);
  if (nov >= today) return nov;
  const dec = nthWeekdayOfMonth(y, 11, 6, 1);
  if (dec >= today) return dec;
  return nthWeekdayOfMonth(y + 1, 10, 6, 3);
}

const oneOffs = (now: Date): OneOffEvent[] => [
  {
    id: 'evt-holiday',
    slug: 'holiday-shopping-event',
    date: holidayEventDate(now),
    title: 'Holiday shopping event',
    type: 'store',
    startTime: '10:00',
    endTime: '17:00',
    capacity: 0,
    feeCents: 0,
    note: 'Sample date · sales, vendors, cosplay contest',
    description:
      'Last year the store ran a November event on Saturday, Nov 15 with local vendors for Christmas gifts, gaming, snacks, sales and a cosplay contest at 2 pm. This date is an example for this year. Flyers say: take 10% off, or roll a d20 for a chance at 1 to 20% off.',
  },
  {
    id: 'evt-past-21',
    slug: '21st-anniversary-event-2026-05-16',
    date: '2026-05-16',
    title: '21st Anniversary Event',
    type: 'store',
    startTime: '10:00',
    endTime: '17:00',
    capacity: 0,
    feeCents: 0,
    note: 'Cosplay contest at 2 pm',
    description:
      'Anniversary event with sales, vendors, gaming, snacks and a cosplay contest at 2 pm. $5 off for anyone in costume, and take 10% off or roll a d20 for 1 to 20% off.',
  },
  {
    id: 'evt-past-nbc',
    slug: 'nightmare-before-christmas-event-2025-11-15',
    date: '2025-11-15',
    title: 'Nightmare Before Christmas Event',
    type: 'store',
    startTime: '10:00',
    endTime: '17:00',
    capacity: 0,
    feeCents: 0,
    note: 'Cosplay contest at 2 pm',
    description:
      'The Nightmare Before Christmas event: sales, gaming, a vendor and craft show, snacks and a cosplay contest at 2 pm, with Doug Laurie Sports and local vendors. Lower level of the Bayfield Mall, 10 am to 5 pm.',
  },
  {
    id: 'evt-past-20',
    slug: '20th-anniversary-event-2025-05-03',
    date: '2025-05-03',
    title: '20th Anniversary Event',
    type: 'store',
    startTime: '10:00',
    endTime: '17:00',
    capacity: 0,
    feeCents: 0,
    note: 'Cosplay contest at 3:30 pm',
    description:
      'The annual anniversary event at the new lower-level location: sales, vendors, gaming and snacks all day, a cosplay contest at 3:30 pm, an extra $5 off for anyone in costume and the famous Take 10 sale. Doug Laurie Sports held its grand opening across the way.',
  },
  {
    id: 'evt-past-may4',
    slug: 'may-the-fourth-event-2024-05-04',
    date: '2024-05-04',
    title: 'May the Fourth Event',
    type: 'store',
    startTime: '10:00',
    endTime: '16:00',
    capacity: 0,
    feeCents: 0,
    note: 'Star Wars meet-up at 2 pm · cosplay contest at 2:30 pm',
    description:
      'Cosplay, gaming, vendors, sales and snacks from 10 to 4, a Star Wars photo meet-up at 2 pm and a free cosplay contest at 2:30 pm. $5 off any purchase in costume, plus the Take 10 sale.',
  },
];

const mins = (now: Date, m: number) => new Date(now.getTime() + m * 60_000).toISOString();

export function buildSeed(now: Date): DemoState {
  const holds: Hold[] = [
    {
      id: 'hold-seed-1',
      sku: 'PT-NULN',
      productName: 'Nuln Oil',
      name: 'Sample: Jordan',
      phone: '705-555-0123',
      createdAt: mins(now, -22 * 60),
      expiresAt: mins(now, 2 * 60),
      status: 'active',
    },
    {
      id: 'hold-seed-2',
      sku: 'WH-CODEX-SM',
      productName: 'Codex: Space Marines',
      name: 'Sample: Priya',
      email: 'sample-priya@example.invalid',
      createdAt: mins(now, -3 * 60),
      expiresAt: mins(now, 21 * 60),
      status: 'active',
    },
    {
      id: 'hold-seed-3',
      sku: 'BG-WINGSPAN',
      productName: 'Wingspan',
      name: 'Sample: Sam',
      phone: '705-555-0188',
      createdAt: mins(now, -50 * 60),
      expiresAt: mins(now, -26 * 60),
      status: 'active',
    },
  ];
  const orders: SpecialOrder[] = [
    {
      id: 'ord-seed-1',
      sku: 'WH-KT-START',
      productName: 'Kill Team starter set',
      name: 'Sample: Alex',
      email: 'sample-alex@example.invalid',
      note: '',
      createdAt: mins(now, -26 * 60),
      stage: 'requested',
    },
    {
      id: 'ord-seed-2',
      productName: 'Gloomhaven (second printing)',
      name: 'Sample: Morgan',
      phone: '705-555-0147',
      note: 'Birthday gift, needed by the 20th.',
      createdAt: mins(now, -4 * 24 * 60),
      stage: 'ordered',
    },
    {
      id: 'ord-seed-3',
      sku: 'DD-EBERRON',
      productName: 'Eberron setting book',
      name: 'Sample: Riley',
      email: 'sample-riley@example.invalid',
      note: '',
      createdAt: mins(now, -6 * 24 * 60),
      stage: 'arrived',
    },
  ];
  const line = (sku: string, name: string, unitPriceCents: number, qty: number) => ({
    sku,
    name,
    unitPriceCents,
    qty,
  });
  const holdMs = (h: number) => h * 3_600_000;
  const readyAt = mins(now, -3 * 60);
  const catan = [line('BG-CATAN', 'Catan', 6499, 1)];
  const phb = [line('DD-PHB', "D&D Player's Handbook", 6999, 1)];
  const onlineOrders: OnlineOrder[] = [
    {
      id: 'oo-seed-1',
      number: 'SGL-1001',
      name: 'Sample: Jordan',
      phone: '705-555-0123',
      note: 'Please bag the paints separately.',
      lines: [line('PT-LEADBELCHER', 'Leadbelcher', 725, 2), line('PT-NULN', 'Nuln Oil', 1075, 1)],
      status: 'placed',
      createdAt: mins(now, -2 * 60),
    },
    {
      id: 'oo-seed-2',
      number: 'SGL-1002',
      name: 'Sample: Priya',
      email: 'sample-priya@example.invalid',
      lines: [line('WH-CODEX-SM', 'Codex: Space Marines', 7500, 1)],
      status: 'ready',
      createdAt: mins(now, -26 * 60),
      readyAt,
      holdUntil: new Date(new Date(readyAt).getTime() + holdMs(48)).toISOString(),
    },
    {
      id: 'oo-seed-3',
      number: 'SGL-1003',
      name: 'Sample: Sam',
      phone: '705-555-0188',
      lines: catan,
      status: 'completed',
      createdAt: mins(now, -5 * 60),
      readyAt: mins(now, -4 * 60),
      holdUntil: mins(now, 44 * 60),
      completedAt: mins(now, -30),
      payment: {
        method: 'cash',
        amountCents: orderTotals(catan).totalCents,
        tenderedCents: 8000,
        takenAt: mins(now, -30),
        takenBy: 'staff',
      },
    },
    {
      id: 'oo-seed-4',
      number: 'SGL-1004',
      name: 'Sample: Morgan',
      phone: '705-555-0147',
      lines: phb,
      status: 'completed',
      createdAt: mins(now, -50 * 60),
      readyAt: mins(now, -48 * 60),
      holdUntil: mins(now, 0),
      completedAt: mins(now, -26 * 60),
      payment: {
        method: 'debit',
        amountCents: orderTotals(phb).totalCents,
        reference: '4821',
        takenAt: mins(now, -26 * 60),
        takenBy: 'owner',
      },
    },
    {
      id: 'oo-seed-5',
      number: 'SGL-1005',
      name: 'Sample: Quinn',
      email: 'sample-quinn@example.invalid',
      lines: [line('BG-WINGSPAN', 'Wingspan', 7999, 1)],
      status: 'cancelled',
      createdAt: mins(now, -8 * 60),
      cancelledAt: mins(now, -5 * 60),
      cancelledBy: 'customer',
      cancelReason: 'Found a copy as a gift.',
    },
  ];
  const backInStock: BackInStockRequest[] = [
    {
      id: 'bis-seed-1',
      sku: 'PT-MACRAGGE',
      productName: 'Macragge Blue',
      name: 'Sample: Taylor',
      email: 'sample-taylor@example.invalid',
      createdAt: mins(now, -2 * 24 * 60),
    },
    {
      id: 'bis-seed-2',
      sku: 'PT-MACRAGGE',
      productName: 'Macragge Blue',
      name: 'Sample: Devon',
      phone: '705-555-0166',
      createdAt: mins(now, -24 * 60),
    },
    {
      id: 'bis-seed-3',
      sku: 'BG-CODENAMES',
      productName: 'Codenames',
      name: 'Sample: Quinn',
      email: 'sample-quinn@example.invalid',
      createdAt: mins(now, -5 * 60),
    },
  ];
  const created = mins(now, -7 * 24 * 60);
  const customers: Customer[] = [
    {
      id: 'cus-seed-1',
      name: 'Sample: Jordan',
      phone: '705-555-0123',
      interests: ['Paints', 'Warhammer'],
      marketingConsent: true,
      consentAt: created,
      consentSource: 'website hold form',
      createdAt: created,
    },
    {
      id: 'cus-seed-2',
      name: 'Sample: Priya',
      email: 'sample-priya@example.invalid',
      interests: ['Warhammer'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-3',
      name: 'Sample: Sam',
      phone: '705-555-0188',
      interests: ['Board games'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-4',
      name: 'Sample: Alex',
      email: 'sample-alex@example.invalid',
      interests: ['Warhammer'],
      marketingConsent: true,
      consentAt: created,
      consentSource: 'website order form',
      createdAt: created,
    },
    {
      id: 'cus-seed-5',
      name: 'Sample: Morgan',
      phone: '705-555-0147',
      interests: ['Board games'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-6',
      name: 'Sample: Riley',
      email: 'sample-riley@example.invalid',
      interests: ['D&D'],
      marketingConsent: true,
      consentAt: created,
      consentSource: 'website order form',
      createdAt: created,
    },
    {
      id: 'cus-seed-7',
      name: 'Sample: Taylor',
      email: 'sample-taylor@example.invalid',
      interests: ['Paints'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-8',
      name: 'Sample: Devon',
      phone: '705-555-0166',
      interests: ['Paints'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-9',
      name: 'Sample: Quinn',
      email: 'sample-quinn@example.invalid',
      interests: ['Board games'],
      marketingConsent: true,
      consentAt: created,
      consentSource: 'website back-in-stock form',
      createdAt: created,
    },
  ];
  return {
    version: 2,
    settings: defaultSettings(),
    series: series(),
    oneOffs: oneOffs(now),
    signups: [],
    seededEvents: [],
    holds,
    orders,
    onlineOrders,
    orderSeq: 1005,
    backInStock,
    customers,
    overrides: [],
    outbox: [],
  };
}

export const SAMPLE_NAMES = [
  'Ranger Rae',
  'Captain Cass',
  'Dice Dan',
  'Paladin Pat',
  'Wizard Wren',
  'Rogue Robin',
  'Bard Blake',
  'Cleric Casey',
  'Druid Drew',
  'Monk Max',
  'Warlock Wes',
  'Sorcerer Sky',
  'Tinker Tess',
  'Scout Sid',
  'Knight Kai',
  'Alchemist Ash',
  'Brawler Bo',
  'Minis Mel',
  'Painter Pru',
  'Tactician Tom',
  'Healer Hal',
  'Smith Sol',
  'Hunter Hue',
  'Sage Sam',
];

/** Small deterministic hash so demo sign-up counts are stable for a given event. */
export function hash01(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export function horizonDate(now: Date, days: number): Date {
  return addDays(now, days);
}
