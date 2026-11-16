'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart/useCart';
import styles from './Basket.module.css';

/** Follows the shopper at the bottom of the screen once the basket has something in it. */
export function CartBar() {
  const { count } = useCart();
  const pathname = usePathname();
  if (count === 0 || pathname === '/basket' || pathname.startsWith('/order/')) return null;
  return (
    <div className={styles.bar} role="region" aria-label="Basket">
      <div className={`wrap ${styles.barInner}`}>
        <span>
          Basket · {count} {count === 1 ? 'item' : 'items'}
        </span>
        <Link href="/basket" className="basket-link">
          View basket and pay at the counter
        </Link>
      </div>
    </div>
  );
}
