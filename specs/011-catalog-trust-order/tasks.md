<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: 011-catalog-trust-order

## `T001` OriginalPath, угловой водяной знак, превью без знака [US7]

ArtworkImage.OriginalPath (nullable) + EF-миграция; ImageService.AddCornerWatermark: правый нижний угол, высота текста ≤3% меньшей стороны (мин. 12 px), alpha ≤ 0.4, отступ ~2%; CreateThumbnailAsync больше не накладывает знак; ArtworkImageService.StoreAsync сохраняет путь оригинала в OriginalPath

**Context**: Крупный знак по центру мешает смотреть картину; оригиналы лежат в S3, но не связаны с записями (US7)

- **Depends on**: —
- **Requirements**: FR-013
- **Entities**: artwork-image
- **Contracts**: —

**Steps**:

1. **Тесты** — MomSite.Tests: WatermarkGeometry (чистая функция размера/позиции знака) — для 3000×2000 высота ≤ 60 px, позиция у правого нижнего угла; для 300×200 высота ≥ 12 px; StoreAsync возвращает/сохраняет OriginalPath (мок IImageService)
2. **Модель и миграция** — Core: ArtworkImage.OriginalPath string?; Infrastructure: dotnet ef migrations add AddArtworkImageOriginalPath (миграции применяются при старте, Program.cs)
3. **ImageService** — Вынести геометрию в WatermarkGeometry; AddCornerWatermark использует её; убрать знак из обеих веток CreateThumbnailAsync (local/S3); AddWatermarkAsync продолжает писать artworks/watermarked_{guid}
4. **StoreAsync** — Вернуть кортеж (watermarked, thumb, original) и записать OriginalPath во всех местах создания ArtworkImage (контроллеры admin artworks); DeleteFiles оригинал НЕ удаляет

**Technical Notes**:

- `backend/MomSite.Infrastructure/Services/ImageService.cs`: AddCornerWatermark сейчас вызывается в 4 местах (161, 232 превью; 288, 340 копия)
- `backend/MomSite.Infrastructure/Services/ArtworkImageService.cs`: Оригинал остаётся в S3 по artworks/{guid}.ext

**Acceptance Criteria**:

- [ ] `AC-1` dotnet test зелёный; новая загрузка даёт знак в углу, превью без знака, OriginalPath заполнен

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Изображение 3000×2000
  - When: Считается геометрия знака
  - Then: Высота текста ≤ 60 px, правый край и низ в пределах 3% от краёв
  - Verification: automated

## `T002` Перерендер знака из оригиналов S3 (admin) [US7]

IS3Service.ListObjectsAsync(prefix); чистая WatermarkPairing.Match(originals, watermarked) — пары по LastModified (оригинал не позже копии, окно 120 с, то же расширение, без повторного использования оригинала); RewatermarkService; POST api/admin/images/rewatermark?dryRun=true&take=25

**Context**: Перерендер существующих 427 работ без потери оригиналов (US7, FR-014)

- **Depends on**: T001
- **Requirements**: FR-014
- **Entities**: artwork-image, rewatermark-report
- **Contracts**: rewatermark-endpoint

**Steps**:

1. **Тесты пар** — WatermarkPairing: точная пара; копия раньше оригинала → нет пары; разница > 120 с → skipped; два оригинала у одной копии → ближайший, второй не используется; разные расширения → нет пары
2. **S3 листинг** — ListObjectsV2 с пагинацией, возвращает (Key, LastModified); local-ветка — по файловой системе
3. **Сервис** — Берёт ArtworkImage с OriginalPath == null (take, по Id); ключ копии из ImagePath; при dryRun только отчёт; иначе: AddWatermarkAsync(original) → новый ImagePath, CreateThumbnailAsync(original) → новый ThumbnailPath, OriginalPath = original; Artwork.ImagePath/ThumbnailPath обновить, если совпадали со старыми; старые копию и превью удалить после SaveChanges; оригинал не трогать; ошибки по одному изображению → failed, не прерывать пачку
4. **Эндпоинт** — [Authorize] admin controller; dryRun по умолчанию true; take 1..100 (по умолчанию 25); ответ — отчёт data-model rewatermark-report, remaining = число без OriginalPath после операции

