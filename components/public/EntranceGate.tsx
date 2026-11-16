'use client';

import type { ReactNode } from 'react';
import { useRepoData } from '@/lib/data/hooks';
import { Verify } from '@/components/ui/Verify';
import type { BannerSettings } from '@/lib/domain/types';
import styles from './Visit.module.css';

/**
 * The Coulter Street entrance diagram only makes sense while the construction notice is on (Admin → Settings).
 * It came from the old concept and may be out of date, so it follows the same switch as the banner.
 */
export function EntranceGate({
  initialBanner,
  children,
}: {
  initialBanner: BannerSettings;
  children: ReactNode;
}) {
  const banner = useRepoData(async (r) => (await r.getSettings()).banner, initialBanner);
  if (banner.enabled) return <>{children}</>;
  return (
    <p className={styles.findNote}>
      Lower level of Bayfield Mall, near Bowlerama. Look for the blue Sir Games-A-Lot sign and the
      statues at the door.{' '}
      <Verify note="entrance wording; the old construction directions are switched off" />
    </p>
  );
}
