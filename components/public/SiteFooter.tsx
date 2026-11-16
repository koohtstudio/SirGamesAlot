import Link from 'next/link';
import { SignText } from '@/components/ui/Sign';
import { STORE } from '@/lib/content/store';
import type { Settings } from '@/lib/domain/types';
import { DEFAULT_HOURS } from '@/lib/hours/hours';
import { summarizeWeeklyHours } from '@/lib/hours/summary';
import styles from './SiteFooter.module.css';

/** `settings` is optional so the 404 page, which has no repository data, can still show the hours. */
export function SiteFooter({ settings }: { settings?: Settings }) {
  return (
    <footer className={styles.foot}>
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.brand}>
          <SignText className={styles.sign} />
          <p>{STORE.locationNote}</p>
        </div>
        <address className={styles.col}>
          <b>Find us</b>
          <span>{STORE.fullAddress}</span>
          <a href={STORE.phoneHref}>{STORE.phone}</a>
        </address>
        <div className={styles.col}>
          <b>Hours</b>
          <span>
            {summarizeWeeklyHours(settings?.weeklyHours ?? DEFAULT_HOURS).replaceAll(' · ', '\n')}
          </span>
        </div>
        <div className={styles.col}>
          <b>Follow</b>
          <a href={STORE.facebook} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a href={STORE.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </div>
      </div>
      <div className={`wrap ${styles.credit}`}>
        <p>
          Built by Kooht Studio · <Link href="/admin">Back-office demo</Link>
        </p>
        <p>Stock, prices and seats on this preview are sample data.</p>
      </div>
    </footer>
  );
}
