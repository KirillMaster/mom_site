<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: 008-conversion-quick-wins

**Branch**: `feature/008-conversion-quick-wins`

## Summary

Миграция AddArtworkCatalogFields вводит подмножество полей data-model 005 (Status enum, WidthCm, HeightCm, Year, Support, Technique); IsForSale остаётся колонкой и синхронизируется из Status при сохранении; данные мигрируются A-2. ContactMessage получает Phone ≤ 100, Email становится необязательным, DTO проверяет «email или телефон» через IValidatableObject. Админ-форма работы — блок характеристик. Фронт: ArtworkSpecs (только заполненные поля), ContactChannels и MobileContactBar с предзаполненным текстом из lib/contactChannels и целью ContactClick на канал; форма контактов с полем «Телефон или мессенджер» и ?artwork; галерея — клиентский срез по 24 и «Показать ещё», lazy/async превью, карточка-ссылка с ценой и размером; RelatedWorks ≤ 8 + «Смотреть все» на /gallery?category=; фикс overflow на /about; SEO-метаданные и alt hero; утилита normalizeTitle; e2e на отсутствие горизонтального скролла при 390 px.

## Technical Context

- **Language/Version**: C# 12 / .NET 8 (backend); TypeScript 5 strict / Next.js 14 App Router, React 18 (frontend)
- **Primary Dependencies**: EF Core 8 + Npgsql (одна миграция AddArtworkCatalogFields, одна AddContactPhone), System.ComponentModel.DataAnnotations (IValidatableObject для правила email|phone), lib/analytics reachGoal (существует) — цель ContactClick с channel и artwork, lib/social maxProfileUrl и socialLinks из публичного API (существуют), Tailwind, next/image (существуют); новых npm-зависимостей нет
- **Storage**: PostgreSQL — новые колонки Artworks (Status int, WidthCm, HeightCm, Year, Support, Technique) и ContactMessages.Phone
- **Testing**: xUnit (unit — правило email|phone, синхронизация IsForSale из Status, маппинг DTO; integration — POST /api/public/contact с телефоном без email, admin PUT работы с характеристиками); Jest (ArtworkSpecs, ContactChannels, MobileContactBar, normalizeTitle, buildPrefilledMessage, пагинация галереи, RelatedWorks, форма контактов); Playwright (карточка → мессенджер, форма без email, «Показать ещё», нет overflow на 390 px на всех публичных страницах)
- **Target Platform**: Linux Docker (mom_site_api_prod, mom_site_frontend_prod), браузеры mobile-first
- **Project Type**: web_application
- **Performance Goals**: Галерея рендерит ≤ 24 карточек до клика «Показать ещё»; превью loading=lazy кроме первого ряда; LCP карточки на мобильном ≤ 2,5 с; TTFB + render < 200 мс (P8)
- **Constraints**: Поля и enum строго по data-model 005 (совместимость будущего импорта); существующие API-поля не удаляются (IsForSale остаётся в DTO); телефон ≤ 100 символов без строгого формата; ссылки мессенджеров только из socialLinks/phone (A-3), Telegram — прямой чат (A-4); файлы ≤ 200 строк, функции ≤ 50 (P3)
- **Scale/Scope**: ~300 работ, 1 администратор, десятки заявок в месяц

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

Backend: enum ArtworkStatus и новые поля в Core/Models/Artwork.cs, Phone в ContactMessage и ContactMessageDto (IValidatableObject), миграции в Infrastructure/Data/Migrations, расширение ArtworkDto/ArtworkAdminDto/MappingExtensions и ArtworksController (Create/Update DTO). Frontend: новые компоненты в app/gallery/[slug] (ArtworkSpecs, ContactChannels, MobileContactBar), lib/contactChannels.ts и lib/normalizeTitle.ts, правки GalleryClientPage, RelatedWorks, ContactsClientPage, AboutClientPage, HomeClientPage, метаданных gallery/reviews, админ-формы ArtworkFormFields; e2e/conversion.spec.ts и e2e/no-overflow.spec.ts.

**Directories**:

- `backend/MomSite.Core/Models/`
- `backend/MomSite.Infrastructure/Data/Migrations/`
- `backend/MomSite.API/DTOs/`
- `backend/MomSite.API/Controllers/`
- `backend/MomSite.Tests/`
- `frontend/app/gallery/`
- `frontend/app/gallery/[slug]/`
- `frontend/app/contacts/`
- `frontend/app/about/`
- `frontend/app/reviews/`
- `frontend/components/admin/`
- `frontend/lib/`
- `frontend/types/`
- `frontend/e2e/`
