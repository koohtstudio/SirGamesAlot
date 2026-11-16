import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { PageHero } from '@/components/public/Sections';
import sections from '@/components/public/Sections.module.css';
import visit from '@/components/public/Visit.module.css';
import { VisitSection } from '@/components/public/VisitSection';
import { JsonLd } from '@/components/ui/JsonLd';
import { Photo } from '@/components/ui/Photo';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { storeJsonLd } from '@/lib/content/seo';
import { STORE } from '@/lib/content/store';
import { getRepository } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Hours and directions',
  description:
    'Sir Games-A-Lot is on the lower level of the Bayfield Mall, 320 Bayfield Street, Barrie, near Bowlerama. 4,100 square feet with a gaming room inside. Hours, phone and directions.',
  alternates: { canonical: '/visit' },
};

const PHOTO_SIZES = '(max-width: 480px) 100vw, (max-width: 860px) 50vw, 560px';

export default async function VisitPage() {
  const settings = await getRepository().getSettings();
  const review = (await headers()).get('x-review') === '1';
  return (
    <>
      <JsonLd data={storeJsonLd(settings)} />
      <PageHero kicker="Visit" title="Lower level, Bayfield Mall">
        {STORE.locationNote}. {STORE.sizeNote}.
      </PageHero>
      <div className={`wrap ${sections.pageBody}`}>
        <VisitSection settings={settings} nowIso={new Date().toISOString()} />
        <h2 className={sections.sectionTitle} style={{ marginTop: 40 }}>
          Inside the shop
        </h2>
        <div className={visit.photos}>
          <Photo
            name="storefront"
            tilt
            ratio="4 / 3"
            sizes={PHOTO_SIZES}
            caption="The storefront, with the statues at the door"
          />
          <Photo
            name="statues"
            ratio="4 / 3"
            focus="50% 30%"
            sizes={PHOTO_SIZES}
            caption="A life-size Wonder Woman, in the aisles"
          />
          <Photo
            name="aisle"
            ratio="4 / 3"
            focus="50% 58%"
            sizes={PHOTO_SIZES}
            caption="Games on one side, paints on the other"
          />
          <Photo
            name="playspace"
            ratio="4 / 3"
            sizes={PHOTO_SIZES}
            caption="The gaming room on a busy day"
          />
          <PhotoSlot
            review={review}
            label="The Citadel paint wall, straight on"
            alt="The wall of miniature paints"
            width={1200}
            height={800}
          />
        </div>
      </div>
    </>
  );
}
