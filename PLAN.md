# PLAN: real photos, real content, visual polish

Status: **waiting for "go". Nothing outside this file has been edited.**
Scope: photos, real content and visual polish only. Stack, admin, data layer and the tests' intent stay as they are.

## What I found while reading the repo and photos

1. **Image problems that need re-exporting before use**
   - `events/warhammer-tournament.jpg` (540x960) has big black letterbox bars top and bottom. Real picture is about 540x300. Crop it, and it is small, so it can only be a thumbnail or a small card (not hero).
   - `store/aisle.jpg` is 640x1136 portrait and low-res. Fine as a tall card at ≤ 320 CSS px wide, not as a wide banner.
   - `painting/ork-1..3.jpg` and `events/paint-contest-sign.jpg` are 414x414. Thumbnail use only.
   - Several files are 400-630 KB (`tabletop-popup`, `cosplay-may4`, `shelves`, `statues`, `ork-squad`, `painted-dragon`, `starcraft-table`, `storefront-wide`, `owner-with-statue`). The "250 KB after next/image at largest rendered size" gate will be checked on the real output. Anything that fails gets re-exported (sharp/`sips`, no new dependency).
   - `storefront.jpg` is 960x720. As a hero at 1280 it is slightly soft. I will use it at ≤ 640 CSS px wide on desktop (two-column hero), which is sharp enough.
2. **Third-party artwork inside the store's own photos.** `storefront.jpg` shows the store's real sign (it carries Superman and Batman art), the Batman, Deadpool and Wonder Woman statues, and an Aquila (Games Workshop) decal in the window. `aisle.jpg` and `shelves.jpg` show product packaging on shelves. These are photos of the real shop, so I will use them, but they are not publisher artwork we picked. I will list it in `CONTENT_TODO.md` so the owner knows.
3. **Hero H1 situation.** Today the H1 is the sign text inside the blue banner and the tagline is an H2. I will keep exactly one H1 (the sign) and keep the tagline as supporting text.
4. **Stale concept content in the repo** (all found with grep): `94%`/`101 Facebook reviews` and `3.5K followers` (Sections.tsx hero creds and `Reviews`), "since 2005" (store.ts, seo.ts, layout.tsx, footer, hero), "Main doors closed for construction / Coulter Street" (home and visit page copy, `EntranceMap`, seed banner text), a "Concept homepage" footer line, and the invented event data in `lib/data/mock/seed.ts`.
5. **Tests that will be affected** (intent unchanged, selectors/text updated): anything asserting the 94%/3.5K text, the four photo-slot placeholders, the hero CTA "See events", the footer text. I will read `tests/e2e/*.spec.ts` and `scripts/screenshots.spec.ts` before editing and only change assertions that are about content I replaced.
6. CSP: `img-src 'self' data: blob:` already allows local files and the `blurDataURL` data URIs. **No CSP change.** `proxy.ts` is untouched.

## Decisions I am making (tell me if you disagree)

