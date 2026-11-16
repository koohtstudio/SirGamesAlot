'use client';

import { useRepoData, useNow } from '@/lib/data/hooks';
import type { StoreEvent } from '@/lib/domain/types';
import { formatEventDate, isUpcoming } from '@/lib/events/events';
import { Verify } from '@/components/ui/Verify';
import type { PhotoLite } from '@/lib/content/photos';
import { EventThumb } from './EventThumb';
import styles from './Events.module.css';

/** Events that already happened. Past events never appear in the upcoming list. */
export function EventHistory({
  initialEvents,
  initialNowIso,
  flyers = {},
}: {
  initialEvents: StoreEvent[];
  initialNowIso: string;
  /** The matching flyer for each past event, by event id. Built on the server. */
  flyers?: Record<string, PhotoLite>;
}) {
  const events = useRepoData((r) => r.listEvents(), initialEvents);
  const now = useNow(initialNowIso);
  const past = events
    .filter((e) => !isUpcoming(e, now) && !e.seriesId)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .slice(0, 5);

  return (
    <section className={styles.past} aria-labelledby="event-history-title">
      <h3 id="event-history-title" className={styles.pastTitle}>
        Event history
      </h3>
      <ul className={styles.pastList}>
        {past.map((e) => (
          <li key={e.id}>
            <span className={styles.pastDate}>{formatEventDate(e, 'MMM d, yyyy')}</span>
            <span className={styles.pastWhat}>
              {flyers[e.id] && <EventThumb photo={flyers[e.id]!} />}
              <span>
                {e.title}
                {e.note ? ` · ${e.note}` : ''}
              </span>
            </span>
          </li>
        ))}
        <li>
          <span className={styles.pastDate}>Paint contests</span>
          <span>
            Ork-tober, Wintercessor ($6 entry) and more, posted on Discord{' '}
            <Verify note="contest dates and fees" />
          </span>
        </li>
      </ul>
    </section>
  );
}
