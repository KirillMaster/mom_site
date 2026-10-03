# QA-процедуры: Дизайн-система «Мастерская у моря» (design-system-seaside, 009)

Общие предпосылки:
- Все команды из `frontend/`. Jest: `npx jest <файл> -t "<id>"`. E2E: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/<spec>.ts -g "<id>"` (предварительно `npm run dev` в отдельном процессе; после dev/build откатить `frontend/tsconfig.json`).
- Финально по каждому слайсу: `npx tsc --noEmit`, `npm run lint`, `npx jest` (полный набор зелёный).
- Ожидаемые тесты Coder-а (id сценария в имени теста/describe): `__tests__/palette-contrast.test.ts`, `__tests__/design-tokens.test.ts` (tailwind.config.js, layout.tsx, globals.css как текст), `lib/price.test.ts`, `__tests__/lib-boundaries.test.ts`, `components/ui/*.test.tsx`, `__tests__/MuseumLabel.test.tsx`, `__tests__/GalleryCard.test.tsx`, `__tests__/ArtworkInfoCard.test.tsx`, `__tests__/RelatedWorks.test.tsx`, `__tests__/Navigation.test.tsx`, `__tests__/Footer.test.tsx`, `__tests__/MobileContactBar.test.tsx`, `__tests__/ContactsClientPage.test.tsx`, `__tests__/forbidden-colors.test.ts`; e2e `e2e/design-system.spec.ts`, `e2e/no-overflow.spec.ts`.
- Критерий прохождения: выбранные тесты зелёные, exit code 0, реально выполнены (не 0 прогнано, не skipped). Если путь теста у Coder-а иной, искать по id: `npx jest -t "<id>" --listTests`.
- Админка вне скоупа: не проверять и не менять app/admin, components/admin.

---
## Slice S1

### @US1-FE1
`npx jest __tests__/palette-contrast.test.ts -t "US1-FE1"`. Assert: пять пар (ink/paper, ink-500/paper, white/sea, sea/paper, ochre-700/paper) каждая >= 4.5.
### @US1-FE2
`npx jest __tests__/design-tokens.test.ts -t "US1-FE2"`. Assert: paper #F7F6F3, ink #1F2328, sea #2F4A5C, ochre #B8862F, line #E2DED6; primary/secondary/warm определены; globals.css не содержит `linear-gradient`/`.gradient-bg`/`.text-gradient` с градиентом.
### @US2-AS1
`npx jest __tests__/design-tokens.test.ts -t "US2-AS1"`. Assert: layout.tsx содержит Cormorant_Garamond (latin, cyrillic, weight 500/600, display swap, --font-serif) и Manrope (latin, cyrillic, 400/500/600, swap, --font-sans); className body содержит bg-paper text-ink font-sans; globals h1-h4 font-serif. Ручное: `grep -n "Playfair\|Inter(" app/layout.tsx` пусто.
### @US2-EC1
`npx jest __tests__/design-tokens.test.ts -t "US2-EC1"`. Assert: fontFamily.serif последний элемент `serif`, fontFamily.sans последний `sans-serif`.
### @US2-AS2
`npx jest __tests__/design-tokens.test.ts -t "US2-AS2"`. Assert: `.prose-measure` имеет `max-width: 75ch`.
### @US4-EC4
`npx jest __tests__/design-tokens.test.ts -t "US4-EC4"`. Assert: блок `@media (prefers-reduced-motion: reduce)` отключает animation/transition, упоминает rise-in.
### @US3-FE1
`npx jest lib/price.test.ts -t "US3-FE1"`. Assert (после замены U+00A0/U+202F на пробел): "1 500 ₽", "45 000 ₽", "1 250 000 ₽".
### @US3-FE2
`npx jest lib/price.test.ts -t "US3-FE2"`. Assert: Available price 0 и null -> "цена по запросу"; 45000 -> "45 000 ₽"; Sold -> "Продана"; exhibition -> null.
### @US3-FE3
`npx jest __tests__/lib-boundaries.test.ts -t "US3-FE3"`. Ручное: `grep -rn "function formatPrice\|const formatPrice" app components lib` — одно вхождение в lib/price.ts; `grep -rn "SITE_PHONE =" lib components app` — только lib/site.ts; `grep -rn "from ['\"]@/components" lib` — пусто.
### @US4-FE1
`npx jest components/ui -t "US4-FE1"`. Assert: variant primary -> bg-sea, secondary -> border-sea, ghost -> text-sea; href="/gallery" -> `<a href="/gallery">`; без href -> `<button type="button">`; onClick вызывается, disabled блокирует; focus-visible:ring-sea у всех.
### @US4-FE2
`npx jest components/ui -t "US4-FE2"`. Assert: getByLabelText("Имя"); aria-invalid="true"; aria-describedby -> элемент с "Обязательное поле"; без error нет aria-invalid; Textarea аналогично.
### @US4-FE3
`npx jest components/ui -t "US4-FE3"`. Assert: Card bg-paper-50 border-line, нет shadow-lg; Section py-16 md:py-24; Container max-w-6xl px-4.

---
## Slice S2

### @US3-AS1
`npx jest __tests__/MuseumLabel.test.tsx __tests__/GalleryCard.test.tsx __tests__/ArtworkInfoCard.test.tsx __tests__/RelatedWorks.test.tsx -t "US3-AS1"`. Assert: во всех трёх местах последовательность текстов "«Закат»", "масло, холст", "80 × 70 см", "2026", "45 000 ₽" одинакова. Ручное на dev: /gallery, /gallery/<slug>, блок «Другие работы» на 3 работах.
### @US3-AS2
`npx jest __tests__/MuseumLabel.test.tsx -t "US3-AS2"`. Assert: нет техники/года; нет пустых элементов, "," и " · " в тексте.
### @US3-AS3
`npx jest __tests__/MuseumLabel.test.tsx -t "US3-AS3"`. Assert: "Продана" с классом text-ochre*, цены нет.
### @US3-AS4
`npx jest __tests__/MuseumLabel.test.tsx -t "US3-AS4"`. Assert: "цена по запросу" при price=0.
### @US3-EC2
`npx jest __tests__/MuseumLabel.test.tsx -t "US3-EC2"`. Assert: у названия класс break-words. Ручное: e2e/no-overflow на 390 px при длинном названии (проверяется и в US4-AS3).
### @US3-EC3
`npx jest __tests__/MuseumLabel.test.tsx -t "US3-EC3"`. Assert: только название и "2024"; нет цены/статуса/техники/размера.
### @US3-FE4
`npx jest __tests__/MuseumLabel.test.tsx -t "US3-FE4"`. Assert: из `"Закат"` получается текст "«Закат»", элемент с классами italic и font-serif, двойных кавычек нет.
### @US3-FE5
`npx jest __tests__/ArtworkInfoCard.test.tsx -t "US3-FE5"`. Assert: `getAllByRole("heading",{level:1})` длина 1; название встречается один раз.
### @US1-AS3
`npx jest __tests__/GalleryCard.test.tsx -t "US1-AS3"`. Assert: элемент с "45 000 ₽" имеет класс text-ochre-700.
### @US4-FE7
`npx jest __tests__/GalleryClientPage.test.tsx __tests__/ArtworkInfoCard.test.tsx -t "US4-FE7"`. Assert: 30 работ -> 24 карточки + "Показать ещё"; кнопки с bg-sea/border-sea; в className по галерее нет primary/secondary/purple/indigo/blue/gradient. Существующие тесты галереи/страницы работы остаются зелёными.

---
## Slice S3

### @US5-AS1
`npx jest __tests__/Navigation.test.tsx -t "US5-AS1"` (мок usePathname = "/gallery"). Assert: ссылка "Галерея" aria-current="page" и класс text-sea; у других нет aria-current.
### @US5-AS2
`npx jest __tests__/Navigation.test.tsx -t "US5-AS2"`. Assert: после клика на кнопку меню контейнер с bg-paper и все пункты видимы; после повторного клика пункты скрыты. Ручное: DevTools 390 px — нет горизонтального скролла.
### @US5-FE1
`npx jest __tests__/Navigation.test.tsx -t "US5-FE1"`. Assert: имя художницы с font-serif; header классы bg-paper/95, border-line.
### @US5-FE2
`npx jest __tests__/Footer.test.tsx __tests__/MobileContactBar.test.tsx -t "US5-FE2"`. Assert: Footer bg-ink text-paper; MobileContactBar bg-paper; className контейнеров без `primary|secondary|purple|indigo|blue`.
### @US4-AS1
`npx jest __tests__/ContactsClientPage.test.tsx -t "US4-AS1"`. Assert: поля имени/телефона/email/сообщения и submit содержат focus-visible:ring-sea. Ручное: `/contacts`, Tab по полям — видно морское кольцо.
### @US4-FE4
`npx jest __tests__/ContactsClientPage.test.tsx -t "US4-FE4"`. Assert: getByLabelText для каждого поля; ошибка с role="alert", aria-invalid="true".
### @US4-FE5
`npx jest __tests__/ContactsClientPage.test.tsx -t "US4-FE5"`. Assert: телефон без email -> fetch вызван без email, успех; пусто -> fetch не вызван, текст "Укажите телефон, мессенджер или email"; name-атрибуты, honeypot, тема по ?artwork. Затем `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/conversion.spec.ts` не ломается (внимание: не писать на прод, см. memory e2e-on-prod-safety; только localhost).
### @US4-FE6
`npx jest __tests__/ContactsClientPage.test.tsx -t "US4-FE6"`. Assert: submit с bg-sea; блоки Hero/Details/Social без запрещённых классов.

---
## Slice S4

### @US1-AS1
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/design-system.spec.ts -g "US1-AS1"`. Assert: на /, /gallery, первая работа, /contacts, /blog при 1280 и 390 body background-color = rgb(247, 246, 243), color = rgb(31, 35, 40).
### @US1-AS2
`... -g "US1-AS2"`. Assert: после Tab сфокусированный элемент: outline-color или box-shadow содержит rgb(47, 74, 92).
### @US1-FE4
`npx jest __tests__/HomeClientPage.test.tsx -t "US1-FE4"` (и about-тест). Assert: нет from-/to-/via-/gradient-bg/text-gradient; CTA bg-sea; блок биографии с prose-measure.
### @US1-FE5
`npx jest __tests__/ReviewsList.test.tsx __tests__/VideosClientPage.test.tsx __tests__/BlogCta.test.tsx -t "US1-FE5"`. Assert: нет primary/secondary/purple/indigo/blue; статья блога с prose-measure. Если тестов нет — Coder создаёт; QA проверяет `grep -rnE "primary-|secondary-|purple|indigo|blue-" app/videos app/reviews app/blog components/ReviewsList.tsx components/blog --include=*.tsx` (кроме components/blog/admin) пусто.
### @US2-E2E1
`... -g "US2-E2E1"`. Assert: getComputedStyle(h1).fontFamily содержит "Cormorant", p — "Manrope".
### @US2-E2E2
`... -g "US2-E2E2"`. Assert: на /about ширина абзаца <= 75 * ширина "0" + 1 px (1280 px).
### @US4-AS2
`... -g "US4-AS2"`. Assert: основная кнопка на /, на странице работы и на /contacts: background-color rgb(47, 74, 92), светлый текст.
### @US4-AS3
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/no-overflow.spec.ts e2e/design-system.spec.ts -g "US4-AS3|no-overflow"`. Assert: на 390 px для 8 публичных страниц scrollWidth <= innerWidth; скриншоты в test-results/design/ (1280 и 390) для /, /gallery, первой работы, /contacts.
### @US1-FE6
`npx jest __tests__/forbidden-colors.test.ts -t "US1-FE6"`. Assert: 0 нарушений по app/** и components/** (без исключений), globals.css без gradient. Ручное: `grep -rnE "(bg|text|border|ring|from|to|via)-(primary|secondary|warm|purple|indigo|blue)" app components --include=*.tsx` вне админских путей пусто.
### @US1-FE7
Шаги: `echo 'export const __x = "bg-primary-500";' >> components/Footer.tsx`; `npx jest __tests__/forbidden-colors.test.ts -t "US1-FE7"`; Assert: тест падает, вывод содержит "components/Footer.tsx", номер строки, "bg-primary-500". Затем обязательно `git checkout -- components/Footer.tsx` и проверка `git status --short components/Footer.tsx` пуст. (Если Coder реализовал функцию-сканер, дополнительно юнит с in-memory источником.)
### @US1-EC5
`npx jest __tests__/forbidden-colors.test.ts -t "US1-EC5"`. Assert: список исключений содержит app/admin, components/admin, components/blog/admin, components/MessagesList.tsx, components/AdminPageShell.tsx, components/AdminAuthGuard.tsx; `git diff --stat main -- app/admin components/admin` пуст; `npm run build` проходит.
