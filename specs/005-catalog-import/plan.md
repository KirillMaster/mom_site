<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: 005-catalog-import

**Branch**: `feature/005-growth-foundation`

## Summary

Расширяем существующую Artwork полями карточки (статус, размеры, год, основа, техника, короткое описание, IsFeatured, NeedsReshoot, IsPublished) одной миграцией; IsForSale становится вычисляемым из Status. Импорт xlsx — новый модуль Infrastructure/Catalog (ClosedXML): маппинг заголовков и парсеры значений — чистые функции, затем валидатор строк, планировщик изменений (diff) и применитель в одной транзакции с журналом CatalogImportLog для отката. Админ-эндпоинты POST /api/admin/catalog/import?dryRun, POST /api/admin/catalog/import/rollback и страница /admin/catalog. Публичная карточка /gallery/[slug] и галерея выводят новые поля, StructuredData дополняется VisualArtwork/Offer; скрытые работы исключаются из публичного API и sitemap. Реализация — после merge 004.

## Technical Context

- **Language/Version**: C# 12 / .NET 8 (backend); TypeScript 5 strict / Next.js 14 App Router (frontend)
- **Primary Dependencies**: ClosedXML (MIT) — чтение xlsx (новая зависимость Infrastructure), EF Core 8 + Npgsql (миграция Artwork, таблица CatalogImportLog), Next.js 14 (SSR карточки, sitemap.ts), react-query (useApi) в админке, openpyxl (только генератор шаблона scripts/catalog, вне рантайма)
- **Storage**: PostgreSQL — новые колонки Artwork, таблица CatalogImportLog (jsonb снимок старых значений); файл импорта не хранится
- **Testing**: xUnit (unit — HeaderMap/ValueParsers/RowValidator/ChangePlanner; integration — фикстуры xlsx реальной выгрузки и Google Sheets, apply/idempotency/rollback); Jest (карточка, форма, страница импорта); Playwright (скрытая работа → 404, карточка с полями)
- **Target Platform**: Linux Docker (mom_site_api_prod), браузеры mobile-first
- **Project Type**: web_application
- **Performance Goals**: Предпросмотр файла на 2000 строк ≤ 5 с; применение ≤ 10 с; карточка без деградации LCP (поля — текст SSR)
- **Constraints**: Лимит файла 5 МБ / 2000 строк (до чтения, через Kestrel/контроллер RequestSizeLimit); только [Authorize]; ни одно исключение парсинга не превращается в 500; один импорт одновременно (advisory lock/семафор); совместимость IsForSale для старых клиентов; файлы ≤ 200 строк (P3)
- **Scale/Scope**: ~150–300 работ, 1–2 админа, импорт раз в несколько недель

## Constitution Check

| Principle | Status | Justification |
|---|---|---|
| `P1` | pass | — |
| `P2` | pass | — |
| `P3` | pass | — |
| `P4` | not_applicable | — |
| `P5` | pass | — |
| `P6` | pass | — |
| `P7` | pass | — |
| `P8` | pass | — |
| `P9` | pass | — |
| `P10` | pass | — |

## Project Structure

**Layout**: web_application

Модель и миграция — в существующих Core/Models и Infrastructure/Data. Импорт — изолированный модуль Infrastructure/Catalog за интерфейсом ICatalogImportService (Core/Interfaces); контроллер CatalogImportController в API. Фронт — новая страница app/admin/catalog, правки существующих карточки, галереи, формы работы в админке, StructuredData и sitemap. Изменения формы и ArtworksController делаются после merge 004, чтобы не конфликтовать с параллельной веткой.

**Directories**:

- `backend/MomSite.Core/Models/Artwork.cs`
- `backend/MomSite.Core/Models/ArtworkStatus.cs`
- `backend/MomSite.Core/Models/CatalogImportLog.cs`
- `backend/MomSite.Core/Interfaces/ICatalogImportService.cs`
- `backend/MomSite.Infrastructure/Catalog/`
- `backend/MomSite.Infrastructure/Data/Migrations/`
- `backend/MomSite.API/Controllers/CatalogImportController.cs`
- `backend/MomSite.API/Controllers/ArtworksController.cs`
- `backend/MomSite.API/Controllers/PublicController.cs`
- `backend/MomSite.Tests/Catalog/`
- `backend/MomSite.Tests/Fixtures/catalog/`
- `frontend/app/admin/catalog/`
- `frontend/app/admin/artworks/`
- `frontend/app/gallery/`
- `frontend/components/StructuredData.tsx`
- `frontend/app/sitemap.ts`
- `frontend/types/`
- `frontend/lib/`
- `scripts/catalog/`
