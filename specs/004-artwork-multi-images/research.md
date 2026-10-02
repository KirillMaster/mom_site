# Research — 004 Несколько фото картины

## R1. Хранение
- **Decision**: таблица `ArtworkImages` (FK → Artworks, cascade delete), `SortOrder` int; обложка = минимальный SortOrder (нормализуем 0..N-1 после каждой операции). `Artwork.ImagePath/ThumbnailPath` дублируют обложку.
- **Rationale**: все существующие потребители (сетка, sitemap, OG, related works) работают без изменений.
- **Alternatives**: JSON-колонка (нет FK/порядка), удаление старых полей (большой рефакторинг).

## R2. Миграция данных
- **Decision**: EF-миграция `AddArtworkImages`: CreateTable + `INSERT INTO "ArtworkImages" (...) SELECT "Id","ImagePath","ThumbnailPath",0,NOW() FROM "Artworks"`. Применяется существующим `Database.Migrate()` на старте API.

## R3. Обработка файла
- **Decision**: переиспользовать пайплайн `CreateArtwork`: SaveImage → CreateThumbnail(300x300) → AddWatermark; вынести в сервис. Валидация: ContentType `image/*`, ≤ 15 МБ, итог ≤ 10.
- **Partial failure**: все файлы валидируются до загрузки; при ошибке — 400 без изменений.

## R4. Создание работы с несколькими фото
- **Decision**: фронт создаёт работу первым файлом (`POST create`), затем `POST {id}/images` с остальными.

## R5. Legacy `PUT {id}` с Image
- **Decision**: заменяет файл обложки и синхронизирует ArtworkImage[0]. Новая админка не использует.

## R6. Галерея на публичной странице
- **Decision**: один scroll-snap трек со всеми слайдами (каждый `<img>` в SSR-HTML один раз). Мобайл: свайп + точки (scroll → активный индекс). Десктоп (lg+): полоса миниатюр, клик → `scrollTo` трека. Клик по слайду → `yet-another-react-lightbox` (`slides=all`, `index=active`, Zoom; ←/→/Esc встроены).
- **Alternatives**: два DOM для десктопа/мобайла (дубли img), embla/swiper (новая зависимость — отклонено).

## R7. Загрузка изображений
- **Decision**: первый слайд `loading="eager"` + `fetchPriority="high"`, остальные `loading="lazy"`; фиксированный контейнер (max-h 78vh, object-contain) — без CLS.

## R8. Админка
- **Decision**: `ArtworkImagesManager` (миниатюры, HTML5 drag&drop порядка, «Сделать обложкой», «Удалить» с confirm) — операции сразу через API; `MultiImageDropzone` (input multiple + drop, превью `URL.createObjectURL`) — новые файлы отправляются при сохранении.