**Technical Notes**:

- `backend/MomSite.Infrastructure/Services/S3Service.cs`: Листинга сейчас нет — добавить в IS3Service и реализацию

**Acceptance Criteria**:

- [ ] `AC-1` Повторный запуск не трогает уже перерендеренные (идемпотентность по OriginalPath); без авторизации 401

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Оригинал artworks/a.jpg 10:00:00 и копия artworks/watermarked_b.jpg 10:00:03
  - When: WatermarkPairing.Match
  - Then: Пара a↔b
  - Verification: automated
- `TS-2` (integration)
  - Given: Изображение без пары
  - When: POST rewatermark?dryRun=false
  - Then: id в skipped, файлы не изменены
  - Verification: automated

## `T003` GET api/public/how-to-buy [P] [US3]

PublicController: PageContent page how-to-buy / key body, активный → {text, updatedAt}; нет → {text:null, updatedAt:null}; по образцу privacy

**Context**: Текст «Как купить» редактируется в админке страниц (решение пользователя)

- **Depends on**: —
- **Requirements**: FR-006, FR-007
- **Entities**: how-to-buy-content
- **Contracts**: how-to-buy-endpoint

**Steps**:

1. **Тесты** — Заполнено → текст; неактивно/нет → null
2. **Эндпоинт** — HowToBuyDto(string? Text, DateTime? UpdatedAt); admin pages: в app/admin/pages/page.tsx добавить how-to-buy в список страниц, если список захардкожен

**Technical Notes**:

- `backend/MomSite.API/Controllers/PublicController.cs`: Шаблон — endpoint privacy

**Acceptance Criteria**:

- [ ] `AC-1` Эндпоинт без авторизации отдаёт текст или null

**Test Scenarios**:

- `TS-1` (integration)
  - Given: PageContent how-to-buy/body активен
  - When: GET api/public/how-to-buy
  - Then: 200 и text из записи
  - Verification: automated

## `T004` Очистка LLM-описаний [P] [US8]

MomSite.Core/Services/DescriptionCleaner.Clean(string?) — удаляет абзацы, начинающиеся с известных шаблонов генерации («Эта картина», «Картина «…» — это», «В этой работе», «Работа погружает», «Художник мастерски» и т.п.), оставляет фактические строки (техника, размер, год, место); идемпотентный запуск при старте после Migrate()

**Context**: Сгенерированный текст снижает доверие (US8); пример — id 428/429

- **Depends on**: —
- **Requirements**: FR-015
- **Entities**: artwork
- **Contracts**: —

**Steps**:

1. **Тесты** — «Холст на подрамнике , масло, 80х65, Севастополь 2012г.» + LLM-абзацы → только первая строка; чисто LLM-текст → пусто (null); авторский текст без шаблонов не меняется; повторный вызов не меняет результат
2. **Запуск** — Program.cs после Migrate(): пройти Artworks, где Clean(d) != d, сохранить, залогировать количество; новый текст не добавлять

**Technical Notes**:

- `backend/MomSite.Core/Services/DescriptionCleaner.cs`: Чистая функция без зависимостей

**Acceptance Criteria**:

- [ ] `AC-1` Описания id 428/429 на проде очищены после деплоя

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Описание id 428
  - When: DescriptionCleaner.Clean
  - Then: Осталась строка «Холст на подрамнике , масло, 80х65, Севастополь 2012г.»
  - Verification: automated

## `T005` home.availableArtworks и about.exhibitionPhotos [P] [US1]

GET api/public/home: availableArtworks — до 8 опубликованных Available работ категорий главной, новые первыми; GET api/public/about: exhibitionPhotos — опубликованные работы категории «Фото с выставок», до 24

