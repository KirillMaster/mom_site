<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: Несколько фотографий одной картины

## `T001` Модель ArtworkImage и EF-миграция с переносом данных [US1]

Добавить сущность ArtworkImage, навигацию Artwork.Images, DbSet, конфигурацию FK cascade и миграцию AddArtworkImages с INSERT ... SELECT существующих фото как обложек.

**Context**: Нужна база для хранения нескольких фото; старые работы не должны потерять фото.

- **Depends on**: —
- **Requirements**: FR-001, FR-003, FR-015
- **Entities**: E-1, E-2
- **Contracts**: —

**Steps**:

1. **Создать модель ArtworkImage** — backend/MomSite.Core/Models/ArtworkImage.cs: Id, ArtworkId, Artwork?, ImagePath [MaxLength 500], ThumbnailPath [MaxLength 500], SortOrder, CreatedAt
2. **Добавить навигацию и DbSet** — Artwork.Images = List<ArtworkImage>; ApplicationDbContext.ArtworkImages; OnModelCreating: HasMany(Images).WithOne(Artwork).OnDelete(Cascade), индекс (ArtworkId, SortOrder)
3. **Сгенерировать миграцию** — dotnet ef migrations add AddArtworkImages -p backend/MomSite.Infrastructure -s backend/MomSite.API; в Up после CreateTable migrationBuilder.Sql INSERT INTO "ArtworkImages" ("ArtworkId","ImagePath","ThumbnailPath","SortOrder","CreatedAt") SELECT "Id","ImagePath","ThumbnailPath",0,NOW() FROM "Artworks"

**Technical Notes**:

- `backend/MomSite.Infrastructure/Data/ApplicationDbContext.cs`: DbSet-ы и OnModelCreating
- `backend/MomSite.Infrastructure/Data/Migrations`: последняя миграция 20260919052526_AddReviewsTable

**Acceptance Criteria**:

- [ ] `AC-1` Миграция применяется; каждая работа имеет одно ArtworkImage с SortOrder 0 и путями, равными Artwork.ImagePath/ThumbnailPath
- [ ] `AC-2` Удаление Artwork каскадно удаляет ArtworkImage

**Test Scenarios**:

- `TS-1` (integration)
  - Given: работа в БД
  - When: удаляется работа
  - Then: её ArtworkImage удалены
  - Verification: automated

## `T002` Сервис ArtworkImageService (порядок, обложка, синхронизация, валидация) [US1]

Сервис в Infrastructure с интерфейсом в Core: AddImagesAsync, DeleteImageAsync, ReorderAsync; нормализация SortOrder 0..N-1 и синхронизация Artwork.ImagePath/ThumbnailPath с обложкой.

**Context**: Логика порядка и обложки нужна в нескольких endpoint-ах — держим её в одном месте и тестируем unit-тестами.

- **Depends on**: T001
- **Requirements**: FR-001, FR-002, FR-004, FR-005, FR-006, FR-007
- **Entities**: E-1, E-2
- **Contracts**: C-1, C-2, C-3

**Steps**:

1. **Объявить интерфейс** — backend/MomSite.Core/Interfaces/IArtworkImageService.cs; результат — OperationResult (Ok/NotFound/BadRequest(message)) + список фото
2. **Реализовать валидацию** — лимит 10 итого, ≤ 15 МБ (15*1024*1024), ContentType начинается с image/; сообщения на русском; проверка всех файлов до загрузки
3. **Реализовать обработку файла** — SaveImageAsync(file,"artworks") → CreateThumbnailAsync(path,300,300) → AddWatermarkAsync(path, GetWatermarkText()) — как в ArtworksController.Create; вынести общий helper и использовать его в Create
4. **Реализовать Delete/Reorder** — Delete: отказ на последнем фото, удаление файлов через IImageService.DeleteImage; Reorder: набор id должен совпадать с фото работы без дублей; затем Normalize + SyncCover
5. **Зарегистрировать в DI и написать unit-тесты** — Program.cs AddScoped; backend/MomSite.Tests/ArtworkImageServiceTests.cs с InMemory/SQLite и мок IImageService

**Technical Notes**:

- `backend/MomSite.Infrastructure/Services/ImageService.cs`: IImageService: SaveImageAsync, CreateThumbnailAsync, AddWatermarkAsync, DeleteImage, GetWatermarkText

