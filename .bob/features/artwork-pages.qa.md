# QA procedures — artwork-pages.feature

Conventions:
- Frontend commands run from `frontend/`: `npx jest --ci --passWithNoTests --testPathIgnorePatterns='e2e/'` for unit/component, `npx playwright test <file>` for e2e, `npx tsc --noEmit` for typecheck.
- `BASE=http://localhost:3000` for a running dev/e2e server unless noted. Adjust port to the project's actual dev command.
- "generated slug" is computed via the project's slug utility (e.g. `frontend/lib/artworkSlug.ts` once it exists) — QA calls it directly in a Node/ts-node snippet or through the exposed unit test, not by guessing transliteration.
- Backend seed data for QA: use an existing artwork id from the real DB via `GET {API}/api/artworks/{id}`, or seed a disposable one through the admin API if the environment allows; never assume ids 7/8/9/12/20/55/88/999999 exist verbatim — substitute real ids and titles from the current DB when running against a live environment, keeping the *conditions* (has price / no price / not for sale / exhibition category / duplicate title) intact.

## Slice 1 — routing

### @S1-AS1
1. `curl -sI $BASE/gallery/<real-slug-for-known-artwork>` → expect `HTTP/1.1 200`.
2. `curl -s $BASE/gallery/<real-slug>` | check the HTML contains `<h1` with the artwork's title text.
3. Cross-check: `GET {API}/api/artworks/{id}` for that id returns the same title.

### @S1-AS2
1. `curl -sI "$BASE/gallery?artwork=<id>"` → expect status `301` (or `308`) and `Location` header equal to `/gallery/<slug-for-id>`.
2. Repeat with `curl -sIL` and confirm the final response is 200 on the slug URL.

### @S1-AS3
1. Pick an id guaranteed absent, e.g. `999999`. `curl -sI "$BASE/gallery?artwork=999999"` → expect `404` (not a 301 to a dead slug).

### @S1-AS4
1. `curl -sI $BASE/gallery/this-slug-does-not-exist-1` → expect `404`.

### @S1-AS5
1. Take a real artwork id `N` and its correct title slug prefix; request `$BASE/gallery/<title-prefix>-<wrong-id>` where `<wrong-id>` is not `N` and not a real id → expect `404`.

### @S1-AS6
1. Take a real artwork id `N`; request `$BASE/gallery/totally-wrong-words-<N>` → expect `200` and the h1 to match artwork `N`'s real title (id wins over title text).

### @S1-AS7
1. Run the slug generator against a title containing Cyrillic and punctuation, e.g. via a small Jest unit test or `node -e` calling the exported function.
2. Assert regex `^[a-z0-9-]+-<id>$` matches the output.
3. `curl -sI $BASE/gallery/<generated-slug>` → expect `200`.

### @S1-AS8
1. Generate slugs for two artworks sharing an identical title but different ids; assert the two strings differ (they end in different ids).
2. `curl` both resulting URLs and confirm each 200s to the correct artwork id (grep the JSON-LD or a data attribute for the id, or check the description/image matches the DB row for that id).

### @S1-AS9
1. Find (or note) an artwork in category "Фото с выставок"; `curl -sI $BASE/gallery/<its-slug>` → `200`.
2. `curl -s` the HTML and grep for the "Узнать цену" button text/selector — assert absent.

## Slice 2 — page content

### @S2-AS1
1. `curl -s $BASE/gallery` and grep for `href="/gallery/<slug>"` for a known artwork id present on the first page of results (or use Playwright: load `/gallery`, assert `page.locator('a[href*="/gallery/"]')` count > 0 and at least one href matches the known slug).

### @S2-AS2
1. Find an artwork with `isForSale=true` and a non-null `price` via `GET {API}/api/artworks/{id}`.
2. `curl -s $BASE/gallery/<slug>` and grep for the formatted price string (e.g. `45 000` with the ruble sign) and for the "Узнать цену" button markup/text.

### @S2-AS3
1. Find (or note) an artwork with `isForSale=true` and `price=null`.
2. Load its page; grep for the literal substring "цена по запросу"; confirm "Узнать цену" button still present.

### @S2-AS4
1. Find an artwork with `isForSale=false`.
2. Load its page; assert the "Узнать цену" button markup is absent.

### @S2-AS5
1. Playwright e2e: navigate to a for-sale artwork's page, intercept `window.ym` calls (inject a stub before navigation or spy via `page.exposeFunction`), click the "Узнать цену" button.
2. Assert the page navigates to a URL starting with `/contacts` and containing a query param identifying the artwork (e.g. `?artwork=<id>` or `?artworkId=<id>` per implementation).
3. Assert the intercepted `ym` call was `reachGoal('contact_click', {..., channel: 'ask_price', ...})` (match the actual param shape the Coder implements; QA verifies goal name `contact_click` and a channel value `ask_price` appear in the call arguments).

### @S2-AS6
1. Pick a category with >= 2 for-sale artworks; load one artwork's page.
2. Grep for heading text "Другие работы этой категории"; parse the linked artwork ids/hrefs in that section and assert the current artwork's own id/slug is not among them.

