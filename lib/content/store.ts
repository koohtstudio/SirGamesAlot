/** Facts about the store. Items marked [verify] are tracked in docs/CONTENT_TODO.md. */
export const STORE = {
  name: 'Sir Games-A-Lot',
  tagline: "Barrie's independent game and hobby store",
  phone: '705-719-1291',
  phoneHref: 'tel:+17057191291',
  email: 'sirgamesalot@rogers.com',
  streetAddress: '320 Bayfield Street',
  locality: 'Barrie',
  region: 'ON',
  postalCode: 'L4M 3C1',
  country: 'CA',
  fullAddress: '320 Bayfield Street, Barrie, ON L4M 3C1',
  locationNote: 'Lower level of Bayfield Mall · near Bowlerama',
  sizeNote: '4,100 square feet with a gaming room inside the store',
  facebook: 'https://www.facebook.com/profile.php?id=100057495547644',
  instagram: 'https://www.instagram.com/iamsirgamesalot/',
  /** Google rating, from the store's Google listing. Needs a refresh before launch. */
  googleRating: '4.6',
  googleReviewCount: 419,
  /**
   * Not shown anywhere and not sent to search engines. The store's own posts call 2024 its 20th and
   * 2026 its 21st anniversary, which does not match 2005. Confirm with the owner (docs/CONTENT_TODO.md).
   */
  foundedYear: 2005,
} as const;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sir-games-a-lot.vercel.app'
).replace(/\/$/, '');
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';
