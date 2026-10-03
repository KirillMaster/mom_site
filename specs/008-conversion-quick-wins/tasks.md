<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: 008-conversion-quick-wins

## `T001` Утилита normalizeTitle [P] [US8]

Создать frontend/lib/normalizeTitle.ts: trim + снятие одной пары обрамляющих кавычек (" ' « » „ “ ”), внутренние сохраняются; quotedTitle(raw) → «normalized»

**Context**: Названия нужны в карточках, заголовках, тексте мессенджеров и теме формы — единая точка нормализации (R7)

- **Depends on**: —
- **Requirements**: FR-019
- **Entities**: artwork
- **Contracts**: —

**Steps**:

1. **Написать тесты** — frontend/lib/normalizeTitle.test.ts: "Закат" → Закат; «Закат» → Закат; „Закат“ → Закат; Дом «у моря» → без изменений; пустая строка → пустая; quotedTitle("\"Закат\"") → «Закат»
2. **Реализовать** — export function normalizeTitle(raw: string | null | undefined): string; export function quotedTitle(raw): string

**Technical Notes**:

- `frontend/lib/normalizeTitle.ts`: Без any; ≤ 50 строк на функцию

**Acceptance Criteria**:

- [ ] `AC-1` Все тест-кейсы зелёные; данные в БД не меняются

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Название "Закат" в двойных кавычках
  - When: normalizeTitle
  - Then: Возвращает Закат
  - Verification: automated

## `T002` Backend: поля характеристик Artwork и миграция [P] [US1]

enum ArtworkStatus (Available, Sold, PrivateCollection, Unavailable, NotForSale, NotMine) в Core/Models; поля Status, WidthCm, HeightCm, Year, Support, Technique в Artwork.cs; миграция AddArtworkCatalogFields с переносом данных

**Context**: Покупателю нужны размер/техника/статус; поля строго по data-model 005, чтобы импорт 005 лёг без конфликтов (R1, A-1, A-2)

- **Depends on**: —
- **Requirements**: FR-001
- **Entities**: artwork
- **Contracts**: —

**Steps**:

1. **Добавить enum и поля** — backend/MomSite.Core/Models/ArtworkStatus.cs; Artwork: ArtworkStatus Status = Available; int? WidthCm [Range(1,1000)]; int? HeightCm [Range(1,1000)]; int? Year; [MaxLength(100)] string? Support; [MaxLength(100)] string? Technique
2. **Сгенерировать миграцию** — dotnet ef migrations add AddArtworkCatalogFields --project MomSite.Infrastructure --startup-project MomSite.API --output-dir Data/Migrations; в Up после AddColumn: migrationBuilder.Sql("UPDATE \"Artworks\" SET \"Status\" = CASE WHEN \"IsForSale\" THEN 0 ELSE 4 END")
3. **Проверить имена таблиц** — Сверить имя таблицы/колонок с ApplicationDbContextModelSnapshot.cs; Status хранится int

**Technical Notes**:

- `backend/MomSite.Core/Models/Artwork.cs`: IsForSale остаётся колонкой (R2)
- `backend/MomSite.Infrastructure/Data/Migrations/`: Последняя миграция 20261002174348_AddBlog

**Acceptance Criteria**:

- [ ] `AC-1` dotnet build зелёный; миграция применяется на чистой и существующей БД; непродаваемые работы получают NotForSale

**Test Scenarios**:

- `TS-1` (integration)
  - Given: БД с работой IsForSale=false
  - When: dotnet ef database update
  - Then: Status = NotForSale
  - Verification: automated

## `T003` Backend: DTO, маппинг и синхронизация IsForSale [US1]

Расширить ArtworkDto, ArtworkAdminDto, MappingExtensions, Create/Update DTO в ArtworksController новыми полями; при сохранении IsForSale = Status == Available; валидация Year 1950..текущий год

**Context**: Фронт и админка должны получать/передавать характеристики; старые потребители IsForSale не ломаются (R2)

- **Depends on**: T002
- **Requirements**: FR-001, FR-003
- **Entities**: artwork
- **Contracts**: public-artwork-dto, admin-artwork-upsert

**Steps**:

1. **Тесты** — MomSite.Tests: маппинг возвращает новые поля; PUT с Status=Sold → IsForSale=false; WidthCm=0 или Year=1900 → 400 с ошибкой поля
2. **Расширить DTO** — Status сериализуется строкой (JsonStringEnumConverter на свойстве); camelCase поля widthCm, heightCm, year, support, technique, status
3. **Обновить контроллер** — ArtworksController Create (строка ~109) и Update (~137): присвоить поля, IsForSale = dto.Status == ArtworkStatus.Available; Year валидировать IValidatableObject в DTO
4. **Публичный API** — PublicController gallery и BlogPublicDtos, где маппятся работы, — через MappingExtensions

**Technical Notes**:

- `backend/MomSite.API/Controllers/ArtworksController.cs`: Inline DTO-классы на строках 170–190; если файл > 200 строк — вынести DTO в DTOs/ArtworkUpsertDto.cs
- `backend/MomSite.API/DTOs/MappingExtensions.cs`: Единая точка маппинга

**Acceptance Criteria**:

- [ ] `AC-1` GET /api/public/gallery отдаёт status и характеристики; PUT валидирует диапазоны

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Работа Available
  - When: PUT status=Sold
  - Then: 200, isForSale=false, status=Sold
  - Verification: automated
- `TS-2` (integration)
  - Given: Работа
  - When: PUT widthCm=0
  - Then: 400 с ошибкой WidthCm
  - Verification: automated

## `T004` Админка: поля характеристик в форме работы [P] [US1]

ArtworkFormFields: селект статуса (русские подписи), числа ширина/высота/год, текст техника/основа; типы фронта и useArtworkSave передают поля

**Context**: Художница сама заполняет характеристики (FR-003)

- **Depends on**: T003
- **Requirements**: FR-003
- **Entities**: artwork
- **Contracts**: admin-artwork-upsert

**Steps**:

1. **Добавить тип** — frontend/types/artwork.ts (или существующий тип в lib/api.ts): ArtworkStatus union и поля; lib/artworkStatus.ts — карта подписей: Available «В наличии», Sold «Продана», PrivateCollection «В частной коллекции», Unavailable «Недоступна», NotForSale «Не продаётся», NotMine «Не моя работа»
2. **Поля формы** — components/admin/ArtworkFormFields.tsx — вынести блок в ArtworkSpecsFields.tsx (лимит 200 строк); пустые числа → null
3. **Тест** — Jest: заполнение полей уходит в payload useArtworkSave

**Technical Notes**:

- `frontend/components/admin/useArtworkSave.ts`: Сериализация payload

**Acceptance Criteria**:

- [ ] `AC-1` Сохранение работы с характеристиками и повторное открытие показывает введённые значения

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Открыта форма работы
  - When: Ввести 60×80, холст, масло, 2024, Продана и сохранить
  - Then: Payload содержит widthCm=60, heightCm=80, support, technique, year, status=Sold
  - Verification: automated

## `T005` Карточка: блок ArtworkSpecs и логика цены по статусу [P] [US1]

Компонент app/gallery/[slug]/ArtworkSpecs.tsx — список только заполненных: Размер «Ш × В см», Техника, Основа, Год, Статус; на page.tsx: для не-Available цена скрыта, «Узнать цену» → «Заказать похожую»; для выставочных фото блок не показывается

**Context**: Главная информация для решения о покупке (US1, FR-002, FR-004, FR-020)

- **Depends on**: T003
- **Requirements**: FR-002, FR-004, FR-020
- **Entities**: artwork
- **Contracts**: public-artwork-dto

**Steps**:

1. **Тесты** — ArtworkSpecs.test.tsx: только заполненные строки; ширина без высоты — размер не показан; статус всегда
2. **Реализовать** — <dl> с семантикой; lib/artworkStatus.ts для подписей; page.tsx использует isExhibitionPhoto из lib/gallery
3. **Кнопка** — AskPriceButton принимает variant: "price" | "similar"; similar ведёт на /contacts?artwork=<title>&similar=1

**Technical Notes**:

- `frontend/app/gallery/[slug]/page.tsx`: Заголовок через quotedTitle (T001)

**Acceptance Criteria**:

- [ ] `AC-1` Карточка Sold-работы без цены, с «Заказать похожую»; у выставочного фото нет характеристик

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Работа Available 60×80 без года
  - When: Рендер карточки
  - Then: Есть Размер 60 × 80 см и Статус «В наличии»; Нет строки Год
  - Verification: automated

## `T006` lib/contactChannels: каналы и предзаполненный текст [P] [US2]

buildPrefilledMessage(title, url) и buildContactChannels({title, url, socialLinks, phone}) → ContactChannel[] (telegram, whatsapp, max, phone), только с непустым href

**Context**: Единая логика для кнопок карточки и мобильной панели (R4, A-3, A-4)

- **Depends on**: T001
- **Requirements**: FR-005, FR-006
- **Entities**: contact-channel
- **Contracts**: contact-channels-lib

**Steps**:

1. **Тесты** — lib/contactChannels.test.ts: текст «Здравствуйте! Интересует картина «Закат» https://…»; wa.me/<digits>?text=<encodeURIComponent>; без whatsapp в socialLinks — whatsapp строится из phone; без telegram — канал отсутствует; max через maxProfileUrl; phone → tel:+7…
2. **Реализовать** — Использовать SITE_PHONE и maxProfileUrl из lib/social.ts

**Technical Notes**:

- `frontend/lib/social.ts`: maxProfileUrl(explicitUrl, phone)
- `frontend/components/ClickTracker.tsx`: Уже распознаёт wa.me и tel: — избегать двойной цели: кнопкам ставить data-ym-tracked

**Acceptance Criteria**:

- [ ] `AC-1` Функции покрыты тестами, корректный URL-encoding кириллицы

**Test Scenarios**:

- `TS-1` (unit)
  - Given: socialLinks без telegram, phone задан
  - When: buildContactChannels
  - Then: whatsapp, max, phone; telegram отсутствует
  - Verification: automated

## `T007` Кнопки мессенджеров на карточке и цели Метрики [US2]

ContactChannels.tsx в app/gallery/[slug]: ряд кнопок рядом с «Узнать цену»; onClick → reachGoal(Goals.ContactClick, {channel, artwork}); target=_blank rel=noopener для веб-ссылок

**Context**: Быстрый путь к диалогу вместо формы (US2)

- **Depends on**: T006
- **Requirements**: FR-005, FR-007, FR-020
- **Entities**: contact-channel, artwork
- **Contracts**: contact-channels-lib

**Steps**:

1. **Получить контакты** — page.tsx (server) запрашивает /api/public/contacts (socialLinks, phone) с тем же revalidate, что и работа; передать в компонент
2. **Тесты** — ContactChannels.test.tsx: рендерит только каналы с href; клик вызывает reachGoal с channel и artwork; data-ym-tracked стоит
3. **Реализовать** — Иконки: существующий MaxIcon, inline-SVG для telegram/whatsapp; aria-label «Написать в WhatsApp» и т.п.

**Technical Notes**:

- `frontend/lib/analytics.ts`: Goals.ContactClick = contact_click

**Acceptance Criteria**:

- [ ] `AC-1` Кнопки видны на карточке работы (не выставочной), каждая шлёт цель

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Карточка работы с настроенными контактами
  - When: Клик WhatsApp
  - Then: reachGoal(contact_click, {channel: whatsapp, artwork: Закат}); href начинается с https://wa.me/
  - Verification: automated

## `T008` Мобильная панель «Написать / Позвонить» [P] [US2]

MobileContactBar.tsx: fixed bottom-0 md:hidden, safe-area-inset, «Написать» (whatsapp или telegram — первый доступный) и «Позвонить»; страница получает pb-20 md:pb-0

**Context**: На мобильном CTA должен быть всегда под пальцем (FR-008, R8)

- **Depends on**: T006
- **Requirements**: FR-008, FR-007, FR-020
- **Entities**: contact-channel
- **Contracts**: contact-channels-lib

**Steps**:

1. **Тесты** — Jest: без мессенджеров показывает только «Позвонить»; клик шлёт цель
2. **Подключить** — Рендер в page.tsx только для не-выставочных работ

**Technical Notes**:

- `frontend/app/gallery/[slug]/MobileContactBar.tsx`: z-index ниже модалок галереи ArtworkGallery

**Acceptance Criteria**:

- [ ] `AC-1` На 390 px панель видна, футер доступен целиком

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: Viewport 390×844, карточка работы
  - When: Прокрутка до низа
  - Then: Панель видна; Последний элемент футера не перекрыт
  - Verification: automated

## `T009` Backend: Phone в ContactMessage и правило email|phone [P] [US3]

ContactMessage: Email nullable, Phone [MaxLength(100)]; миграция AddContactPhone; ContactMessageDto: Email без [Required], Phone ≤ 100, IValidatableObject — ошибка «Укажите email или телефон», если оба пусты; Phone в BuildContactMessageEntity, ContactMessageAdminDto, TelegramNotifier, EmailNotifier

**Context**: Покупатели чаще оставляют телефон, чем email (R3)

- **Depends on**: —
- **Requirements**: FR-009, FR-010
- **Entities**: contact-message
- **Contracts**: public-contact-message

**Steps**:

1. **Тесты** — MomSite.Tests: только phone → 200; оба пусты → 400; email невалидный → 400; phone 101 символ → 400; уведомление содержит телефон
2. **Модель и миграция** — dotnet ef migrations add AddContactPhone ... --output-dir Data/Migrations
3. **Уведомления** — TelegramNotifier строка ~125 и EmailNotifier: строка «Телефон/мессенджер: …», Email выводить «—» если null; EmailNotifier ReplyTo только при наличии email

**Technical Notes**:

- `backend/MomSite.Core/Models/ContactMessageDto.cs`: [EmailAddress] пропускает null, но не пустую строку — нормализовать пустую в null
- `backend/MomSite.API/Controllers/PublicController.cs`: TryPersistContactMessageAsync(entity, string fromEmail) → string?

**Acceptance Criteria**:

- [ ] `AC-1` Заявка только с телефоном сохраняется и приходит в Telegram с телефоном

**Test Scenarios**:

- `TS-1` (integration)
  - Given: DTO с phone и пустым email
  - When: POST /api/public/contact-message
  - Then: 200, в БД Phone заполнен
  - Verification: automated
- `TS-2` (integration)
  - Given: DTO без email и phone
  - When: POST
  - Then: 400 с сообщением «Укажите email или телефон»
  - Verification: automated

## `T010` Форма контактов: телефон, ?artwork, бренд-кнопка; телефон в админке сообщений [US3]

ContactsClientPage: поле «Телефон или мессенджер», email необязателен, клиентская проверка «хотя бы одно»; тема из ?artwork (normalizeTitle, обрезка до лимита темы); ?similar=1 → «Похожая на «…»»; кнопка отправки bg-primary; MessagesList показывает телефон

**Context**: Снижает трение формы (US3, FR-009–FR-011)

- **Depends on**: T009, T001
- **Requirements**: FR-009, FR-010, FR-011
- **Entities**: contact-message
- **Contracts**: public-contact-message

**Steps**:

1. **Тесты** — Jest: ?artwork=%22Закат%22 → тема «Картина «Закат»»; отправка без email и телефона показывает ошибку; с телефоном — payload содержит phone; кнопка имеет класс bg-primary
2. **Реализовать** — Если файл > 200 строк — вынести поля формы в ContactFormFields.tsx; useSearchParams внутри Suspense
3. **Админка** — components/MessagesList.tsx — колонка/строка телефона

**Technical Notes**:

- `frontend/app/contacts/ContactsClientPage.tsx`: email required около строк 191–198

**Acceptance Criteria**:

- [ ] `AC-1` Форма отправляется с одним телефоном; тема подставлена

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: /contacts?artwork=Закат
  - When: Ввести телефон и сообщение, отправить
  - Then: Запрос содержит phone и subject с «Закат»; Показано подтверждение
  - Verification: automated

## `T011` Галерея: пагинация по 24, lazy, карточка-ссылка с ценой и размером [P] [US4]

GalleryClientPage: visibleCount 24, «Показать ещё» +24, сброс при смене категории; первые 4 изображения eager, остальные loading=lazy decoding=async; карточка целиком <Link>; убрать «Перейти к описанию» и «Узнать цену»; показать цену (Available) или «цена по запросу», размер если заполнен, название через normalizeTitle

**Context**: Сокращает вес страницы и путь к работе (US4)

- **Depends on**: T003, T001
- **Requirements**: FR-012, FR-013, FR-014, FR-015
- **Entities**: artwork, category
- **Contracts**: public-artwork-dto

**Steps**:

1. **Тесты** — GalleryClientPage.test.tsx: 30 работ → 24 карточки, клик «Показать ещё» → 30 и кнопка скрыта; смена категории → снова ≤ 24; карточка — один link; цена 15 000 ₽ или «цена по запросу»; обновить старые тесты про ask-price
2. **Реализовать** — Вынести карточку в app/gallery/GalleryCard.tsx и хук useGalleryPaging в lib (лимит 200 строк); поддержать ?category=<id> как начальный фильтр (нужно для T012)
3. **Sitemap** — Проверить app/sitemap.ts — все работы в sitemap вне зависимости от пагинации (FR-015)

**Technical Notes**:

- `frontend/app/gallery/GalleryClientPage.tsx`: Строки 185 и 208 — текущие кнопки; isExhibitionPhoto из lib/gallery

**Acceptance Criteria**:

- [ ] `AC-1` Пагинация и карточки соответствуют FR-012–FR-014; sitemap содержит все работы

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Галерея с 30 работами
  - When: Открыть и нажать «Показать ещё»
  - Then: Сначала 24 карточки; После клика 30, кнопка скрыта
  - Verification: automated

## `T012` RelatedWorks: максимум 8 и «Смотреть все» [US5]

RelatedWorks.tsx: исключить текущую, slice(0, 8), ссылка «Смотреть все» → /gallery?category=<categoryId>; скрыть блок, если других нет

**Context**: Длинная лента похожих тормозит и уводит от CTA (US5)

- **Depends on**: T011
- **Requirements**: FR-016
- **Entities**: artwork, category
- **Contracts**: —

**Steps**:

1. **Тесты** — RelatedWorks.test.tsx: 12 работ категории → 8 карточек и ссылка с ?category=; 0 других → блока нет
2. **Реализовать** — Названия через normalizeTitle

**Technical Notes**:

- `frontend/app/gallery/[slug]/RelatedWorks.tsx`: Существующий компонент

**Acceptance Criteria**:

- [ ] `AC-1` Не более 8 работ, ссылка ведёт на галерею с выбранной категорией

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Категория с 12 работами
  - When: Рендер RelatedWorks для одной из них
  - Then: 8 карточек без текущей; Ссылка /gallery?category=<id>
  - Verification: automated

## `T013` Убрать горизонтальный overflow и e2e на 390 px [P] [US6]

AboutClientPage: декоративный элемент -bottom-6 -right-6 не выходит за вьюпорт (overflow-hidden у обёртки или right-0 на мобильном); e2e/no-overflow.spec.ts проверяет scrollWidth ≤ clientWidth на /, /gallery, первой карточке, /about, /videos, /reviews, /contacts, /blog

**Context**: Горизонтальный скролл на мобильном — P0-дефект (US6)

- **Depends on**: —
- **Requirements**: FR-017
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Написать e2e** — page.setViewportSize({width: 390, height: 844}); после networkidle evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) ≤ 0; карточку брать по первой ссылке /gallery/ со страницы галереи
2. **Исправить** — frontend/app/about/AboutClientPage.tsx; прогнать e2e и починить другие найденные страницы

