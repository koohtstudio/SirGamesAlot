import { test, type Page } from '@playwright/test';

/** Photos are lazy: scroll through the page so a full-page screenshot shows them, not their blur. */
async function loadLazyImages(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
}

/** Saves screenshots at the three breakpoints we design for. Run with: pnpm screenshots */
const WIDTHS = [
  { w: 360, h: 800 },
  { w: 768, h: 1024 },
  { w: 1280, h: 900 },
];

const PUBLIC: [string, string][] = [
  ['home', '/'],
  ['stock', '/stock'],
  ['events', '/events'],
  ['visit', '/visit'],
  ['special-order', '/special-order'],
];

const ADMIN: [string, string][] = [
  ['admin-today', '/admin/today'],
  ['admin-stock', '/admin/stock'],
  ['admin-orders', '/admin/orders'],
  ['admin-payments', '/admin/payments'],
  ['admin-holds', '/admin/holds'],
  ['admin-events', '/admin/events'],
  ['admin-customers', '/admin/customers'],
  ['admin-settings', '/admin/settings'],
];

for (const { w, h } of WIDTHS) {
  test(`screenshots at ${w}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      timezoneId: 'America/Toronto',
      locale: 'en-CA',
    });
    const page = await context.newPage();
    for (const [name, path] of PUBLIC) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await loadLazyImages(page);
      await page.screenshot({ path: `docs/screenshots/${name}-${w}.png`, fullPage: true });
    }
    // A basket with two items in it, as a shopper would see it.
    await page.goto('/stock');
    await page.getByRole('searchbox', { name: 'Search stock' }).fill('leadbelcher');
    await page.getByRole('button', { name: /^Add to basket: Leadbelcher/ }).click();
    await page
      .getByRole('button', { name: /^Add another.*|^Add to basket: Leadbelcher/ })
      .first()
      .click();
    await page.getByRole('searchbox', { name: 'Search stock' }).fill('catan');
    await page.getByRole('button', { name: /^Add to basket: Catan/ }).click();
    await page.goto('/basket');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `docs/screenshots/basket-${w}.png`, fullPage: true });
    await page.goto('/admin');
    await page.getByRole('button', { name: /^Owner/ }).click();
    for (const [name, path] of ADMIN) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.getByText('Loading…').waitFor({ state: 'detached' });
      await page.screenshot({ path: `docs/screenshots/${name}-${w}.png`, fullPage: true });
    }
    await context.close();
  });
}