- **Paint wall slot on `/visit`:** no real Citadel paint wall photo exists, and `starcraft-table.jpg` is a painted battle table, not the paint wall. I will **not** mislabel it. Instead the "Inside the shop" grid on `/visit` becomes: storefront, statues, aisle, playspace (4 real photos), and the paint wall slot is kept as a labelled `PhotoSlot` that renders **only with `?review=1`**. The "Painted in the shop" gallery uses `starcraft-table.jpg` plus the orks and dragon.
- **Founding year:** the posts say "20th anniversary" May 2024 and "21st" for 2026, which does not match 2005 (2005 + 21 = 2026 works, but "20th on May 4 2024" gives 2004). I will not pick one. Public copy says "Barrie's game shop for 20+ years" (true under both readings) and drops "since 2005" and the "21 years" stat. `foundedYear` stays in `store.ts` only for JSON-LD, with a `[verify]` note in `CONTENT_TODO.md`, and I'll remove `foundingDate` from JSON-LD until it is confirmed so we never publish a guess to search engines.
- **Location and construction banner:** `locationNote` becomes "Lower level of Bayfield Mall, near Bowlerama · 4,100 sq ft with a gaming room inside". The construction banner and Coulter Street directions are old-concept content that may be out of date. I will **leave the banner switch and EntranceMap in the code** but set the seed banner to `enabled: false`, and make the Visit page and home Visit section copy neutral ("Lower level, Bayfield Mall, near Bowlerama"). The Coulter Street directions only render when the banner is on. Flagged in `CONTENT_TODO.md`. This changes a seed default (a data default, not the data layer's behaviour); the "banner off" e2e test stays, and I will check the banner-on test still sets it explicitly.
- **Google says "Floor 1", the store says "lower level".** I will use "lower level" as the posts do and put "Floor 1 per Google" in `CONTENT_TODO.md`.
- **Photos with people** (`cosplay-may4`, `tabletop-popup`, `warhammer-tournament`, `owner-with-statue`, `playspace`) are used in the mockup and flagged for owner and people's OK before going live.
- **Painted minis credit:** "Painted in the shop" and nothing more. No names.
- **Owner:** "Vince" appears only where the posts use him (the owner-with-statue caption and nothing else). No bio.
- **Hours:** unchanged until confirmed. I will add the Civic Holiday example (open 9:30 to 9:00) as a **holiday override with a "(sample)" label**, replacing the invented Christmas ones only if you want; default is to keep the three Christmas samples and add the Civic Holiday one. Say if you'd rather I leave holidays alone.
- **No new dependencies.** Image re-exports use `sips` (already on this Mac) or `sharp`, which Next already bundles for `next/image`. `og.jpg` is composed with `sharp` in a one-off script under `scripts/` (not shipped, not a dependency change). If `sharp` can't be imported directly I will fall back to a static `app/opengraph-image` approach or `sips` + a banner PNG; I'll tell you which.

## File-by-file

### New files

- `components/ui/Photo.tsx` + `Photo.module.css`: one wrapper around `next/image` for every real photo. Props: `src`, `alt`, `width`, `height`, `sizes`, `priority?`, `tilt?`, `caption?`. Applies the comic-panel frame (3px ink border, hard offset shadow), a dominant-colour background and `blurDataURL` from a typed lookup so nothing jumps, and a **6-line max** caption backed by a solid colour (no text on busy photo areas). Replaces ad-hoc `<Image>` usage.
- `lib/content/photos.ts`: single typed registry: `PHOTOS = { storefront: { src, width, height, alt, blurDataURL, dominant }, ... }` for all ~21 files, so alt text, dimensions and blur placeholders live in one place and can't drift. Includes which photos show people (feeds `CONTENT_TODO`).
- `components/public/PaintedGallery.tsx` (+ css in `Sections.module.css`): "Painted in the shop" CSS-grid gallery (no carousel). Server component.
- `scripts/make-og.mjs`: one-off script that writes `public/images/og.jpg` (1200x630) from `storefront.jpg` with the store name on a royal-blue banner. Output is committed. Not part of the build.
- `public/images/og.jpg`.
- `lib/content/photos.test.ts`: unit test that every registry `src` exists on disk, has non-empty alt, and width/height match the real file. (Adds a safety net; does not change existing tests' intent.)

### Edited: content

- `lib/content/store.ts`: `locationNote`, add `sizeNote` ("4,100 sq ft, gaming room inside"), Google rating (`4.6`, `419`), `googleReviewsLabel`. `foundedYear` kept but no longer rendered or sent to JSON-LD.
- `lib/content/seo.ts`: remove `foundingDate`; `openGraph.images` and `twitter` card (summary_large_image, same image) via the metadata in `app/layout.tsx`; per-event metadata gets the event photo as `openGraph.images` when it has one.
- `app/layout.tsx`: description without "since 2005", add `twitter` metadata, `openGraph.images: ['/images/og.jpg']` with width, height and alt.
- `lib/data/mock/seed.ts`: replace the invented events with the real ones from the posts (below). Banner default `enabled: false`. Add the Civic Holiday sample.
- `lib/domain/types.ts` and `schemas.ts`: **add one optional field `photo?: string` (a key into `PHOTOS`) to event fields.** This is the smallest way to give events a photo. It is optional, so no stored demo state breaks and no admin form changes. I'm calling this out because it touches the domain types; if you'd rather not, the fallback is a slug-to-photo map in `lib/content/photos.ts` and zero type changes. I recommend the map (no type change), so that is the default unless you say otherwise.
- `components/public/Sections.tsx`: new `Hero`, `Aisles` with photos, `Reviews` with the two Google quotes and 4.6 / 419.
- `components/public/D20Roller.tsx` (copy only): add "Run at events and in store. Exact rules to be confirmed with the owner." plus `Verify`.
- `components/public/AnniversaryFlyer.tsx`, `EventHistory.tsx`: real flyers as thumbnails, "$5 off in costume" and "10% or roll a d20 for 1 to 20% off" wording from the flyers, `Verify` tags kept.
- `components/public/EntranceMap.tsx`, `app/(public)/page.tsx`, `app/(public)/visit/page.tsx`: copy changes described above.

### Real events (replacing invented data, `[verify]` where unclear)

Monthly Paint Night (a Tuesday, 5:30 to 8:30 pm; which Tuesday unknown, so I'll use "last Tuesday" and mark **sample**), Ork-tober and Wintercessor paint contests ($6 entry on Wintercessor; Ork-tober fee unknown so no fee shown), 20th Anniversary (May 3 2025, past), Nightmare Before Christmas (Nov 15 2025, cosplay contest 2 pm, past), 21st Anniversary (May 16 2026, past, flyer), May the Fourth (past, flyer and cosplay photo), 40K tournament (24 players; fee unknown so marked sample), midnight Warhammer 40,000 release, StarCraft: The Miniature Game demos, Riftbound booster launch, D&D Ravenloft release. Capacity numbers other than the 24-player 40K are sample. Upcoming dates are generated sample dates and labelled "sample" in the card; past events get their real dates. I will read `assets/instagram/captions.txt` for exact wording and dates before writing any of this, and anything I can't find stays marked sample rather than guessed.

### Edited: layout, pages and styling

- `app/(public)/page.tsx`: hero with `storefront.jpg` (`priority`, the only priority image on the page), aisles with `aisle.jpg` and `shelves.jpg`, painted gallery, events with photos.
- `app/(public)/visit/page.tsx`: four real `Photo`s, painted gallery, paint wall slot only under `?review=1`.
- `app/(public)/events/page.tsx`, `events/[slug]/page.tsx`, `EventDetail.tsx`: event photo on the detail page (real event photo first, flyer second), gallery of painted minis on `/events`.
- `EventsExplorer.tsx` (`EventCard`): small photo thumbnail on each card (lazy, 96-120 px), still no taller than its content.
- `components/ui/PhotoSlot.tsx`: kept, but renders nothing unless `src` is set or review mode is on. Review mode is read from a prop passed by the server page (from the `x-review` header already read in the root layout), so no client JS added.
- `components/public/SiteHeader.tsx` + css: sticky compact header on mobile with a visible **Call** button and open/closed dot (the dot and phone already exist; I'll make them a 44px tap target and keep them on one row at 360). `DemoRibbon` stays only under `?review=1` (see below).
- `components/public/SiteFooter.tsx` + css: address, phone, hours summary, Facebook, Instagram and "Built by Kooht Studio". Drop "Concept homepage".
- `components/public/Sections.module.css`, `Events.module.css`, `Visit.module.css`, `StockChecker.module.css`: one spacing scale (CSS variables `--space-1..6` added to the `:root` in `globals.css`, **no palette change**), one card radius and border weight, Bangers limited to badges and stamps (I'll audit every use of `--comic`), line-length caps (`max-width: 65ch` on body copy), solid backing on any text over a photo, small motion only with the reduced-motion rule already in `globals.css`.
- Empty and loading states for stock and events: tidy, deliberate versions of the existing "no results" text with a d20 icon and a next step (call, or request a special order).
- Focus rings and 44px targets: audit all buttons, chips and links in the public site and fix any under 44px.

### Edited: docs and tests

- `public/images/README.md`: what is filled, what is still missing (paint wall, interior without people, a better aisle shot, hi-res tournament and sign photos).
- `docs/CONTENT_TODO.md`: update rows 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 19 and add: photos of people need OK, third-party art visible in the photos, founding year conflict, "Floor 1" vs "lower level", flyer reuse, Google review permission, holiday hours example, Vince mention, d20 rules.
- `README.md` link text "Photo slots" to "Photos".
- `docs/ARCHITECTURE.md`: one short paragraph on the photo registry and `Photo` component, and refresh the Lighthouse numbers line.
- `docs/SECURITY.md`: no change expected (CSP unchanged); I'll only touch it if needed.
- Existing e2e and unit tests: update only assertions that mention replaced copy. New e2e checks: every `<img>` has non-empty `alt`, exactly one `priority`/eager image on home, no "Photo slot" text on public pages without `?review=1`, no horizontal scroll at 360 (already exists).
- `docs/screenshots/*`: regenerate with `pnpm screenshots`.

## What I will NOT touch

Admin pages and components, `lib/data/repository.ts` and `mock-repository.ts` behaviour, `lib/inventory-source/*`, `lib/stock/*`, `lib/events/*` logic (recurrence, seats, ics), `lib/hours/*` logic, `proxy.ts` and the CSP, `next.config.ts`, the colour palette tokens, fonts and the font set, CI workflows, `package.json` dependencies, `reference/`, and `assets/` (raw pulls stay as they are and unshipped). No publisher artwork or logos are added, and nothing is hotlinked from Facebook or Instagram.

## Quality gates and how I'll measure

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` (with axe on every page), `pnpm build`, `pnpm format:check`.
- Lighthouse mobile on home, stock, events and visit against the production build (`pnpm build && pnpm start`) with `NEXT_PUBLIC_ALLOW_INDEXING=true` so the SEO score is comparable to the existing 95-96 baseline. I'll report the real numbers, including any page under 95, and what I did about it.
- LCP image is the only `priority` image; CLS target under 0.05 (checked in Lighthouse and with a Playwright layout-shift probe).
- Image-weight check: a script requests each rendered image at its largest `sizes` width through `/_next/image` and fails over 250 KB; heavier sources get re-exported.
- Visual check at 360, 768 and 1280 in the built-in browser before I regenerate the screenshots.

## Things I need from you before or during the work (none block "go")

1. OK to default to **banner off** in the seed (the safest reading of "may be out of date")? Default: yes.
2. Event photo mapping by slug map (no type change) vs optional `photo` field. Default: slug map.
3. Holidays: add the Civic Holiday sample and keep the Christmas samples. Default: yes.

Reply **go** (and any overrides to the three defaults above) and I'll start.
