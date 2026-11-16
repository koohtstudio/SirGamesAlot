import Link from 'next/link';
import { SignText } from '@/components/ui/Sign';
import { STORE } from '@/lib/content/store';
import type { Settings } from '@/lib/domain/types';
import { ConstructionBanner } from './ConstructionBanner';
import { MainNav } from './MainNav';
import { OpenNow } from './OpenNow';
import styles from './SiteHeader.module.css';

/** Shown only in ?review=1 mode, so visitors never see "concept" wording. The footer keeps a quiet sample-data note. */
export function DemoRibbon({ review }: { review: boolean }) {
  if (!review) return null;
  return (
    <div className={styles.ribbon}>
      <span>
        <b>Concept preview · sample data.</b> Stock, prices, events and requests are examples only.
      </span>
    </div>
  );
}

export function SiteHeader({ settings, nowIso }: { settings: Settings; nowIso: string }) {
  return (
    <header>
      <ConstructionBanner initial={settings.banner} />
      <div className={styles.top}>
        <div className={`wrap ${styles.topInner}`}>
          <Link className={styles.miniSign} href="/">
            <SignText className={styles.miniText} />
          </Link>
          <MainNav />
          <div className={styles.right}>
            <OpenNow initialSettings={settings} initialNowIso={nowIso} />
            <a className={styles.phone} href={STORE.phoneHref}>
              <span className={styles.phoneNum}>{STORE.phone}</span>
              <span className={styles.phoneCall} aria-hidden="true">
                Call
              </span>
              <span className="sr-only">Call {STORE.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
