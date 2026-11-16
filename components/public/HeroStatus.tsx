'use client';

import { ButtonLink } from '@/components/ui/Button';
import { STORE } from '@/lib/content/store';
import type { Settings } from '@/lib/domain/types';
import { summarizeWeeklyHours } from '@/lib/hours/summary';
import { useStoreHours } from './useOpenStatus';
import styles from './Sections.module.css';

/** Open/closed status, the week's hours and a tap-to-call button, straight from the settings. */
export function HeroStatus({
  initialSettings,
  initialNowIso,
}: {
  initialSettings: Settings;
  initialNowIso: string;
}) {
  const { settings, status } = useStoreHours(initialSettings, initialNowIso);
  return (
    <div className={styles.status}>
      <p className={styles.statusLine} data-testid="hero-open">
        <i className={status.open ? styles.on : ''} aria-hidden="true" />
        <span>{status.text}</span>
      </p>
      <p className={styles.statusHours}>{summarizeWeeklyHours(settings.weeklyHours)}</p>
      <ButtonLink variant="white" size="sm" href={STORE.phoneHref} className={styles.call}>
        Call {STORE.phone}
      </ButtonLink>
    </div>
  );
}
