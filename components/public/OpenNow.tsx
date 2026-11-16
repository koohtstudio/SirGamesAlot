'use client';

import type { Settings } from '@/lib/domain/types';
import styles from './SiteHeader.module.css';
import { useStoreHours } from './useOpenStatus';

/** Live open/closed indicator. Colour is never the only signal: the words say it too. */
export function OpenNow({
  initialSettings,
  initialNowIso,
}: {
  initialSettings: Settings;
  initialNowIso: string;
}) {
  const { status } = useStoreHours(initialSettings, initialNowIso);
  return (
    <span className={styles.open} data-testid="open-now">
      <i className={status.open ? styles.on : ''} aria-hidden="true" />
      {/* Full sentence on wide screens; one word on phones, so the Call button always fits. */}
      <span className={styles.openFull}>{status.text}</span>
      <span className={styles.openShort}>{status.open ? 'Open' : 'Closed'}</span>
    </span>
  );
}