**Technical Notes**:

- `frontend/e2e/`: Существующие спеки как образец конфигурации baseURL

**Acceptance Criteria**:

- [ ] `AC-1` e2e зелёный на всех 8 страницах

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: Viewport 390 px
  - When: Открыть /about
  - Then: scrollWidth равен clientWidth
  - Verification: automated

## `T014` SEO-тексты и alt hero [P] [US7]

gallery/page.tsx title «Купить картины маслом — галерея Анжелы Моисеенко» (и openGraph); reviews/page.tsx description «… художника-импрессиониста Анжелы Моисеенко …» (родительный падеж); HomeClientPage hero alt — осмысленный (название работы или «Картина маслом Анжелы Моисеенко»)

**Context**: Коммерческий запрос в title и грамматика в сниппете (US7)

- **Depends on**: —
- **Requirements**: FR-018
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Правки метаданных** — frontend/app/gallery/page.tsx строки 11–16; frontend/app/reviews/page.tsx строка 16 (ARTIST_NAME в именительном — использовать строку в родительном)
2. **Alt** — frontend/app/HomeClientPage.tsx — hero <Image alt="">
3. **Тесты** — Обновить reviews/page.test.tsx, app/page.test.ts; добавить тест метаданных галереи

**Technical Notes**:

- `frontend/app/reviews/page.tsx`: Комментарий S4-AS10 — уникальные title/description