**Acceptance Criteria**:

- [ ] `AC-1` После любой операции SortOrder = 0..N-1 и Artwork.ImagePath/ThumbnailPath = обложка
- [ ] `AC-2` Отклоняются: >10 фото, файл >15 МБ, не image/*, удаление последнего фото, чужие id в порядке

**Test Scenarios**:

- `TS-1` (unit)
  - Given: работа с 3 фото
  - When: Reorder [3,1,2]
  - Then: обложка = фото 3; Artwork.ImagePath = путь фото 3
  - Verification: automated
- `TS-2` (unit)
  - Given: работа с 9 фото
  - When: добавляют 2 файла
  - Then: BadRequest, фото не изменены
  - Verification: automated

## `T003` Admin endpoints фото работы [US1]

POST /api/admin/artworks/{id}/images, DELETE /api/admin/artworks/{id}/images/{imageId}, PUT /api/admin/artworks/{id}/images/order; Create создаёт обложку ArtworkImage; Update с Image синхронизирует обложку; Delete удаляет файлы всех фото.

**Context**: Админке нужны операции над фото через API.

- **Depends on**: T002
- **Requirements**: FR-004, FR-005, FR-006, FR-007, FR-008, FR-015
- **Entities**: E-1, E-2
- **Contracts**: C-1, C-2, C-3, C-5

**Steps**:

1. **Добавить DTO** — backend/MomSite.API/DTOs/ArtworkImageDto.cs {Id, ImagePath, ThumbnailPath, SortOrder}; ReorderImagesDto {List<int> ImageIds}
2. **Добавить actions** — ArtworksController (или новый ArtworkImagesController с [Route("api/admin/artworks/{id:int}/images")], [Authorize]); RequestFormLimits/RequestSizeLimit 160MB для POST
3. **Обновить Create/Update/Delete** — Create — добавить ArtworkImage SortOrder 0; Update с Image — заменить обложку; Delete — DeleteImage для всех фото
4. **Integration-тесты** — backend/MomSite.Tests/ArtworkImagesEndpointsTests.cs: 200/400/401/404 для C-1..C-3, C-5

**Technical Notes**:

- `backend/MomSite.API/Controllers/ArtworksController.cs`: [Route("api/admin/[controller]")], [Authorize], Create/Update/Delete
- `backend/MomSite.Tests/AdminTestHelpers.cs`: helpers авторизации для тестов

**Acceptance Criteria**:

- [ ] `AC-1` Все response_cases C-1..C-3 и C-5 покрыты интеграционными тестами и проходят

**Test Scenarios**:

- `TS-1` (integration)
  - Given: нет JWT
  - When: POST /images
  - Then: 401
  - Verification: automated
- `TS-2` (integration)
  - Given: работа с 1 фото
  - When: DELETE последнего фото
  - Then: 400 с сообщением
  - Verification: automated

## `T004` Публичный и админский DTO: images[] [P] [US2]

ArtworkDto/ArtworkAdminDto получают Images; запросы gallery/home/admin list делают Include(Images); fallback при пустой коллекции.

**Context**: Фронту нужны все фото работы в публичных данных.

- **Depends on**: T001
- **Requirements**: FR-009
- **Entities**: E-1, E-2
- **Contracts**: C-4

**Steps**:

1. **Расширить DTO и маппинг** — DTOs/ArtworkDto.cs, ArtworkAdminDto.cs: List<ArtworkImageDto> Images; MappingExtensions.ToDto: OrderBy(SortOrder); если пусто — [new(0, ImagePath, ThumbnailPath, 0)]
2. **Добавить Include** — PublicController gallery/home и ArtworksController GET — .Include(a => a.Images)
3. **Тесты** — PublicControllerTests: gallery возвращает images по порядку; fallback

**Technical Notes**:

- `backend/MomSite.API/DTOs/MappingExtensions.cs`: ToDto для Artwork
- `backend/MomSite.API/Controllers/PublicController.cs`: GET gallery, home

**Acceptance Criteria**:

- [ ] `AC-1` GET /api/public/gallery отдаёт images[] у каждой работы по SortOrder

**Test Scenarios**:

- `TS-1` (integration)
  - Given: работа с 2 фото в обратном порядке вставки
  - When: GET /api/public/gallery
  - Then: images отсортированы по sortOrder
  - Verification: automated

## `T005` Фронт: типы и API-клиент фото [US1]

Тип ArtworkImage, поле images у Artwork; функции uploadArtworkImages, deleteArtworkImage, reorderArtworkImages.

**Context**: Общая основа для админки и публичных страниц.

- **Depends on**: T003, T004
- **Requirements**: FR-004, FR-006, FR-007, FR-009
- **Entities**: E-2
- **Contracts**: C-1, C-2, C-3, C-4

**Steps**:

1. **Добавить типы** — frontend/types (или lib/api.ts): interface ArtworkImage {id:number; imagePath:string; thumbnailPath:string; sortOrder:number}; Artwork.images: ArtworkImage[]
2. **Добавить API-функции** — frontend/lib/artworkImagesApi.ts через существующий axios-инстанс; FormData с ключом Images

**Technical Notes**:

- `frontend/lib/api.ts`: axios-инстанс и типы

**Acceptance Criteria**:

- [ ] `AC-1` tsc strict без ошибок; функции покрыты Jest-тестами с моком axios

**Test Scenarios**:

- `TS-1` (unit)
  - Given: мок axios
  - When: uploadArtworkImages(5,[f1,f2])
  - Then: POST /admin/artworks/5/images с двумя Images
  - Verification: automated

## `T006` Админка: мультизагрузка и управление фото [US1]

MultiImageDropzone (multiple + drag&drop, превью, удаление из очереди) и ArtworkImagesManager (миниатюры, drag&drop порядка, «Сделать обложкой», «Удалить» с confirm) в форме работы.

**Context**: Хозяйка сайта должна сама загружать и упорядочивать фото.

- **Depends on**: T005
- **Requirements**: FR-004, FR-005, FR-006, FR-007
- **Entities**: E-2
- **Contracts**: C-1, C-2, C-3

**Steps**:

1. **Создать MultiImageDropzone** — frontend/components/admin/MultiImageDropzone.tsx: input type=file multiple accept=image/*, onDrop, превью URL.createObjectURL с revoke, клиентская проверка 15 МБ и остатка до 10
2. **Создать ArtworkImagesManager** — frontend/components/admin/ArtworkImagesManager.tsx: HTML5 draggable, onDrop → reorderArtworkImages; кнопки «Сделать обложкой», «Удалить» (window.confirm); бейдж «Обложка» на первом
3. **Встроить в страницу** — frontend/app/admin/artworks/page.tsx: создание — POST create с первым файлом, затем uploadArtworkImages с остальными; редактирование — менеджер + дозагрузка; вынести форму в отдельный компонент, чтобы файл ≤ 200 строк
4. **Jest-тесты** — frontend/__tests__/MultiImageDropzone.test.tsx, ArtworkImagesManager.test.tsx

**Technical Notes**:

- `frontend/app/admin/artworks/page.tsx`: 372 строки — вынести форму

**Acceptance Criteria**:

- [ ] `AC-1` Можно создать работу с 3 фото, удалить фото, сменить порядок и обложку; ошибки на русском

**Test Scenarios**:

- `TS-1` (unit)
  - Given: менеджер с 3 фото
  - When: клик «Сделать обложкой» на 3-м
  - Then: вызван reorder с [id3,id1,id2]
  - Verification: automated

## `T007` Публичная галерея на странице работы [P] [US2]

ArtworkGallery: scroll-snap трек со всеми фото, точки на мобайле, полоса миниатюр на lg+, лайтбокс со всеми слайдами с текущего индекса.

**Context**: Покупатель должен видеть картину с разных ракурсов, как на theograce.com.

- **Depends on**: T005
- **Requirements**: FR-010, FR-011
- **Entities**: E-2
- **Contracts**: C-4

**Steps**:

1. **Переписать ArtworkViewer в ArtworkGallery** — frontend/app/gallery/[slug]/ArtworkGallery.tsx (client): props images, title; трек flex overflow-x-auto snap-x snap-mandatory; onScroll → активный индекс
2. **Навигация** — Thumbnails (hidden lg:flex) с aria-current; Dots (lg:hidden); при одном фото — ни того ни другого
3. **Лайтбокс** — yet-another-react-lightbox: slides = все фото, index = активный, Zoom; prev/next не скрывать при >1; reachGoal(Goals.ArtworkView) сохранить
4. **Подключить на странице и Jest-тесты** — page.tsx передаёт artwork.images; frontend/__tests__/ArtworkGallery.test.tsx

**Technical Notes**:

- `frontend/app/gallery/[slug]/ArtworkViewer.tsx`: текущий лайтбокс с одним слайдом

**Acceptance Criteria**:

- [ ] `AC-1` Клик по миниатюре переключает фото; лайтбокс открывается на текущем и листает все; одно фото — без навигации

**Test Scenarios**:

- `TS-1` (unit)
  - Given: 3 фото
  - When: клик по 2-й миниатюре и затем по основному
  - Then: лайтбокс открыт с index 1
  - Verification: automated

## `T008` SEO: alt, приоритет загрузки, JSON-LD image[] [US3]

Все фото в SSR-HTML с alt «Название — фото N», первое eager+fetchPriority high, остальные lazy; JSON-LD image — массив, OG — обложка.

**Context**: Поисковики должны видеть все изображения работы.

- **Depends on**: T007
- **Requirements**: FR-002, FR-012, FR-013
- **Entities**: E-2
- **Contracts**: C-4

**Steps**:

1. **alt и loading** — в ArtworkGallery: alt = images.length>1 ? `${title} — фото ${i+1}` : title; i===0 → loading=eager fetchPriority=high
2. **JSON-LD** — frontend/app/gallery/[slug]/page.tsx: image: images.map(getImageUrl)
3. **Тест** — Jest-рендер: alt и loading атрибуты; e2e проверка HTML

**Technical Notes**:

- `frontend/app/gallery/[slug]/page.tsx`: VisualArtwork JSON-LD

**Acceptance Criteria**:

- [ ] `AC-1` curl страницы содержит все img с alt и JSON-LD image-массив

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: работа с 3 фото
  - When: SSR страницы
  - Then: 3 img, первый eager, 2 lazy; JSON-LD image длины 3
  - Verification: automated

## `T009` Бейдж «📷 N» в сетке галереи [P] [US4]

Карточка работы в /gallery показывает бейдж с количеством фото при images.length > 1.

**Context**: Посетитель сразу видит, что у работы есть дополнительные фото.

- **Depends on**: T005
- **Requirements**: FR-014
- **Entities**: E-2
- **Contracts**: C-4

**Steps**:

1. **Добавить бейдж** — frontend/app/gallery/GalleryClientPage.tsx (или компонент карточки): absolute top-2 right-2 bg-black/60 text-white text-xs rounded px-2, aria-label «N фото»
2. **Jest-тест** — бейдж есть при 3 фото, нет при 1

**Technical Notes**:

- `frontend/app/gallery/GalleryClientPage.tsx`: сетка работ

**Acceptance Criteria**:

- [ ] `AC-1` Бейдж только у работ с >1 фото

**Test Scenarios**:

- `TS-1` (unit)
  - Given: работа с 3 фото
  - When: рендер сетки
  - Then: бейдж «📷 3»
  - Verification: automated

## `T010` E2E Playwright: админ-фото и публичная галерея [US2]

e2e/artwork-images.spec.ts: создание работы с 2+ фото, смена обложки, удаление; публичная страница — миниатюры, лайтбокс ←/→, мобильный viewport с точками.

**Context**: Критичные пользовательские сценарии проверяются автоматически.

- **Depends on**: T006, T008, T009
- **Requirements**: FR-004, FR-007, FR-010, FR-011, FR-014
- **Entities**: E-2
- **Contracts**: C-1, C-3, C-4

**Steps**:

1. **Написать spec** — frontend/e2e/artwork-images.spec.ts по образцу admin.spec.ts; фикстуры-картинки в e2e/fixtures
2. **Прогнать** — npx playwright test e2e/artwork-images.spec.ts

**Technical Notes**:

- `frontend/e2e/admin.spec.ts`: логин и паттерны админки

**Acceptance Criteria**:

- [ ] `AC-1` E2E проходит локально и в CI

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: работа с 3 фото
  - When: открыть лайтбокс и нажать →
  - Then: показано 2-е фото
  - Verification: automated

