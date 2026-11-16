import type {
  BackInStockInput,
  BasketOrderInput,
  CounterPaymentInput,
  EventFormInput,
  HoldRequest,
  OrderRequest,
  SignupInput,
} from '@/lib/domain/schemas';
import type {
  BackInStockRequest,
  Customer,
  EventSeries,
  EventSignup,
  Hold,
  HoldStatus,
  Interest,
  OnlineOrder,
  OrderStage,
  OutboxMessage,
  ProductOverride,
  Role,
  Settings,
  SignupStatus,
  SpecialOrder,
  StoreEvent,
} from '@/lib/domain/types';

export class RepositoryError extends Error {
  constructor(
    public readonly code: 'validation' | 'duplicate' | 'not-found' | 'conflict' | 'not-implemented',
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export type HoldInput = HoldRequest & { productName: string; interest?: Interest };
export type BackInStockCreate = BackInStockInput & { productName: string; interest?: Interest };
export type OrderInput = OrderRequest & { interest?: Interest };
export type BasketOrderCreate = BasketOrderInput;

export interface SignupResult {
  signup: EventSignup;
  outcome: 'seated' | 'waitlist';
}

/**
 * Everything the app stores, except stock counts (see InventorySource).
 * Phase 1 implements this with MockRepository (sample data + localStorage).
 * Phase 2 implements it with Supabase; no UI code changes.
 */
export interface DataRepository {
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  // Stock overrides
  listOverrides(): Promise<ProductOverride[]>;
  setOverride(override: ProductOverride): Promise<void>;
  clearOverride(sku: string): Promise<void>;

  // Holds (website holds, kept for settings.holdHours)
  listHolds(): Promise<Hold[]>;
  createHold(input: HoldInput): Promise<Hold>;
  setHoldStatus(id: string, status: HoldStatus): Promise<void>;

  // Special orders
  listSpecialOrders(): Promise<SpecialOrder[]>;
  createSpecialOrder(input: OrderInput): Promise<SpecialOrder>;
  setOrderStage(id: string, stage: OrderStage): Promise<void>;

  // Online orders: a basket paid for at the counter. Names and prices always come from the POS, never the browser.
  listOnlineOrders(): Promise<OnlineOrder[]>;
  /** Looked up by the unguessable id in the customer's link. Null when there is no such order. */
  getOnlineOrder(id: string): Promise<OnlineOrder | null>;
  createOnlineOrder(input: BasketOrderCreate): Promise<OnlineOrder>;
  /** SKU → units held by open orders, so the website never sells the same unit twice. No personal data. */
  listReservedQuantities(): Promise<Record<string, number>>;
  /** placed → ready. Starts the pickup hold and queues the "ready" email. */
  markOrderReady(id: string): Promise<OnlineOrder>;
  /** ready → completed. Records what was taken at the counter. The amount is always the order total. */
  takeCounterPayment(id: string, input: CounterPaymentInput, by: Role): Promise<OnlineOrder>;
  /** Owner only: undo a payment taken by mistake. completed → ready. */
  voidCounterPayment(id: string): Promise<OnlineOrder>;
  /** placed or ready → cancelled. Releases the held stock. */
  cancelOnlineOrder(id: string, by: 'customer' | 'staff', reason?: string): Promise<OnlineOrder>;
  setOrderStaffNote(id: string, note: string): Promise<void>;

  // "Tell me when it's back"
  listBackInStock(): Promise<BackInStockRequest[]>;
  createBackInStock(input: BackInStockCreate): Promise<BackInStockRequest>;
  notifyBackInStock(id: string): Promise<void>;

  // Events: one-offs (including past ones) plus generated occurrences of recurring series
  listEvents(): Promise<StoreEvent[]>;
  getEventBySlug(slug: string): Promise<StoreEvent | null>;
  listSeries(): Promise<EventSeries[]>;
  createEvent(input: EventFormInput): Promise<void>;
  updateEvent(eventId: string, input: EventFormInput): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;

  // Event sign-ups
  listSignups(eventId?: string): Promise<EventSignup[]>;
  createSignup(input: SignupInput): Promise<SignupResult>;
  setSignupStatus(id: string, status: SignupStatus): Promise<void>;
  promoteSignup(id: string): Promise<void>;

  // Customers (people who held, ordered or signed up)
  listCustomers(): Promise<Customer[]>;

  // Demo outbox: every email the full build would send
  listOutbox(): Promise<OutboxMessage[]>;
  queueEmail(message: Omit<OutboxMessage, 'id' | 'createdAt'>): Promise<OutboxMessage>;

  // Demo only
  resetDemo(): Promise<void>;
  /** Called after any change, including changes made in another browser tab. */
  subscribe(listener: () => void): () => void;
}