**Acceptance Criteria**:

- [ ] `AC-1` Тексты совпадают с FR-018, alt непустой

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Метаданные /gallery
  - When: Импорт metadata
  - Then: title = «Купить картины маслом — галерея Анжелы Моисеенко»
  - Verification: automated

## `T015` Применить normalizeTitle во всех местах вывода названий [US8]

Карточка (h1 через quotedTitle, metadata title, JSON-LD name), галерея, RelatedWorks, блог (связанные работы), ArtworkGallery alt

**Context**: Единообразные названия без двойных кавычек (US8)

- **Depends on**: T001, T005, T011
- **Requirements**: FR-019
- **Entities**: artwork
- **Contracts**: —

**Steps**:

1. **Найти места** — grep -rn "artwork.title\|\.title}" frontend/app frontend/components (кроме админки — там исходное значение)
2. **Заменить** — artworkSeo.ts, page.tsx, components/blog/*

**Technical Notes**:

- `frontend/app/gallery/[slug]/artworkSeo.ts`: Title и description метаданных

**Acceptance Criteria**:

- [ ] `AC-1` Работа "Закат" выводится как «Закат» в h1 и Закат в карточках галереи

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Работа с названием "Закат"
  - When: Рендер карточки работы
  - Then: h1 = «Закат»; Нет символа "
  - Verification: automated

## `T016` E2E конверсионного пути и финальные проверки [US2]

e2e/conversion.spec.ts: галерея → «Показать ещё» → карточка → характеристики → WhatsApp href с текстом → «Узнать цену» → форма с телефоном без email; dotnet test, npm test, npx tsc --noEmit, npm run lint, npm run build

**Context**: Сквозная проверка P5 до PR

- **Depends on**: T005, T007, T008, T010, T011, T012, T013, T014, T015
- **Requirements**: FR-005, FR-006, FR-009, FR-012
- **Entities**: artwork, contact-message
- **Contracts**: public-contact-message, public-artwork-dto

**Steps**:

1. **Написать e2e** — Отправку формы перехватывать page.route на /api/public/contact-message, чтобы не слать реальные уведомления
2. **Прогнать всё** — backend: dotnet test; frontend: npm test && npx tsc --noEmit && npm run lint && npm run build && npx playwright test

**Technical Notes**:

- `frontend/e2e/utm-lead.spec.ts`: Образец перехвата формы

**Acceptance Criteria**:

- [ ] `AC-1` Все тесты, линт и сборка зелёные

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: Запущенный стек
  - When: npx playwright test e2e/conversion.spec.ts
  - Then: Сценарий проходит целиком
  - Verification: automated

