# Research: 005-catalog-import

Вход — `design-notes.md` (контракт файла v1) и `spec.yaml`. NEEDS CLARIFICATION в `plan.yaml` нет.

## R1. Парсер xlsx
- **Decision**: ClosedXML 0.104.2 (MIT) в `MomSite.Infrastructure/Catalog/`. Читаем `XLWorkbook` из `Stream` (файл не сохраняется), лист по имени, ячейки — `CachedValue` (формулы не вычисляем, `=IMAGE()` игнор).
- **Rationale**: MIT, стабильный API, работает и с выгрузкой Excel, и с экспортом Google Sheets.
- **Alternatives**: EPPlus — коммерческая лицензия с v5; OpenXML SDK напрямую — много низкоуровневого кода (P3/P10).

## R2. Разбиение модуля (P3, P5)
- **Decision**: `HeaderMap` (нормализация заголовков, поиск колонок) и `ValueParsers` (цена, размеры, год, статус, флаги, `-` = очистить) — чистые статические функции; `RowValidator` → `RowResult{changes, issues}`; `ChangePlanner` сравнивает с текущими Artwork (diff только изменённых полей); `ImportApplier` применяет план в транзакции; `CatalogImportService` (реализация `ICatalogImportService`) склеивает. Каждый файл ≤ 200 строк.
- **Rationale**: dry-run и apply строят один и тот же план → предпросмотр гарантированно совпадает с результатом (US1/US2).

## R3. Расширение Artwork вместо новой сущности
- **Decision**: миграции `AddArtworkCatalogExtras` (поля Artwork) и `AddCatalogImportLog` (журнал импорта; созданы через `dotnet ef migrations add`): `Status` (int enum, default Available), `WidthCm`/`HeightCm` (numeric(6,1) null), `Year` (int null), `Support`/`Technique` (varchar 100 null), `ShortDescription` (varchar 300 null), `IsFeatured`, `NeedsReshoot` (bool false), `IsPublished` (bool true). Data-migration: `Status = IsForSale ? Available : NotForSale`.
- **IsForSale**: остаётся колонкой ради совместимости API и старых клиентов, но всегда выставляется из `Status` при сохранении (`Artwork.ApplyStatus`); прямая запись `IsForSale` игнорируется.
- **Rationale**: правило «не дублировать» — карточка, галерея, админка уже работают с Artwork.
- **Alternatives**: отдельная таблица `ArtworkDetails` — лишний join и дубль CRUD.

## R4. Атомарность, конкурентность, откат
- **Decision**: apply в одной транзакции; перед изменениями — запись `CatalogImportLog` со снимком старых значений только изменяемых полей. Один импорт одновременно: `SemaphoreSlim(1)` в singleton (один экземпляр api) → второй запрос 409.
- **Rollback**: только последний неоткаченный лог; восстанавливает поля из Snapshot, созданные черновики удаляет, если к ним не добавили фото (иначе — скрывает и пишет warning). Если работу правили в админке после импорта (`UpdatedAt > log.CreatedAt`) — поле всё равно восстанавливается, в ответе список таких работ.
- **Idempotency**: план строится diff'ом — повторный файл даёт 0 изменений, лог не пишется.

## R5. Лимиты и ошибки
- **Decision**: `[RequestSizeLimit(5 МБ)]` + проверка расширения и ZIP-сигнатуры; > 2000 непустых строк → 400 до валидации. Любое исключение ClosedXML → 400 `file_unreadable`, не 500. Версия шаблона: `Как заполнять!A20 ≠ "format: v1"` → warning в summary.

## R6. Новые работы
- **Decision**: пустой ID → `IsPublished=false`, категория — первая по `DisplayOrder`, без фото (пустой ImagePath допустим только у неопубликованных). Дубль по точному названию (без регистра) → warning.

## R7. Публичная видимость
- **Decision**: все публичные выборки Artwork (галерея, главная, карточка, sitemap, deep-link 007) фильтруют `IsPublished && Status != NotMine` через общий extension `IQueryable<Artwork>.Visible()` — условие не дублируется. Скрытая работа по прямому URL → 404 (`notFound()` в `gallery/[slug]`).

## R8. Карточка и SEO
- **Decision**: `gallery/[slug]` выводит `Ш × В см`, технику, основу, год, статус; цена — только при `Available`, иначе бейдж статуса. `ShortDescription` → meta description и подзаголовок; если пуст — первые 160 символов `Description`. `StructuredData`: `VisualArtwork{artMedium, artworkSurface, width, height, dateCreated}` + `offers{Offer, price, priceCurrency RUB, availability InStock|SoldOut}` только при наличии цены и статусе Available/Sold.

## R9. Админка
- **Decision**: новая страница `/admin/catalog` (загрузка → таблица diff с фильтром «только с ошибками» → «Применить» → «Откатить последний»), плитка на дашборде. Поля в существующей форме работы (`admin/artworks`) и DTO `ArtworksController` — после merge 004, чтобы не конфликтовать с параллельной веткой.
