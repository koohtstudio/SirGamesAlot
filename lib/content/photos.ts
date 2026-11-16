import { PHOTO_META, type PhotoMeta } from './photo-meta.generated';

/**
 * Every real photo on the site, in one place: file, alt text and whether people are in it.
 * Width, height, blur placeholder and dominant colour come from scripts/make-images.mjs
 * (lib/content/photo-meta.generated.ts), so they always match the file on disk.
 *
 * Photos come from the store's own public Facebook and Instagram and are used in the mockup only.
 * Photos with people need the owner's OK and the people's OK before going live (docs/CONTENT_TODO.md).
 * No publisher artwork, box art or logos are ever added as photos.
 */
interface PhotoDef {
  src: string;
  alt: string;
  /** Recognisable people in the photo. Listed in docs/CONTENT_TODO.md. */
  people?: boolean;
}

const DEFS = {
  storefront: {
    src: '/images/storefront.jpg',
    alt: 'The Sir Games-A-Lot storefront in Bayfield Mall: the blue sign over the open doorway, with Batman and Deadpool statues beside the entrance.',
  },
  storefrontWide: {
    src: '/images/store/storefront-wide.jpg',
    alt: 'A wider view of the Sir Games-A-Lot storefront and the mall corridor outside it.',
  },
  statues: {
    src: '/images/statues.jpg',
    alt: 'A life-size Wonder Woman statue standing in a store aisle.',
  },
  aisle: {
    src: '/images/store/aisle.jpg',
    alt: 'A long aisle of shelves in the shop, board games on the left and miniature paints and hobby supplies on the right, with a red wall at the far end.',
  },
  shelves: {
    src: '/images/store/shelves.jpg',
    alt: 'An end-cap display of party and family board games, with the paint wall visible down the next aisle.',
  },
  playspace: {
    src: '/images/store/playspace.jpg',
    alt: 'The in-store gaming room full of players standing and sitting around tables set up with miniature battlefields.',
    people: true,
  },
  ownerWithStatue: {
    src: '/images/store/owner-with-statue.jpg',
    alt: "The store's owner standing beside the life-size Wonder Woman statue.",
    people: true,
  },
  orkSquad: {
    src: '/images/painting/ork-squad.jpg',
    alt: 'A squad of painted ork miniatures lined up for a photo.',
  },
  ork1: { src: '/images/painting/ork-1.jpg', alt: 'A painted ork miniature, front view.' },
  ork2: { src: '/images/painting/ork-2.jpg', alt: 'A painted ork miniature with a big weapon.' },
  ork3: { src: '/images/painting/ork-3.jpg', alt: 'A painted ork miniature on a decorated base.' },
  dragon: {
    src: '/images/painting/painted-dragon.jpg',
    alt: 'A hand-painted dragon miniature.',
  },
  starcraftTable: {
    src: '/images/painting/starcraft-table.jpg',
    alt: 'A StarCraft miniatures battle table with painted armies set out on the terrain.',
  },
  tabletopPopup: {
    src: '/images/events/tabletop-popup.jpg',
    alt: 'A crowd of people playing tabletop games at a pop-up event sponsored by the store.',
    people: true,
  },
  warhammerTournament: {
    src: '/images/events/warhammer-tournament.jpg',
    alt: 'Players at tables during a Warhammer 40,000 tournament in the store.',
    people: true,
  },
  cosplayMay4: {
    src: '/images/events/cosplay-may4.jpg',
    alt: 'Two cosplayers posing at the store’s May the 4th event.',
    people: true,
  },
  paintContestSign: {
    src: '/images/events/paint-contest-sign.jpg',
    alt: 'A handwritten sign for the Wintercessor paint contest, $6 entry, next to a painted red and yellow armoured miniature.',
  },
  flyerMay4: {
    src: '/images/events/flyer-may4-2024.jpg',
    alt: 'The store’s flyer for its May the 4th event: cosplay, gaming, vendors, sales and snacks all day.',
  },
  flyerAnniversary2025: {
    src: '/images/events/flyer-anniversary-2025.jpg',
    alt: 'The store’s flyer for its anniversary event on Saturday May 3, 2025, with a cosplay contest at 3:30 pm.',
  },
  flyerAnniversary2026: {
    src: '/images/events/flyer-anniversary-2026.jpg',
    alt: 'The store’s flyer for its anniversary event on Saturday May 16, 2026: cosplay contest at 2 pm, $5 off in costume, take 10% off or roll a d20.',
  },
  flyerNightmare: {
    src: '/images/events/flyer-nightmare-before-christmas.jpg',
    alt: 'The store’s flyer for its Nightmare Before Christmas event on Saturday November 15, 2025, with a cosplay contest at 2 pm.',
  },
} satisfies Record<string, PhotoDef>;