**Context**: Данные для блока «Сейчас в наличии» (US1) и выставок на /about (US5)

- **Depends on**: —
- **Requirements**: FR-002, FR-010
- **Entities**: artwork
- **Contracts**: home-endpoint, about-endpoint

**Steps**:

1. **Тесты** — Sold/неопубликованные не попадают; не больше 8; exhibitionPhotos только из категории «Фото с выставок» (по имени)
2. **DTO** — Добавить поля в существующие DTO home/about; фронтовые типы lib/api.ts дополнить (optional)

**Technical Notes**:

- `backend/MomSite.API/Controllers/PublicController.cs`: Не ломать существующие поля ответа

**Acceptance Criteria**:

- [ ] `AC-1` Ответы содержат новые массивы, старые поля без изменений

**Test Scenarios**:

- `TS-1` (integration)
  - Given: 10 Available и 2 Sold работ категорий главной
  - When: GET api/public/home
  - Then: availableArtworks длиной 8, без Sold
  - Verification: automated

## `T006` Hero, «Сейчас в наличии» на next/image [US1]

HomeClientPage: подзаголовок «Живопись маслом из Крыма. Работы в коллекциях 12 стран», кнопки «Выбрать картину» (/gallery?available=1, primary sea) и «Заказать картину» (/order, secondary); components/home/AvailableGrid.tsx — сетка MuseumLabel + next/image с sizes; ArtworkCarousel перевести на next/image

**Context**: Главная должна сразу вести к покупке (US1); изображения не должны грузиться оригиналами S3 (FR-003)

- **Depends on**: T005
- **Requirements**: FR-001, FR-002, FR-003
- **Entities**: artwork
- **Contracts**: home-endpoint

**Steps**:

1. **Тесты** — jest: hero содержит подзаголовок и две ссылки; AvailableGrid рендерит N карточек со ссылкой /gallery/{slug}, скрыт при пустом массиве; img через next/image (srcset/_next/image)
2. **Компоненты** — next.config images.remotePatterns уже должен включать S3-хост — проверить; ArtworkCarousel: next/image fill + sizes, тест ArtworkCarousel.seaside ждёт 4 focusables — сохранить

**Technical Notes**:

- `frontend/app/HomeClientPage.tsx`: Токены 009, кольцо фокуса sea

**Acceptance Criteria**:

- [ ] `AC-1` На главной нет <img src> с прямым S3 URL

**Test Scenarios**:

- `TS-1` (unit)
  - Given: home.availableArtworks из 6 работ
  - When: Рендер главной
  - Then: 6 карточек «Сейчас в наличии» со ссылками на страницы работ
  - Verification: automated

## `T007` TrustStrip и ReviewsPreview [P] [US2]

components/home/TrustStrip.tsx (Член Союза художников России; Работы в музейных собраниях; Коллекционеры в 12 странах) и components/home/ReviewsPreview.tsx (2–3 опубликованных отзыва, ссылка «Все отзывы» → /reviews, prioritizeArtworkId ставит отзывы о работе первыми, скрыт без отзывов); подключить на главной

**Context**: Доверие к художнику (US2)

- **Depends on**: —
- **Requirements**: FR-004, FR-005
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Тесты** — TrustStrip — три факта; ReviewsPreview — максимум 3, отзыв о работе первым, null при пустом списке
2. **Данные** — Отзывы — существующий публичный эндпоинт reviews (lib/api)

**Technical Notes**:

- `frontend/components/home`: Компоненты переиспользуются на странице работы (T010)

**Acceptance Criteria**:

- [ ] `AC-1` Блоки на главной, jest зелёный

**Test Scenarios**:

- `TS-1` (unit)
  - Given: 5 отзывов, один про работу 7
  - When: ReviewsPreview с prioritizeArtworkId=7
  - Then: 3 отзыва, первый — про работу 7
  - Verification: automated

