import type { Metadata } from 'next';
import { BasketView } from '@/components/public/BasketView';
import { PageHero } from '@/components/public/Sections';
import sections from '@/components/public/Sections.module.css';
import { getInventorySource, getRepository } from '@/lib/data';
import { loadProducts } from '@/lib/stock/catalog';

export const metadata: Metadata = {
  title: 'Your basket',
  description: 'Order from Sir Games-A-Lot online and pay at the counter when you pick it up.',
  robots: { index: false, follow: false },
};

export default async function BasketPage() {
  const repo = getRepository();
  const [settings, products] = await Promise.all([
    repo.getSettings(),
    loadProducts(getInventorySource(), repo),
  ]);
  return (
    <>
      <PageHero kicker="Basket" title="Order online, pay at the counter">
        Pick what you want, tell us who&apos;s collecting, and we&apos;ll have it ready. Nothing is
        charged online. You pay in the store when you pick it up.
      </PageHero>
      <div className={`wrap ${sections.pageBody}`}>
        <BasketView initialProducts={products} initialSettings={settings} />
      </div>
    </>
  );
}
