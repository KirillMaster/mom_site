<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: 009-design-system-seaside

## `T001` Токены палитры, шрифты и шкала типографики [US1]

frontend/tailwind.config.js: colors paper/ink/sea/ochre/line (с оттенками), fontFamily serif=var(--font-serif), sans=var(--font-sans); app/layout.tsx: Cormorant_Garamond + Manrope вместо Playfair/Inter, body bg-paper text-ink; app/globals.css: base h1–h4 шкала, .caption, .prose-measure, btn-*/card переведены на токены или удалены, gradient-bg/text-gradient удалены, prefers-reduced-motion

**Context**: Единый источник визуальных значений (R2, R4, R5, R7); старые primary/secondary/warm остаются в конфиге только для админки (A-2)

- **Depends on**: —
- **Requirements**: FR-001, FR-004, FR-005, FR-012
- **Entities**: design-tokens
- **Contracts**: —

**Steps**:

1. **Токены** — paper: {DEFAULT:#F7F6F3, 50:#FBFAF8, 100:#F7F6F3, 200:#EFEDE8}; ink: {DEFAULT:#1F2328, 500:#5A6069, 600:#454B53, 700:#33383F, 900:#1F2328}; sea: {DEFAULT:#2F4A5C, 50:#EEF2F5, 100:#D9E2E8, 600:#2F4A5C, 700:#263D4C, 800:#1D2F3B}; ochre: {DEFAULT:#B8862F, 700:#8A6420}; line: {DEFAULT:#E2DED6}. ink-500 на paper должен давать ≥ 4.5:1
2. **Шрифты** — Cormorant_Garamond({subsets:[latin,cyrillic], weight:[500,600], style:[normal,italic], variable:--font-serif, display:swap}); Manrope({subsets:[latin,cyrillic], weight:[400,500,600], variable:--font-sans, display:swap}); body className bg-paper text-ink font-sans
3. **globals.css** — body bg-paper text-ink; h1–h4 font-serif font-medium leading-tight + размеры R5; .caption text-sm text-ink-500; .prose-measure max-width:75ch; @media (prefers-reduced-motion: reduce) отключить rise-in и прочие анимации; удалить .gradient-bg и .text-gradient (заменить использования в T008–T012) — либо оставить класс, но без градиента до их перевода

**Technical Notes**:

- `frontend/tailwind.config.js`: primary/secondary/warm не удалять — админка
- `frontend/app/layout.tsx`: После next dev/build откатывать frontend/tsconfig.json

**Acceptance Criteria**:

- [ ] `AC-1` Сборка и все существующие jest-тесты зелёные; body на paper

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Палитра из tailwind.config.js
  - When: Считается контраст ink/paper, ink-500/paper, white/sea, sea/paper, ochre-700/paper
  - Then: Все ≥ 4.5:1 (frontend/__tests__/palette-contrast.test.ts)
  - Verification: automated

## `T002` lib/price.ts и lib/site.ts (долг 008) [P] [US3]

Перенести formatPrice/priceLabel/sizeLabel из lib/galleryCard.ts в lib/price.ts (galleryCard реэкспортирует или удаляется с обновлением импортов); убрать локальный formatPrice из ArtworkInfoCard; SITE_PHONE перенести в lib/site.ts, PhoneLink и lib/contactChannels, lib/social импортируют из lib

**Context**: Две реализации цены дают разный формат (долг 008); lib → components — нарушение направления зависимостей (P2)

- **Depends on**: —
- **Requirements**: FR-007
- **Entities**: artwork
- **Contracts**: price-lib

**Steps**:

1. **Тесты** — frontend/lib/price.test.ts: formatPrice 1500→«1 500 ₽», 45000→«45 000 ₽», 1250000→«1 250 000 ₽» (нормализовать U+00A0/U+202F к пробелу); priceLabel: price 0/null → «цена по запросу»; Sold → «Продана»; exhibition → null
2. **Перенос** — Обновить импорты GalleryCard, ArtworkInfoCard, существующие тесты; lib/galleryCard.ts удалить, если пуст
3. **SITE_PHONE** — lib/site.ts export const SITE_PHONE; components/PhoneLink реэкспортирует для совместимости или импортирует из lib; grep "from .@/components" в lib/ должен быть пуст

**Technical Notes**:

- `frontend/lib/price.ts`: Intl.NumberFormat ru-RU maximumFractionDigits 0 + " ₽"

**Acceptance Criteria**:

- [ ] `AC-1` Один formatPrice в кодовой базе; lib не импортирует components

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Цены 0, 1500, 45000, 1250000, null
  - When: priceLabel для Available
  - Then: «цена по запросу», «1 500 ₽», «45 000 ₽», «1 250 000 ₽», «цена по запросу»
  - Verification: automated

## `T003` UI-примитивы Button, TextLink, Card, Section, Container [P] [US4]

frontend/components/ui/{Button,TextLink,Card,Section,Container}.tsx + index.ts

**Context**: Единые кнопки/карточки/ритм вместо ручной стилизации на каждой странице (FR-008, FR-009)

- **Depends on**: T001
- **Requirements**: FR-008, FR-009
- **Entities**: design-tokens
- **Contracts**: ui-primitives

**Steps**:

1. **Тесты** — components/ui/__tests__ или *.test.tsx: Button variant primary/secondary/ghost даёт классы bg-sea / border-sea / text-sea; с href — <a> (next/link), без — <button type="button" по умолчанию>; пробрасывает onClick, disabled, aria-*; все имеют focus-visible:ring-sea. TextLink — text-sea underline-offset. Card — bg-paper-50 border-line без shadow-lg. Section — py-16 md:py-24; Container — max-w-6xl px-4
2. **Реализация** — Классы фокуса: focus:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-2 focus-visible:ring-offset-paper. Primary: bg-sea text-white hover:bg-sea-700; secondary: border border-sea text-sea hover:bg-sea-50; ghost: text-sea hover:underline. rounded-md, без теней

**Technical Notes**:

- `frontend/components/ui/`: className-проп мерджится в конец; без новых зависимостей (без clsx, если его нет)

**Acceptance Criteria**:

- [ ] `AC-1` Примитивы покрыты тестами, экспортируются из components/ui

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Button variant=secondary href=/gallery
  - When: Рендерится
  - Then: <a href="/gallery"> с классами secondary и кольцом фокуса
  - Verification: automated

## `T004` UI-примитивы Input и Textarea [P] [US4]

frontend/components/ui/{Input,Textarea}.tsx: label, error, hint; useId; aria-invalid, aria-describedby

**Context**: Форма контактов — ключевая точка конверсии; фокус и ошибки должны быть доступны (FR-008, FR-009)

- **Depends on**: T001
- **Requirements**: FR-008, FR-009
- **Entities**: design-tokens
- **Contracts**: ui-primitives

**Steps**:

1. **Тесты** — getByLabelText находит поле; error → role=alert/текст, aria-invalid=true, aria-describedby указывает на id ошибки; forwardRef и пропсы (name, required, value, onChange) пробрасываются
2. **Реализация** — bg-white border border-line rounded-md px-3 py-2 text-ink placeholder:text-ink-500 focus-visible:ring-2 ring-sea; ошибка text-red-700 (контраст ≥ 4.5)

**Technical Notes**:

- `frontend/components/ui/Input.tsx`: forwardRef

**Acceptance Criteria**:

- [ ] `AC-1` Метка и ошибка программно связаны с полем

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Input label="Имя" error="Обязательное поле"
  - When: Рендерится
  - Then: Поле aria-invalid=true, aria-describedby → текст ошибки
  - Verification: automated

## `T005` MuseumLabel и применение в галерее, карточке, RelatedWorks [US3]

frontend/components/artwork/MuseumLabel.tsx; заменить подписи в app/gallery/GalleryCard.tsx, app/gallery/[slug]/ArtworkInfoCard.tsx (заголовок + цена) и app/gallery/[slug]/RelatedWorks.tsx

**Context**: Сигнатура стиля и единый формат подписи/цены (FR-006, FR-007)

- **Depends on**: T001, T002
- **Requirements**: FR-006, FR-007
- **Entities**: museum-label, artwork
- **Contracts**: museum-label-component, price-lib

**Steps**:

1. **Тесты** — MuseumLabel.test.tsx: полная работа → «Закат» (italic, font-serif), «масло, холст», «80 × 70 см», «2026», «45 000 ₽» (text-ochre-700); без technique/support/year → этих строк нет; Sold → «Продана»; exhibition → только название и год; название "\"Закат\"" → «Закат» (normalizeTitle/quotedTitle); длинное название — break-words
2. **Компонент** — Порядок строк: title (as h2/h3/p, italic font-serif, в «…»), medium = [technique, support].filter(Boolean).join(", ") lower-case как в данных, size = sizeLabel, year, priceOrStatus = priceLabel. size sm|md меняет кегль. Тонкая линия border-t border-line над ценой
3. **Применение** — GalleryCard: убрать собственные строки цены/размера/статуса → MuseumLabel size=sm; RelatedWorks: MuseumLabel size=sm; ArtworkInfoCard: h1 названия остаётся для SEO, под ним MuseumLabel size=md без дублирования названия (проп hideTitle) либо h1 рендерится MuseumLabel as=h1 — выбрать вариант, сохраняющий единственный h1. Обновить существующие тесты страниц

**Technical Notes**:

- `frontend/components/artwork/MuseumLabel.tsx`: ≤ 80 строк; без бизнес-логики помимо lib/price и normalizeTitle

**Acceptance Criteria**:

- [ ] `AC-1` Три места показа используют MuseumLabel; одинаковые строки и формат

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Работа без техники и года
  - When: Рендерится MuseumLabel
  - Then: Строк техники и года нет, лишних разделителей нет
  - Verification: automated

## `T006` Шапка, мобильное меню, футер, MobileContactBar [P] [US5]

components/Navigation.tsx, components/Footer.tsx, app/gallery/[slug]/MobileContactBar.tsx, app/gallery/[slug]/ContactChannels.tsx на токенах и примитивах

**Context**: Обрамление видно на каждой странице (FR-010, FR-011)

- **Depends on**: T001, T003
- **Requirements**: FR-010, FR-011, FR-009
- **Entities**: design-tokens
- **Contracts**: ui-primitives

**Steps**:

1. **Тесты** — Navigation.test.tsx: при pathname /gallery ссылка «Галерея» aria-current=page и text-sea; мобильное меню открывается/закрывается; Footer: нет классов primary/secondary/purple/indigo/blue
2. **Шапка** — bg-paper/95 backdrop-blur border-b border-line; имя художницы font-serif text-2xl text-ink; пункты text-ink-700 hover:text-sea, активный text-sea + underline decoration-ochre underline-offset-8; мобильное меню bg-paper
3. **Футер и панели** — Footer bg-ink text-paper, ссылки text-paper/80 hover:text-white, разделители border-white/10; MobileContactBar bg-paper border-t border-line, кнопки Button primary/secondary; ContactChannels — Button secondary

**Technical Notes**:

- `frontend/components/Navigation.tsx`: usePathname; aria-current только у активного

**Acceptance Criteria**:

- [ ] `AC-1` Шапка/футер/панель только в цветах палитры; aria-current у активного пункта

**Test Scenarios**:

- `TS-1` (unit)
  - Given: pathname /gallery
  - When: Рендерится Navigation
  - Then: «Галерея» aria-current=page
  - Verification: automated

## `T007` Галерея и страница работы [P] [US4]

app/gallery/{GalleryHeader,GalleryFilters,GalleryGrid,GalleryCard}.tsx, app/gallery/[slug]/{page,ArtworkGallery,ArtworkInfoCard,AskPriceButton,RelatedWorks}.tsx на токенах, Button/Card/Section/Container; описание работы .prose-measure

**Context**: Основной путь к покупке (FR-002, FR-010)

- **Depends on**: T003, T005
- **Requirements**: FR-002, FR-005, FR-010
- **Entities**: design-tokens
- **Contracts**: ui-primitives

**Steps**:

1. **Замена цветов** — primary-*→sea/ochre по смыслу (цена → ochre-700, действия → sea), gray-* текст → ink/ink-500/ink-600, bg-white карточек → bg-paper-50 border-line, ring-purple/indigo/blue → ring-sea, градиенты удалить
2. **Примитивы** — «Показать ещё» и «Узнать цену»/«Написать» — Button; фильтры-чипы — Button ghost/secondary с aria-pressed
3. **Тесты** — Обновить существующие тесты галереи/карточки, если завязаны на классы; поведение (24/«Показать ещё», ссылки, цели аналитики) не меняется

**Technical Notes**:

- `frontend/app/gallery/[slug]/page.tsx`: 179 строк — не превысить 200

**Acceptance Criteria**:

- [ ] `AC-1` В перечисленных файлах нет запрещённых классов; все jest зелёные

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Страница работы
  - When: Рендерится
  - Then: Основная кнопка — Button primary (bg-sea)
  - Verification: automated

## `T008` Главная и «О художнице» [P] [US4]

app/HomeClientPage.tsx, app/about/AboutClientPage.tsx, components/ArtworkCarousel.tsx, components/ArtistCredentials.tsx, components/ExhibitionTimeline.tsx на токенах и примитивах; биография .prose-measure

**Context**: Первый экран и доверие (FR-002, FR-005, FR-010)

- **Depends on**: T003
- **Requirements**: FR-002, FR-005, FR-010
- **Entities**: design-tokens
- **Contracts**: ui-primitives

**Steps**:

1. **Замена цветов и градиентов** — Hero без градиентов: фон paper, заголовок font-serif text-ink, CTA Button primary + secondary; секции через Section/Container; акценты ochre только декоративные линии
2. **Тесты** — Обновить HomeClientPage.test.tsx и др. при необходимости; поведение не меняется

**Technical Notes**:

- `frontend/app/about/AboutClientPage.tsx`: 243 строки — при правке вынести секцию в отдельный компонент, чтобы не расти (P3)

**Acceptance Criteria**:

- [ ] `AC-1` Нет запрещённых классов; абзацы биографии ≤ 75ch

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Главная
  - When: Рендерится
  - Then: CTA — Button primary, нет классов from-/to- градиента
  - Verification: automated

## `T009` Видео и отзывы [P] [US4]

app/videos/VideosClientPage.tsx, app/reviews/ReviewsClientPage.tsx, components/ReviewsList.tsx на токенах и примитивах

**Context**: FR-002, FR-010

- **Depends on**: T003, T004
- **Requirements**: FR-002, FR-010
- **Entities**: design-tokens
- **Contracts**: ui-primitives

**Steps**:

1. **Замена** — Цвета → токены; форма отзыва (если есть) → Input/Textarea; кнопки → Button; карточки → Card
2. **Тесты** — Обновить ReviewsList.test.tsx при необходимости

**Technical Notes**:

- `frontend/app/videos/VideosClientPage.tsx`: 263 строки — не увеличивать; по возможности вынести блок

**Acceptance Criteria**:

- [ ] `AC-1` Нет запрещённых классов; jest зелёные

**Test Scenarios**:

- `TS-1` (unit)
  - Given: ReviewsList
  - When: Рендерится
  - Then: Нет классов indigo/purple/blue
  - Verification: automated

## `T010` Контакты [P] [US4]

app/contacts/{ContactsHero,ContactDetailsCard,ContactsSocialSection,ContactFormFields}.tsx: поля формы → Input/Textarea, кнопка отправки → Button primary

**Context**: Форма — точка конверсии; фокус и ошибки (FR-008, FR-009)

- **Depends on**: T003, T004
- **Requirements**: FR-002, FR-008, FR-009, FR-010
- **Entities**: design-tokens
- **Contracts**: ui-primitives

**Steps**:

1. **Форма** — Сохранить name-атрибуты, валидацию 008 (email или телефон), honeypot, ?artwork; ошибки через error-проп
2. **Тесты** — Существующие тесты контактов зелёные; e2e conversion.spec.ts не ломается (селекторы по label/name)

**Technical Notes**:

- `frontend/app/contacts/ContactFormFields.tsx`: Проверить селекторы в e2e/conversion.spec.ts

**Acceptance Criteria**:

- [ ] `AC-1` Tab по форме — у каждого поля и кнопки морское кольцо фокуса

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Форма контактов
  - When: Рендерится
  - Then: Поля имеют связанные метки; кнопка — Button primary
  - Verification: automated

## `T011` Блог (публичная часть) [P] [US4]

app/blog/**/page.tsx, components/blog/{BlogCta,Pagination,CategoryTabs,PostCard,RelatedArtworks,BlogList}.tsx и прочие публичные blog-компоненты на токенах; текст статьи .prose-measure

**Context**: FR-002, FR-005, FR-010

- **Depends on**: T003
- **Requirements**: FR-002, FR-005, FR-010
- **Entities**: design-tokens
- **Contracts**: ui-primitives

**Steps**:

1. **Замена** — components/blog/admin не трогать

**Technical Notes**:

- `frontend/components/blog/admin/`: Вне скоупа

**Acceptance Criteria**:

- [ ] `AC-1` Нет запрещённых классов в публичном блоге

**Test Scenarios**:

- `TS-1` (unit)
  - Given: PostCard
  - When: Рендерится
  - Then: Используются токены, нет primary/secondary
  - Verification: automated

## `T012` Гард запрещённых цветовых классов [US1]

frontend/lib/publicSurface.ts (список исключений админки) + frontend/__tests__/forbidden-colors.test.ts: обход app/** и components/** (кроме исключений), regex R3; плюс globals.css без gradient

**Context**: Регресс-защита стиля в CI (FR-013, SC-001)

- **Depends on**: T005, T006, T007, T008, T009, T010, T011
- **Requirements**: FR-002, FR-013
- **Entities**: design-tokens
- **Contracts**: —

**Steps**:

1. **Тест** — fs-обход .ts/.tsx (без *.test.*), исключения: app/admin, components/admin, components/blog/admin, components/MessagesList.tsx, components/AdminPageShell.tsx, components/AdminAuthGuard.tsx; падение выводит файл:строку:класс
2. **Дочистить** — Исправить оставшиеся вхождения в публичных файлах (not-found.tsx, LoadingSpinner, PhoneLink, MaxIcon и др.)

**Technical Notes**:

- `frontend/__tests__/forbidden-colors.test.ts`: Работает в jest CI

**Acceptance Criteria**:

- [ ] `AC-1` Тест зелёный; добавление text-purple-500 в публичный компонент роняет его

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Исходники публичной части
  - When: Запускается гард
  - Then: 0 вхождений
  - Verification: automated

## `T013` E2E: дизайн-проверки и скриншоты [US5]

frontend/e2e/design-system.spec.ts: фон body rgb(247, 246, 243) на 1280 и 390; font-family h1 содержит Cormorant, p — Manrope; ширина абзаца биографии ≤ 75ch; скриншоты главной, /gallery, первой работы, /contacts на 1280 и 390 в test-results/design/; no-overflow.spec.ts зелёный

**Context**: TS-3 US1, TS-1/2 US2, TS-2 US5, SC-005

- **Depends on**: T012
- **Requirements**: FR-001, FR-004, FR-005, FR-012
- **Entities**: design-tokens
- **Contracts**: —

**Steps**:

1. **Спека** — page.evaluate(getComputedStyle); 75ch = 75 * ширина «0» в шрифте абзаца, допуск 1px; собирать console errors
2. **Прогон** — Локально против next dev (PLAYWRIGHT_BASE_URL=http://localhost:3000), затем против прода после деплоя

**Technical Notes**:

- `frontend/e2e/design-system.spec.ts`: Без записи данных на прод

**Acceptance Criteria**:

- [ ] `AC-1` design-system и no-overflow зелёные на chromium

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: Главная на 390 px
  - When: Считывается фон body
  - Then: rgb(247, 246, 243)
  - Verification: automated