## `T008` Страница /order и цель custom_order_submit [P] [US6]

app/order/page.tsx (metadata, описание процесса: сюжет → эскиз → предоплата → работа → доставка) + OrderForm.tsx (имя, контакт, сюжет, размер, комментарий; ?artwork= префилл комментария «Хочу похожую на «…»»); POST contact-message с subject «Картина на заказ»; analytics custom_order_submit; sitemap + ссылка в Footer

**Context**: Заказ картины по своему сюжету (US6)

- **Depends on**: —
- **Requirements**: FR-011, FR-012
- **Entities**: —
- **Contracts**: order-form

**Steps**:

1. **Тесты** — Отправка вызывает API с subject «Картина на заказ» и цель custom_order_submit; пустые обязательные поля блокируют отправку; ?artwork=Х префиллит комментарий; sitemap содержит /order
2. **Форма** — Контакт → email если содержит @, телефон если цифры, иначе telegramUsername; сообщение = сюжет + размер + комментарий; Input/Textarea из components/ui

**Technical Notes**:

- `frontend/lib/analytics.ts`: Добавить цель в список целей

**Acceptance Criteria**:

- [ ] `AC-1` /order открывается, форма отправляется, в Footer есть ссылка

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Заполненная форма /order
  - When: Нажата «Отправить»
  - Then: POST contact-message с subject «Картина на заказ», цель custom_order_submit
  - Verification: automated

## `T009` Блок «Как купить» и схема масштаба [US3]

app/gallery/[slug]/HowToBuy.tsx — текст из api/public/how-to-buy (абзацы по пустой строке), при null — дефолт (доставка СДЭК/лично по Крыму, оплата переводом, сертификат подлинности, возврат 14 дней); ScaleDiagram.tsx — SVG диван ~200 см и прямоугольник работы пропорционально WidthCm×HeightCm, подпись размера; скрыт без размеров

**Context**: Покупателю понятно, как купить, и виден реальный размер (US3, US4)

- **Depends on**: T003
- **Requirements**: FR-006, FR-008
- **Entities**: how-to-buy-content, artwork
- **Contracts**: how-to-buy-endpoint

**Steps**:

1. **Тесты** — HowToBuy — текст API / дефолт; ScaleDiagram — 80×60 на диване 200 даёт ширину прямоугольника 40% ширины дивана; null без размеров
2. **Подключение** — page.tsx [slug]: серверный fetch how-to-buy (revalidate), блоки под ArtworkInfoCard

**Technical Notes**:

- `frontend/app/gallery/[slug]/page.tsx`: Не ломать MuseumLabel h1 (prod e2e ждёт h1[data-label-line])

**Acceptance Criteria**:

- [ ] `AC-1` На странице работы видны «Как купить» и схема масштаба

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Работа 80×60 см
  - When: Рендер ScaleDiagram
  - Then: Прямоугольник работы шириной 40% дивана
  - Verification: automated

## `T010` Доверие на странице работы и «Хочу похожую» [US2]

На странице работы TrustStrip и ReviewsPreview(prioritizeArtworkId); в AskPriceButton/ContactChannels ссылка «Хочу похожую» → /order?artwork=<название>

**Context**: Доверие и альтернатива для проданных работ (US2, US6)

- **Depends on**: T007, T008, T009
- **Requirements**: FR-004, FR-005, FR-012
- **Entities**: —
- **Contracts**: order-form

**Steps**:

1. **Тесты** — Страница работы рендерит TrustStrip; ссылка «Хочу похожую» ведёт на /order?artwork=…(encodeURIComponent)

**Technical Notes**:

- `frontend/app/gallery/[slug]/AskPriceButton.tsx`: Сохранить существующую цель ask_price

**Acceptance Criteria**:

