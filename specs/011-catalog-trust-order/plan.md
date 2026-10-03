<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: 011-catalog-trust-order

**Branch**: `feature/011-catalog-trust-order`

## Summary

Backend: ArtworkImage.OriginalPath (миграция); новый угловой водяной знак (правый нижний угол, 3% меньшей стороны, alpha ≤ 40%), превью без знака; IS3Service.ListObjectsAsync и чистая функция сопоставления оригинал↔копия по времени загрузки; admin POST api/admin/images/rewatermark (dryRun по умолчанию, take/skip, отчёт matched/skipped/failed, идемпотентно по OriginalPath); GET api/public/how-to-buy (как privacy); home отдаёт availableArtworks (до 8 Available); about отдаёт exhibitionPhotos; DescriptionCleaner + стартовая идемпотентная очистка описаний. Frontend: hero с подзаголовком и двумя кнопками, сетка «Сейчас в наличии» на next/image с sizes вместо карусели оригиналов; TrustStrip и ReviewsPreview на главной и странице работы; HowToBuy с текстом по умолчанию; ScaleDiagram (SVG диван 200 см); фильтры галереи тема/размер/наличие в URL, раздел Сухоруких, фото выставок на /about; страница /order с формой → contact-message, цель custom_order_submit, sitemap, футер, «Хочу похожую» → /order.

## Technical Context

- **Language/Version**: C# 12 / .NET 8 (backend); TypeScript 5 strict / Next.js 14 App Router (frontend)
- **Primary Dependencies**: ASP.NET Core 8, EF Core 8 (Npgsql), AWSSDK.S3, SixLabors.ImageSharp (существуют), Next.js 14 next/image (remotePatterns s3.twcstorage.ru уже настроены), Tailwind токены 009, Jest + Testing Library, Playwright, xUnit (существуют); новых зависимостей нет
- **Storage**: PostgreSQL — новая nullable колонка ArtworkImages.OriginalPath; PageContent how-to-buy/body; S3 Timeweb
- **Testing**: xUnit (водяной знак по пикселям, сопоставление пар, DescriptionCleaner, how-to-buy endpoint, home available, rewatermark dry-run с фейковым S3); Jest (AvailableGrid, TrustStrip, ReviewsPreview выбор, HowToBuy fallback, ScaleDiagram пропорции, фильтры галереи и URL, OrderForm отправка+цель); Playwright на проде (hero, /order, фильтры, полоса доверия)
- **Target Platform**: Linux Docker (api + frontend + nginx), браузеры mobile-first
- **Project Type**: web_application
- **Performance Goals**: Главная на мобильном — load < 5 с (было ~30 с); изображения сетки ≤ 640 px ширины через оптимизатор
- **Constraints**: Оригиналы S3 не удаляются; перерендер только по однозначной паре (окно 120 с, то же расширение, без повторного использования оригинала); админка без редизайна; файлы ≤ 200 строк, функции ≤ 50 (P3); миграция применяется при старте (Database.Migrate)
- **Scale/Scope**: 427 работ, ~430 изображений, 5 категорий

## Constitution Check

| Principle | Status | Justification |
|---|---|---|
| `P1` | pass | — |
| `P2` | pass | — |
| `P3` | pass | — |
| `P4` | pass | — |
| `P5` | pass | — |
| `P6` | pass | — |
| `P7` | pass | — |
| `P8` | pass | — |
| `P9` | pass | — |
| `P10` | pass | — |

## Project Structure

**Layout**: web_application

Backend: модель backend/MomSite.Core/Models/ArtworkImage.cs; миграция в backend/MomSite.Infrastructure/Migrations; водяной знак и превью — backend/MomSite.Infrastructure/Services/ImageService.cs; сопоставление пар — backend/MomSite.Infrastructure/Services/WatermarkPairing.cs; перерендер — backend/MomSite.Infrastructure/Services/RewatermarkService.cs; S3 листинг — S3Service.cs; очистка описаний — backend/MomSite.Core/Services/DescriptionCleaner.cs + стартовый запуск в Program.cs; эндпоинты — PublicController (how-to-buy, home, about) и AdminController (images/rewatermark). Frontend: app/HomeClientPage.tsx, components/home/{AvailableGrid,TrustStrip,ReviewsPreview}.tsx, app/gallery/[slug]/{HowToBuy,ScaleDiagram}.tsx, app/gallery/{GalleryFilters,GalleryClientPage}.tsx, lib/gallery.ts (sizeClass, filterArtworks, query sync), app/about (выставки), app/order/{page,OrderForm}.tsx, lib/analytics.ts (custom_order_submit), app/sitemap.ts, components/Footer.tsx, AskPriceButton similar → /order.

**Directories**:

- `backend/MomSite.Core/Models/`
- `backend/MomSite.Core/Services/`
- `backend/MomSite.Infrastructure/Services/`
- `backend/MomSite.Infrastructure/Migrations/`
- `backend/MomSite.API/Controllers/`
- `backend/MomSite.Tests/`
- `frontend/app/`
- `frontend/app/order/`
- `frontend/app/gallery/`
- `frontend/app/gallery/[slug]/`
- `frontend/app/about/`
- `frontend/components/home/`
- `frontend/lib/`
- `frontend/e2e/`
