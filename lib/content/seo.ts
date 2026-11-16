import { SITE_URL, STORE } from './store';
import type { Settings, StoreEvent } from '@/lib/domain/types';
import { openingHoursSpecification } from '@/lib/hours/hours';

export function storeJsonLd(settings: Pick<Settings, 'weeklyHours'>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE_URL}/#store`,
    name: STORE.name,
    description:
      "Barrie's independent game and hobby store: board games, D&D and RPGs, Warhammer and Citadel paints, StarCraft minis, trading card games and a free in-store playspace.",
    url: SITE_URL,
    telephone: '+1-705-719-1291',
    email: STORE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE.streetAddress,
      addressLocality: STORE.locality,
      addressRegion: STORE.region,
      postalCode: STORE.postalCode,
      addressCountry: STORE.country,
    },
    openingHoursSpecification: openingHoursSpecification(settings.weeklyHours),
    sameAs: [STORE.facebook, STORE.instagram],
    image: `${SITE_URL}/images/og.jpg`,
    priceRange: '$$',
  };
}

/** Shared by the root layout and pages, so every share card has the same size and alt text. */
export const OG_IMAGE = {
  url: '/images/og.jpg',
  width: 1200,
  height: 630,
  alt: 'The Sir Games-A-Lot storefront in Bayfield Mall, Barrie, above the store name on a royal-blue banner.',
};

export function eventJsonLd(event: StoreEvent, seatsLeft: number | null) {
  const soldOut = seatsLeft !== null && seatsLeft <= 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || event.note,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${SITE_URL}/events/${event.slug}`,
    location: {
      '@type': 'Place',
      name: `${STORE.name}, Bayfield Mall (lower level)`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: STORE.streetAddress,
        addressLocality: STORE.locality,
        addressRegion: STORE.region,
        postalCode: STORE.postalCode,
        addressCountry: STORE.country,
      },
    },
    organizer: { '@type': 'Organization', name: STORE.name, url: SITE_URL },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/events/${event.slug}`,
      price: (event.feeCents / 100).toFixed(2),
      priceCurrency: 'CAD',
      availability: soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    },
  };
}