- [ ] `AC-1` Ссылка «Хочу похожую» и блоки доверия на странице работы

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Работа «Цветы лета»
  - When: Клик «Хочу похожую»
  - Then: Переход на /order?artwork=Цветы%20лета, комментарий префиллен
  - Verification: automated

## `T011` Фильтры каталога в URL и раздел Сухоруких [P] [US5]

lib/gallery.ts: sizeClass(w,h) S ≤40 / M ≤80 / L >80 по большей стороне, null без размеров; filterArtworks({category, size, available}); GalleryFilters — тема, размер, «только в наличии», «Сбросить»; состояние в query (?category=&size=&available=1) через router.replace; Сухоруких (категория «Пейзажи Всеволода Сухоруких», по имени) исключены из вида по умолчанию и доступны отдельной вкладкой с подписью авторства; Фото с выставок исключены

**Context**: Покупатель ищет по теме, размеру и наличию (US5)

- **Depends on**: —
- **Requirements**: FR-009, FR-010
- **Entities**: artwork
- **Contracts**: —

**Steps**:

1. **Тесты** — sizeClass(40,30)=S, (80,50)=M, (81,10)=L, (null,10)=null; комбинация фильтров; query ↔ состояние (чтение при загрузке, запись при изменении); пустой результат показывает «Ничего не найдено» и «Сбросить»
2. **UI** — Кнопки-фильтры с aria-pressed, кольцо фокуса sea; useSearchParams в Suspense

**Technical Notes**:

- `frontend/lib/gallery.ts`: Совпадение категорий по имени, как EXHIBITION_PHOTOS_CATEGORY_NAME

**Acceptance Criteria**:

- [ ] `AC-1` /gallery?size=M&available=1 после перезагрузки показывает тот же отбор

**Test Scenarios**:

- `TS-1` (unit)
  - Given: URL /gallery?size=S
  - When: Загрузка галереи
  - Then: Показаны только работы с большей стороной ≤ 40 см
  - Verification: automated

## `T012` Выставки на /about [P] [US5]

AboutClientPage: раздел «Выставки» — сетка exhibitionPhotos (next/image, sizes), скрыт при пустом массиве

**Context**: Фото с выставок подтверждают опыт, но не засоряют каталог (US5, FR-010)

- **Depends on**: T005
- **Requirements**: FR-010
- **Entities**: artwork
- **Contracts**: about-endpoint

**Steps**:

1. **Тесты** — Раздел рендерит N изображений; скрыт без данных

**Technical Notes**:

- `frontend/app/about/AboutClientPage.tsx`: prose-measure биографии не трогать (e2e US2-E2E2)

**Acceptance Criteria**:

- [ ] `AC-1` На /about виден раздел «Выставки»

**Test Scenarios**:

- `TS-1` (unit)
  - Given: about.exhibitionPhotos из 5 фото
  - When: Рендер /about
  - Then: Раздел «Выставки» с 5 изображениями
  - Verification: automated

## `T013` e2e каталога на проде [US1]

frontend/e2e/catalog-trust.spec.ts: главная (подзаголовок, «Сейчас в наличии», TrustStrip), /gallery?size=M фильтр, страница работы («Как купить», схема масштаба), /order открывается (без отправки на проде), /about «Выставки»; no-overflow 390 для /order

**Context**: Проверка после деплоя (цель — работает на проде)

- **Depends on**: T006, T010, T011, T012
- **Requirements**: FR-001, FR-006, FR-009, FR-011
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Спека** — waitUntil domcontentloaded; без записи данных на прод; /order добавить в OVERFLOW_PAGES design-system.spec.ts

**Technical Notes**:

- `frontend/e2e/design-system.spec.ts`: Ошибки «Failed to fetch RSC payload» отфильтрованы

**Acceptance Criteria**:

- [ ] `AC-1` e2e зелёные против https://angelamoiseenko.ru

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: Задеплоенная версия
  - When: Прогон e2e на проде
  - Then: Все проверки зелёные
  - Verification: automated

