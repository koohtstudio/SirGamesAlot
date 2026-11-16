import { headers } from 'next/headers';
import { DemoRibbon, SiteHeader } from '@/components/public/SiteHeader';
import { CartBar } from '@/components/public/CartBar';
import { SiteFooter } from '@/components/public/SiteFooter';
import { getRepository } from '@/lib/data';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getRepository().getSettings();
  const nowIso = new Date().toISOString();
  const review = (await headers()).get('x-review') === '1';
  return (
    <>
      <DemoRibbon review={review} />
      <SiteHeader settings={settings} nowIso={nowIso} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter settings={settings} />
      <CartBar />
    </>
  );
}
