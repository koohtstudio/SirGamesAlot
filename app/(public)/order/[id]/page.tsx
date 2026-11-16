import type { Metadata } from 'next';
import { OrderStatus } from '@/components/public/OrderStatus';
import { PageHero } from '@/components/public/Sections';
import sections from '@/components/public/Sections.module.css';

export const metadata: Metadata = {
  title: 'Your order',
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHero kicker="Your order" title="Where your order is at">
        Pay at the counter when you pick it up. Nothing is charged online.
      </PageHero>
      <div className={`wrap ${sections.pageBody}`}>
        <OrderStatus id={id} />
      </div>
    </>
  );
}
