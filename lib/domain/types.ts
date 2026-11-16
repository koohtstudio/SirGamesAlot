/**
 * Domain types for Sir Games-A-Lot. Everything money-related is integer cents.
 * Dates that are instants are ISO-8601 strings in UTC; calendar dates are "yyyy-MM-dd"
 * strings meaning a date in America/Toronto.
 */

export const CATEGORIES = [
  'Warhammer',
  'Paints',
  'StarCraft',
  'D&D',
  'Cards',
  'Board games',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type StockStatus = 'in' | 'low' | 'order' | 'out';

/** One row as the POS (or CSV export) would report it. */
export interface InventoryItem {
  sku: string;
  name: string;
  description: string;
  category: Category;
  /** Integer cents before HST. 0 means "ask in store". */
  priceCents: number;
  /** Units on the shelf according to the POS. */
  count: number;
  /** Can the store order it in when the count is 0? */
  orderable: boolean;
  shelf: string;
}

/** Owner/staff manual overrides, layered on top of POS counts. */
export interface ProductOverride {
  sku: string;
  status?: StockStatus;
  shelf?: string;
  lowThreshold?: number;
}

/** What the public site and admin actually show. */
export interface Product extends InventoryItem {
  status: StockStatus;
  lowThreshold: number;
  /** True when staff changed status, shelf or threshold by hand. */
  overridden: boolean;
  /** True when staff pinned the status by hand (so POS counts no longer change it). */
  statusOverridden: boolean;
}

export type HoldStatus = 'active' | 'picked-up' | 'expired' | 'cancelled';
export interface Hold {
  id: string;
  sku: string;
  productName: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  expiresAt: string;
  status: HoldStatus;
}

export const ORDER_STAGES = ['requested', 'ordered', 'arrived', 'picked-up'] as const;
export type OrderStage = (typeof ORDER_STAGES)[number];
export interface SpecialOrder {
  id: string;
  /** Set when it came from the stock checker. Free-text orders have no sku. */
  sku?: string;
  productName: string;
  name: string;
  phone?: string;
  email?: string;
  note?: string;
  createdAt: string;
  stage: OrderStage;
}

export interface BackInStockRequest {
  id: string;
  sku: string;
  productName: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  notifiedAt?: string;
}

export const EVENT_TYPES = ['warhammer', 'paint', 'cards', 'dnd', 'store'] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  warhammer: 'Warhammer',
  paint: 'Paint night',
  cards: 'Cards',
  dnd: 'D&D',
  store: 'Store event',
};

/** Weekday numbers follow JS: 0 = Sunday ... 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type RecurrenceRule =
  | { kind: 'weekly'; weekday: Weekday }
  | { kind: 'nth-weekday'; weekday: Weekday; nth: 1 | 2 | 3 | 4 }
  | { kind: 'last-weekday'; weekday: Weekday };

interface EventFields {
  title: string;
  type: EventType;
  /** "HH:mm" in America/Toronto. */
  startTime: string;
  endTime: string;
  /** 0 means open to everyone, no seats to manage. */
  capacity: number;
  /** Cents. 0 means free. Paid at the counter in Phase 1. */
  feeCents: number;
  note: string;
  description: string;
  /** An example listing the store has not confirmed. Shown with a "Sample" badge. */
  sample?: boolean;
}

/** A single dated event stored directly (one-off). */
export interface OneOffEvent extends EventFields {
  id: string;
  slug: string;
  /** "yyyy-MM-dd" in America/Toronto. */
  date: string;
}

/** A recurring series. Occurrences are generated, never stored. */
export interface EventSeries extends EventFields {
  id: string;
  rule: RecurrenceRule;
}

/** A concrete event on a concrete date, as shown on the site. */
export interface StoreEvent extends EventFields {
  /** One-offs: their id. Occurrences: `${seriesId}__${date}`. */
  id: string;
  slug: string;
  seriesId?: string;
  date: string;
  startsAt: string;
  endsAt: string;
}

export type SignupStatus = 'seated' | 'waitlist' | 'checked-in' | 'no-show' | 'cancelled';
export interface EventSignup {
  id: string;
  eventId: string;
  name: string;
  email: string;
  status: SignupStatus;
  createdAt: string;
  marketingConsent: boolean;
}

export const INTERESTS = ['Warhammer', 'D&D', 'Cards', 'Board games', 'Paints'] as const;
export type Interest = (typeof INTERESTS)[number];
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  interests: Interest[];
  /** CASL: true only when they ticked the opt-in box. Confirmations are transactional. */
  marketingConsent: boolean;
  consentAt?: string;
  consentSource?: string;
  createdAt: string;
}

export interface DayHours {
  /** "HH:mm" 24 h, or null when closed that day. */
  open: string;
  close: string;
}
/** Keyed by JS weekday number as a string: "0" = Sunday. */
export type WeeklyHours = Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', DayHours | null>;

export interface HolidayOverride {
  id: string;
  /** "yyyy-MM-dd" */
  date: string;
  label: string;
  /** null means closed all day. */
  hours: DayHours | null;
}

export interface BannerSettings {
  enabled: boolean;
  headline: string;
  body: string;
  linkLabel: string;
  linkHref: string;
}

export interface Settings {
  banner: BannerSettings;
  /** Online orders (a basket you pay for at the counter). Off hides the basket everywhere. */
  onlineOrdersEnabled: boolean;
  /** How long a ready order is kept for pickup, in hours. */
  orderHoldHours: number;
  weeklyHours: WeeklyHours;
  holidayOverrides: HolidayOverride[];
  /** How long a website hold is kept, in hours. */
  holdHours: number;
  d20PromoEnabled: boolean;
  /** Shown on the events page until a date is announced. */
  nextAnniversaryLabel: string;
}

export interface OutboxMessage {
  id: string;
  kind:
    | 'hold-confirmation'
    | 'back-in-stock'
    | 'order-arrived'
    | 'event-confirmation'
    | 'event-promoted'
    | 'order-received'
    | 'order-ready'
    | 'order-cancelled'
    | 'other';
  to: string;
  subject: string;
  body: string;
  createdAt: string;
}

/**
 * Online orders: the customer fills a basket on the website and pays at the counter when they pick up.
 * Nothing is ever charged online. placed → ready → completed (paid at the counter), or cancelled.
 */
export const ORDER_STATUSES = ['placed', 'ready', 'completed', 'cancelled'] as const;
export type OnlineOrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'debit', 'credit', 'gift-card', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface OrderLine {
  sku: string;
  /** Name and price are copied from the POS when the order is placed, so later price changes never rewrite it. */
  name: string;
  unitPriceCents: number;
  qty: number;
}

/** Money taken at the counter. The amount is always the order total; there are no part payments. */
export interface CounterPayment {
  method: PaymentMethod;
  amountCents: number;
  /** Cash only: what the customer handed over. Change due is tendered minus the amount. */
  tenderedCents?: number;
  /** Optional: terminal receipt number, last four digits, gift card number. */
  reference?: string;
  takenAt: string;
  takenBy: Role;
}

export interface OnlineOrder {
  id: string;
  /** Shown to the customer and staff, like SGL-1042. */
  number: string;
  name: string;
  phone?: string;
  email?: string;
  /** The customer's note. */
  note?: string;
  /** Staff-only note. */
  staffNote?: string;
  lines: OrderLine[];
  status: OnlineOrderStatus;
  createdAt: string;
  readyAt?: string;
  /** Set when the order becomes ready: readyAt plus the pickup hold length. */
  holdUntil?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: 'customer' | 'staff';
  cancelReason?: string;
  payment?: CounterPayment;
}

export type Role = 'owner' | 'staff';