### @S2-AS7
1. Pick (or construct via admin) an artwork that is the sole for-sale item in its category; load its page.
2. Assert no "Другие работы этой категории" section is rendered, or it renders with zero items (whichever the Coder chooses — QA checks no *other artworks* are listed, not literal DOM absence).

### @S2-AS8
1. Load a known artwork's page; grep the breadcrumb component's text/hrefs.
2. Assert order: link to `/` (text "Главная"), link to `/gallery` (text "Галерея"), then non-link current-page text matching the artwork's title.

### @S2-AS9
1. Load a known artwork's page with a non-null description and category.
2. Assert the `<img>` src for the main image resolves to the `imagePath`-derived S3 URL (not `thumbnailPath`) — compare against `getImageUrl(artwork.imagePath)` output for that record.
3. Grep the page text for the description string and the category name.

## Slice 3 — metadata & schema.org

### @S3-AS1
1. `curl -s $BASE/gallery/<slug>` and extract `<title>...</title>`.
2. Assert it contains the artwork title and the substring "купить" (case-insensitive).
3. `curl -s $BASE/gallery` and extract its `<title>`; assert the two title strings differ.

### @S3-AS2
1. Extract `<link rel="canonical" href="...">` from the artwork page HTML.
2. Assert it equals `https://angelamoiseenko.ru/gallery/<slug>` exactly (no trailing query string, no `/gallery` alone).

### @S3-AS3
1. Extract `<meta property="og:image" content="...">`.
2. Assert the URL matches `getImageUrl(artwork.imagePath)` for that artwork (the S3 host/path), not a generic gallery banner image.

### @S3-AS4
1. Pick a for-sale artwork with a price; `curl -s` its page; extract the `application/ld+json` script contents (there may be more than one `<script type="application/ld+json">` — inspect each).
2. `jq` or JSON-parse the artwork/product block; assert `@type` is `VisualArtwork` or `Product`, `name` matches title, `artMedium` present and non-empty, `creator.name == "Анжела Моисеенко"`, `offers.price == <price>`, `offers.priceCurrency == "RUB"`, `offers.availability` is a schema.org availability URI.

### @S3-AS5
1. Pick an artwork with `isForSale=false`; parse its JSON-LD block; assert no `offers` key present.

### @S3-AS6
1. Parse all JSON-LD script blocks on the artwork page; find the one with `@type == "BreadcrumbList"`.
2. Assert `itemListElement` has exactly 3 entries, `position` 1..3, and the last entry's `name` equals the artwork title.

## Slice 4 — sitemap

### @S4-AS1
1. `curl -s $BASE/sitemap.xml` (or invoke `sitemap()` directly in a Jest test importing `frontend/app/sitemap.ts` with mocked `getGalleryData`).
2. Assert an entry's `<loc>` ends with `/gallery/<slug-for-a-known-for-sale-artwork>`.
3. Assert no `<loc>` contains the substring `?artwork=`.

### @S4-AS2
1. In the same sitemap output, assert there is no `<loc>` matching the slug of a known exhibition-category artwork.

### @S4-AS3
1. Unit test: mock `getGalleryData` to reject/throw; call `sitemap()`; assert it resolves (does not throw) and the returned array still contains the 5 static page entries (`/`, `/gallery`, `/about`, `/contacts`, `/videos`).

## Slice 5 — homepage SEO fields

### @S5-AS1
1. Seed/confirm home content `welcomeMessage` > 150 chars and no SEO title/description set.
2. `curl -s $BASE/` and extract `<title>`; assert length <= 70 and exact text "Купить картину маслом — художник Анжела Моисеенко".
3. Extract `<meta name="description">`; assert it contains "купить" (case-insensitive).

### @S5-AS2
1. Via admin API/UI, set homepage SEO title and description fields to the sample values.
2. `curl -s $BASE/` and assert `<title>` and `<meta name="description">` match exactly what was set.

### @S5-AS3
1. Log into `/admin`, navigate to the home content editor.
2. Assert (via Playwright) two distinct labelled inputs exist for SEO title and SEO description, separate from the `welcomeMessage` field.
3. Change both, save, reload the editor, and confirm the values persisted; confirm `welcomeMessage` value is unaffected.

### @S5-AS4
1. Set the SEO title admin field to an empty string via the admin UI/API.
2. `curl -s $BASE/` and assert `<title>` falls back to "Купить картину маслом — художник Анжела Моисеенко" rather than rendering empty or "undefined".

## Full regression gate (run once per slice before merge)
1. `cd frontend && npx tsc --noEmit`
2. `cd frontend && npx jest --ci --passWithNoTests --testPathIgnorePatterns='e2e/'` — expect all previously-green suites still green plus new suites for this feature.
3. `cd frontend && npx playwright test` (or the specific e2e spec files added for S1/S2/S5).
4. `git checkout -- frontend/tsconfig.json` if `next build` was run as part of the above (per project note that build rewrites it).
