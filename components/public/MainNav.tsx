'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './SiteHeader.module.css';

const LINKS = [
  { href: '/stock', label: 'Stock' },
  { href: '/events', label: 'Events' },
  { href: '/basket', label: 'Basket' },
  { href: '/#roll', label: 'Roll for it' },
  { href: '/visit', label: 'Visit' },
  { href: '/special-order', label: 'Special order' },
];

export function MainNav() {
  const pathname = usePathname();
  // The menu is "open" for the page it was opened on, so navigating closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((cur) =>
      (typeof next === 'function' ? next(cur === pathname) : next) ? pathname : null,
    );

  return (
    <>
      <button
        type="button"
        className={styles.menuBtn}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">Menu</span>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
          <path
            d={open ? 'M5 5l14 14M19 5L5 19' : 'M3 6h18M3 12h18M3 18h18'}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
            fill="none"
          />
        </svg>
      </button>
      <nav
        id="main-nav"
        className={`${styles.nav} ${open ? styles.navOpen : ''}`}
        aria-label="Main"
      >
        {LINKS.map((l) => {
          const current =
            !l.href.includes('#') && (pathname === l.href || pathname.startsWith(`${l.href}/`));
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={current ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
