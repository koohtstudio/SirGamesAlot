import Link from 'next/link';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { SignText } from '@/components/ui/Sign';
import { Verify } from '@/components/ui/Verify';
import { PAINTED_SET } from '@/lib/content/photos';
import { STORE } from '@/lib/content/store';
import type { Category, Settings } from '@/lib/domain/types';
import { HeroStatus } from './HeroStatus';
import styles from './Sections.module.css';

export function SectionHeader({
  kicker,
  title,
  children,
  as: Tag = 'h2',
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={styles.sh}>
      <div>
        <div className="kick">{kicker}</div>
        <Tag>{title}</Tag>
      </div>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Inner-page title block. */
export function PageHero({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={`${styles.pageHero} dots`}>
      <div className="wrap">
        <div className="kick">{kicker}</div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

export function Hero({ settings, nowIso }: { settings: Settings; nowIso: string }) {
  return (
    <div className={styles.hero} id="home">
      <div className={styles.banner}>
        <div className={`wrap ${styles.bannerInner}`}>
          <h1 className={styles.bannerH1}>
            <SignText className={styles.bannerSign} />
          </h1>
          <div className={styles.stripe} aria-hidden="true" />
        </div>
      </div>
      <div className={`wrap ${styles.heroBody}`}>
        <div className={styles.heroText}>
          <p className={styles.heroLead}>
            Barrie&apos;s game shop for <em>20+ years.</em>
          </p>
          <p className={styles.heroCopy}>
            Board games, D&amp;D, Warhammer, miniature paints and everything that goes with them.{' '}
            {STORE.locationNote}. <Verify note="location wording" />
          </p>
          <div className={styles.ctas}>
            <ButtonLink href="/stock">Check stock</ButtonLink>
            <ButtonLink href="/visit" variant="blue">
              Visit
            </ButtonLink>
          </div>
          <HeroStatus initialSettings={settings} initialNowIso={nowIso} />
        </div>
        <Photo
          name="storefront"
          priority
          tilt
          sizes="(max-width: 860px) 100vw, 540px"
          caption="Lower level of Bayfield Mall, 320 Bayfield St"
          className={styles.heroPhoto}
        />
      </div>
    </div>
  );
}

const AISLES: { tag: string; title: string; text: string; note: string; category?: Category }[] = [
  {
    tag: 'Warhammer',
    title: 'Armies & codexes',
    text: '40K, starter sets, Kill Team and the big new boxes.',
    note: 'New: 40K Armageddon',
    category: 'Warhammer',
  },
  {
    tag: 'Paint wall',
    title: 'Miniature paints',
    text: 'A floor-to-ceiling wall of Citadel paints, brushes and hobby tools.',
    note: 'Every colour, ask if not',
    category: 'Paints',
  },
  {
    tag: 'StarCraft',
    title: 'StarCraft minis',
    text: 'Terran, Zerg and Protoss for the tabletop miniatures game.',
    note: 'Restock just landed',
    category: 'StarCraft',
  },
  {
    tag: 'D&D',
    title: 'D&D & RPGs',
    text: 'Core books, setting books, dice and everything for your table.',
    note: 'Eberron & Ravenloft in',
    category: 'D&D',
  },
  {
    tag: 'Cards',
    title: 'Trading card games',
    text: 'Booster boxes, packs, sleeves and deck boxes.',
    note: 'Riftbound: Origins in stock',
    category: 'Cards',
  },
  {
    tag: 'Board games',
    title: 'Board games',
    text: 'Family nights, party games and heavy strategy, wall to wall.',
    note: 'Ask for a recommendation',
    category: 'Board games',
  },
  {
    tag: 'Collect',
    title: 'Statues & figures',
    text: 'Life-size statues at the door, figures and collectibles inside.',
    note: 'Say hi on your way in',
  },
  {
    tag: 'Play',
    title: 'The gaming room',
    text: 'A games room inside the store: tables to learn a game, paint, or play a match.',
    note: 'Free to use',
  },
];

export function Aisles() {
  return (
    <ul className={styles.aisles}>
      {AISLES.map((a) => (
        <li key={a.title} className={styles.aisle}>
          <span className={styles.tag}>{a.tag}</span>
          <h3>{a.title.replace('&', '&')}</h3>
          <p>{a.text}</p>
          <span className={styles.new}>
            {a.category ? (
              <Link href={`/stock?category=${encodeURIComponent(a.category)}`}>{a.note}</Link>
            ) : (
              a.note
            )}
            {a.tag === 'Warhammer' || a.tag === 'D&D' || a.tag === 'Cards' || a.tag === 'Play' ? (
              <Verify note={a.tag === 'Play' ? 'free to use' : 'new arrivals'} />
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Two real shop photos above the aisle cards. */
export function AisleTour() {
  return (
    <div className={styles.tour}>
      <Photo
        name="shelves"
        ratio="4 / 3"
        focus="50% 45%"
        tilt
        sizes="(max-width: 860px) 100vw, 560px"
        caption="Board games wall to wall, with the paint wall next door"
      />
      <Photo
        name="aisle"
        ratio="4 / 3"
        focus="50% 58%"
        sizes="(max-width: 860px) 100vw, 560px"
        caption="Down the aisle: games on one side, paints and hobby tools on the other"
      />
    </div>
  );
}

export function Reviews() {
  return (
    <ul className={styles.revs}>
      <li className={styles.rv}>
        <span className={styles.bigNum}>{STORE.googleRating}</span>
        <q>stars on Google</q>
        <span className={styles.who}>
          {STORE.googleReviewCount} Google reviews{' '}
          <Verify note="rating and count, refresh before launch" />
        </span>
      </li>
      <li className={styles.rv}>
        <q>Tons of variety, staff are super helpful and friendly and know their stuff.</q>
        <span className={styles.who}>
          Google review <Verify note="permission to use the quote" />
        </span>
      </li>
      <li className={styles.rv}>
        <q>Awesome and knowledgeable staff, great atmosphere and prices, lots of products.</q>
        <span className={styles.who}>
          Google review <Verify note="permission to use the quote" />
        </span>
      </li>
    </ul>
  );
}

/** Painted minis. Credit is the shop and nothing more. */
export function PaintedGallery() {
  return (
    <div>
      <ul className={styles.gallery}>
        {PAINTED_SET.map((name) => (
          <li key={name}>
            <Photo
              name={name}
              ratio="1 / 1"
              focus={name === 'orkSquad' ? '50% 40%' : undefined}
              sizes="(max-width: 480px) 50vw, (max-width: 860px) 33vw, 360px"
            />
          </li>
        ))}
      </ul>
      <p className={styles.galleryNote}>
        Painted in the shop. <Verify note="who painted these and OK to show them" />
      </p>
    </div>
  );
}