export type PhotoKey = keyof typeof DEFS;

export interface Photo extends PhotoDef, PhotoMeta {
  key: PhotoKey;
}

export function getPhoto(key: PhotoKey): Photo {
  const def: PhotoDef = DEFS[key];
  const meta = PHOTO_META[def.src];
  if (!meta) throw new Error(`No image metadata for ${def.src}. Run node scripts/make-images.mjs.`);
  return { key, ...def, ...meta };
}

export const PHOTO_KEYS = Object.keys(DEFS) as PhotoKey[];

/** The "Painted in the shop" set. Credit is the shop and nothing more. */
export const PAINTED_SET: PhotoKey[] = [
  'orkSquad',
  'dragon',
  'starcraftTable',
  'ork1',
  'ork2',
  'ork3',
];

/**
 * Photo for an event card and detail page: real event photos first, flyers second.
 * Looked up by series id, event id, then slug prefix. Events added in the admin demo have no photo.
 */
const EVENT_PHOTO_BY_ID: Record<string, PhotoKey> = {
  'ser-40k': 'warhammerTournament',
  'ser-paint': 'orkSquad',
  'evt-holiday': 'flyerNightmare',
  'evt-past-21': 'flyerAnniversary2026',
  'evt-past-nbc': 'flyerNightmare',
  'evt-past-20': 'flyerAnniversary2025',
  'evt-past-may4': 'cosplayMay4',
};

/** Thumbnails for Event history rows: the matching flyer. */
const EVENT_FLYER_BY_ID: Record<string, PhotoKey> = {
  'evt-past-21': 'flyerAnniversary2026',
  'evt-past-nbc': 'flyerNightmare',
  'evt-past-20': 'flyerAnniversary2025',
  'evt-past-may4': 'flyerMay4',
};

export function eventPhotoKey(e: { id: string; seriesId?: string }): PhotoKey | undefined {
  return EVENT_PHOTO_BY_ID[e.seriesId ?? e.id];
}

export function eventFlyerKey(e: { id: string; seriesId?: string }): PhotoKey | undefined {
  return EVENT_FLYER_BY_ID[e.seriesId ?? e.id] ?? eventPhotoKey(e);
}

/** Just what a client component needs to draw one image. Built on the server, so the blur data stays out of the client bundle. */
export type PhotoLite = Pick<Photo, 'src' | 'alt' | 'width' | 'height' | 'blur' | 'dominant'>;

export function photoLite(key: PhotoKey): PhotoLite {
  const { src, alt, width, height, blur, dominant } = getPhoto(key);
  return { src, alt, width, height, blur, dominant };
}

/** Event photos for the events on a page, keyed by `seriesId ?? id`. Events without a photo are left out. */
export function eventPhotos(
  events: { id: string; seriesId?: string }[],
  kind: 'card' | 'flyer',
): Record<string, PhotoLite> {
  const out: Record<string, PhotoLite> = {};
  for (const e of events) {
    const id = e.seriesId ?? e.id;
    if (out[id]) continue;
    const key = kind === 'flyer' ? eventFlyerKey(e) : eventPhotoKey(e);
    if (key) out[id] = photoLite(key);
  }
  return out;
}
