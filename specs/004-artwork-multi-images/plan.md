<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: Несколько фотографий одной картины

**Branch**: `feature/004-artwork-multi-images`

## Summary

Новая сущность ArtworkImage (1..10 фото на работу, SortOrder 0 = обложка, поля Artwork.ImagePath/ThumbnailPath синхронизируются с обложкой), EF-миграция с переносом текущих фото, admin endpoints для добавления/удаления/порядка, публичный DTO отдаёт images[]; на фронте — серверно-рендеримая галерея (миниатюры на десктопе, scroll-snap карусель на мобайле) с существующим yet-another-react-lightbox, мультизагрузка с drag&drop в админке, бейдж количества в сетке.

## Technical Context

- **Language/Version**: C# / .NET 8; TypeScript strict, Next.js 14.0 App Router, React 18
- **Primary Dependencies**: ASP.NET Core 8, EF Core 8 + Npgsql, существующий IImageService (S3 Timeweb, миниатюра 300x300, водяной знак), Next.js 14, Tailwind, @tanstack/react-query (админка), yet-another-react-lightbox + Zoom (уже в проекте)
- **Storage**: PostgreSQL (таблица ArtworkImages), S3 для файлов
- **Testing**: xUnit + WebApplicationFactory (Testing env, EnsureCreated); Jest + RTL; Playwright
- **Target Platform**: Linux Docker (prod), браузеры десктоп/мобайл
- **Project Type**: web_application
- **Performance Goals**: Lighthouse 90+, без CLS при переключении фото, основное фото priority, остальные lazy
- **Constraints**: без новых библиотек каруселей; обратная совместимость публичного DTO; файлы ≤ 200 строк (стремиться), функции ≤ 50 строк
- **Scale/Scope**: десятки–сотни работ, 1 администратор

## Constitution Check

| Principle | Status | Justification |
|---|---|---|
| `P1` | pass | spec/plan/tasks через yamlkit, реализация через bob-pipeline |
| `P2` | pass | сущность в Core, конфигурация EF в Infrastructure, endpoints и DTO в API |
| `P3` | pass | логику порядка/обложки выносим в небольшой сервис, компоненты галереи разбиты на мелкие |
| `P4` | pass | новые endpoints под [Authorize], валидация файлов и id на backend |
| `P5` | pass | unit+integration (xUnit), компонентные (Jest), e2e (Playwright) на каждый слайс |
| `P6` | pass | ветка feature/004-artwork-multi-images, PR в main |
| `P7` | pass | все фото в SSR-HTML, JSON-LD image[], alt «Название — фото N» |
| `P8` | pass | фото из S3, lazy для неосновных, фиксированный aspect-контейнер против CLS |
| `P9` | pass | русские сообщения, подтверждение удаления, e2e админки; ручная проверка владелицей |
| `P10` | pass | mobile-first карусель на CSS scroll-snap, минимум JS |

## Project Structure

**Layout**: web_application

Существующая структура: backend (Clean Architecture) и frontend (Next.js App Router).

**Directories**:

- `backend/MomSite.Core/Models/ (ArtworkImage, Artwork.Images)`
- `backend/MomSite.Infrastructure/Data/ (DbContext config, Migrations/AddArtworkImages)`
- `backend/MomSite.API/Controllers/ (ArtworkImagesController или расширение ArtworksController)`
- `backend/MomSite.API/DTOs/ (ArtworkImageDto, images[] в ArtworkDto/ArtworkAdminDto)`
- `backend/MomSite.Tests/`
- `frontend/app/gallery/[slug]/ (ArtworkGallery, ArtworkViewer)`
- `frontend/app/gallery/ (бейдж в сетке)`
- `frontend/app/admin/artworks/ (мультизагрузка, менеджер фото)`
- `frontend/lib/api.ts, frontend/hooks/useApi.ts`
- `frontend/e2e/`
