# Sir Games-A-Lot: add the real photos and make the site look proper

You are working in the existing Sir Games-A-Lot repo (Next.js, TypeScript strict, CSS modules, Phase 1 mockup). Read `README.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_TODO.md`, `public/images/README.md` and `components/ui/PhotoSlot.tsx` first. Do not change the stack, the admin, the data layer or the tests' intent. This task is photos, real content and visual polish only.

Write `PLAN.md` first (what you will change, file by file, and what you will not touch). Wait for my "go" before editing.

## What was added

Real photos from the store's own public Facebook and Instagram (@iamsirgamesalot) are now in `public/images/` (all resized to 1600px wide max). The raw pulls and the post captions are in `assets/` (not shipped, ignore for the build).

| File                              | What it is                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `storefront.jpg`                  | Mall frontage, the SIR GAMES-A-LOT sign, Batman and Deadpool statues at the door (960x720) |
| `statues.jpg`                     | Life-size Wonder Woman statue in an aisle                                                  |
| `store/storefront-wide.jpg`       | Wider storefront shot                                                                      |
| `store/aisle.jpg`                 | Long aisle of shelves, red wall                                                            |
| `store/shelves.jpg`               | End-cap display of board games                                                             |
| `store/playspace.jpg`             | Gaming room full of players at tables                                                      |
| `store/owner-with-statue.jpg`     | Vince (the owner) with the Wonder Woman statue                                             |
| `painting/*.jpg`                  | Painted minis: ork squad, three single orks, a painted dragon, a StarCraft battle table    |
| `events/tabletop-popup.jpg`       | Tabletop pop-up event crowd                                                                |
| `events/warhammer-tournament.jpg` | 40K tournament in the store                                                                |
| `events/cosplay-may4.jpg`         | Two cosplayers, May the 4th event                                                          |
| `events/paint-contest-sign.jpg`   | "Wintercessor Paint Contest, $6 entry" sign                                                |
| `events/flyer-*.jpg`              | Four real event flyers (use as event cards, they are the store's own designs)              |

Not in the folder on purpose: publisher box art and packaging, a third-party promo, random avatars. Never add Games Workshop, Wizards of the Coast, Riot, Blizzard or any publisher artwork or logos. The painted minis are the store's customers or staff work, so credit them as "painted in the shop" and nothing more.

## Photos: how to wire them in

1. Fill all four `PhotoSlot`s on `/visit` using `src` (storefront, statues, paint wall, playspace). The paint wall slot has no real photo yet, so use `painting/starcraft-table.jpg` or leave that one as the labelled slot and say so in `PLAN.md`.
2. Use real photos on the home page: the hero or the section under it gets `storefront.jpg`, and the "aisles" area gets `store/aisle.jpg` and `store/shelves.jpg`. Keep the comic-panel look: thick ink border, hard offset shadow, slight rotation on at most one card per row.
3. Events: give each event card and the event detail page a photo (real event photos first, the flyers second). Event history rows get the matching flyer thumbnail.
4. Add a small "Painted in the shop" gallery (the `painting/` set) on the home page and on `/visit` or `/events`. Use a simple CSS grid, no carousel libraries.
5. Use `next/image` everywhere with correct `width`/`height`, real `alt` text that describes the photo, `priority` only on the single above-the-fold image, and a `sizes` that matches the layout. Add `blurDataURL` or a dominant-colour background so nothing jumps while loading.
6. Make `og.jpg` (1200x630) from `storefront.jpg` with the store name on the royal-blue banner, and wire it into `lib/content/seo.ts` metadata. Add `twitter` card metadata too.
7. Check `proxy.ts` CSP: images are `'self'`, so local files are fine. Do not loosen the CSP to hotlink anything.
8. Photos with people (cosplay, tabletop event, owner) are for the mockup only. Add them to `docs/CONTENT_TODO.md` as "needs the owner's OK and the people's OK before going live".

## Real content found, use it (and mark what to confirm)

Pulled from the store's own posts and Google (4.6 stars, 419 reviews, 320 Bayfield St, Floor 1 per Google, (705) 719-1291). Keep every item below tied to `?review=1` `[verify]` tags where it is not certain.

- Location: they moved to the lower level of Bayfield Mall, near Bowlerama. 4,100 square feet with a gaming room inside the store. Update `locationNote` and the Visit page to match. Reconcile this with the construction banner and Coulter Street entrance text still in the repo. Those came from the old concept and may be out of date, so keep them behind the banner switch and flag it in `CONTENT_TODO.md`.
- Founding: their own posts say "20th anniversary" on May 4 2024 and "21st anniversary" for 2026. The repo says 2005. Flag it, do not guess.
- Real events seen in posts: monthly Paint Night (a Tuesday, 5:30 to 8:30 pm), paint contests with a small entry fee (Ork-tober, Wintercessor at $6), anniversary event with a cosplay contest (May 3 2025, May 16 2026), "Nightmare Before Christmas" event (Nov 15 2025, cosplay contest at 2 pm), May the Fourth with a Star Wars cosplay photo, 40K tournaments (24 players), a midnight Warhammer 40,000 release, StarCraft: The Miniature Game demos, Riftbound booster launch, a D&D Ravenloft release. Replace the invented event data in `lib/data` with these where the details are clear, and mark dates and fees as sample where they are not.
- The d20 deal is real: flyers say "Take 10% off, or roll a 20-sided die for a chance to win 1 to 20% off" and "$5 off to anyone in costume". Keep the d20 feature, and say in the Roll page copy that it is run at events and in store. Confirm the exact rules with the owner.
- Holiday hours example: open regular hours 9:30 to 9:00 on the Civic Holiday. Hours stay as is (Mon to Fri 9:30 to 9, Sat 9:30 to 6, Sun 11 to 5) until confirmed.
- Reviews (Google): "Tons of variety, staff are super helpful and friendly and know their stuff." and "Awesome and knowledgeable staff, great atmosphere and prices, lots of products." Use these two verbatim, attributed to Google reviews, with the 4.6 / 419 numbers, replacing the Facebook 94% line. Do not invent more.
- The repo says 3.5K Facebook followers. Instagram shows 376 followers. Remove follower counts entirely.
- Owner: Vincent "Vince" Booth. Use "Vince" only where the posts do (birthday post, owner repairs statues). Do not invent a bio.

## Make it look proper (design pass)

The look stays: storefront sign brought online. Royal-blue banner, outlined yellow letters, red d20, comic panels, light mode only. Tokens are in `app/globals.css`, do not change the palette. Fix what makes it feel unfinished:

- Hero: one strong real photo, clear primary action (Check stock) and secondary (Visit), open/closed status, hours and the phone number tap-to-call on mobile. Max one H1.
- Remove every "Photo slot" placeholder that now has a real photo. Where a slot truly has none, hide it outside `?review=1` instead of showing a dashed box to visitors.
- Consistent section rhythm: one spacing scale, same card radius and border weight across home, stock, events, visit. Cards no taller than their content, no orphan buttons, no text on busy photo areas without a solid or gradient backing.
- Typography: Archivo Black for display, Bangers only for small comic accents (badges, stamps), never for body text or long headings. Check line lengths at 360, 768 and 1280.
- Navigation: sticky compact header on mobile with a visible Call button and open/closed dot. Footer has address, phone, hours, Facebook, Instagram and the "Built by Kooht Studio" credit.
- Motion: small and respectful. Respect `prefers-reduced-motion`. No autoplay, no parallax.
- Empty and loading states for stock and events look intentional.
- Every interactive control keeps a visible focus ring and a 44px touch target.

## Performance and quality gates

- Lighthouse mobile 95+ on home, stock, events, visit. LCP image is `priority`, nothing else is. CLS under 0.05.
- No image over 250 KB after `next/image` processing at its largest rendered size. If a source file is heavier, re-export it.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` (including axe on every page) and `pnpm build` must pass. Update the Playwright screenshots (`pnpm screenshots`) and replace the files in `docs/screenshots`.
- Update `public/images/README.md` (what is filled, what is still missing) and `docs/CONTENT_TODO.md` (new items above).
- No new dependencies unless you can justify them in `PLAN.md`. No external image hosts, no hotlinking Facebook or Instagram.

## Done means

I can open the site on a phone and it looks like a real store site: real storefront, real shelves, real events, real reviews, nothing that says "placeholder" unless `?review=1` is on. Give me a short summary, the Lighthouse numbers, and a list of anything that still needs the owner.
