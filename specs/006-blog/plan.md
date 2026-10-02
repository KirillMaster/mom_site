<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: 006-blog

**Branch**: `feature/005-growth-foundation`

## Summary

Новые сущности BlogPost, BlogCategory, BlogPostArtwork (M:N к Artwork) в PostgreSQL одной миграцией. Публичный API /api/public/blog (список с пагинацией и рубрикой, статья по адресу, рубрики) и админ CRUD /api/admin/blog + загрузка картинок через существующий IImageService (папка blog). Тело — HTML, очищаемый на backend HtmlSanitizer по белому списку. Фронт: SSR /blog, /blog/[slug], /blog/category/[slug] с generateMetadata, BlogPosting/BreadcrumbList JSON-LD (отдельный компонент), sitemap, RSS route handler; админка /admin/blog с редактором TipTap, подгружаемым динамически. IndexNow-пинг при публикации — fire-and-forget. Видимость работ по теме — общий фильтр Visible() из 005.

## Technical Context

- **Language/Version**: C# 12 / .NET 8 (backend); TypeScript 5 strict / Next.js 14.0 App Router, React 18 (frontend)
- **Primary Dependencies**: EF Core 8 + Npgsql (новые таблицы), HtmlSanitizer (Ganss.Xss, MIT) — очистка BodyHtml (новая зависимость Infrastructure), IImageService / S3Service (существуют) — картинки статей, @tiptap/react + starter-kit + extension-link + extension-image (MIT) — только админка, next/dynamic, react-query (useApi) в админке; next/image в публичной части
- **Storage**: PostgreSQL — BlogPosts, BlogCategories, BlogPostArtworks; картинки в S3 (Timeweb) папка blog
- **Testing**: xUnit (unit — sanitizer, slug uniquify, видимость по PublishedAt; integration — public/admin эндпоинты); Jest (компоненты статьи, редактора, sitemap/RSS); Playwright (создал → опубликовал → увидел, черновик → 404)
- **Target Platform**: Linux Docker (mom_site_api_prod, mom_site_frontend_prod), браузеры mobile-first
- **Project Type**: web_application
- **Performance Goals**: LCP статьи на мобильном ≤ 2,5 с (SSR + ISR revalidate 300 с, priority только у обложки); публичный бандл без TipTap
- **Constraints**: Только [Authorize] для admin; санитизация при каждом сохранении; картинки ≤ 15 МБ jpeg/png/webp с авто-уменьшением; редактор в простом режиме без HTML (A-8); slug ^[a-z0-9-]{1,120}$ неизменен после публикации; ключ IndexNow через env; файлы ≤ 200 строк (P3)
- **Scale/Scope**: Десятки статей в год, 1 автор, 5–6 рубрик

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

Backend: модели в Core/Models, интерфейсы IBlogService и IIndexNowClient в Core/Interfaces, реализации и санитайзер в Infrastructure/Blog, контроллеры BlogPublicController и BlogAdminController в API (не раздуваем PublicController/AdminController). Frontend: app/blog (SSR), app/blog/rss.xml/route.ts, app/admin/blog (редактор разбит на PostEditor, RichTextEditor, CoverUpload, ArtworkPicker, SeoFields, PublishBar), components/blog, правки sitemap.ts, Navigation, Footer, StructuredData (только @id у Person).

**Directories**:

- `backend/MomSite.Core/Models/BlogPost.cs`
- `backend/MomSite.Core/Models/BlogCategory.cs`
- `backend/MomSite.Core/Models/BlogPostArtwork.cs`
- `backend/MomSite.Core/Interfaces/IBlogService.cs`
- `backend/MomSite.Core/Interfaces/IIndexNowClient.cs`
- `backend/MomSite.Infrastructure/Blog/`
- `backend/MomSite.Infrastructure/Data/Migrations/`
- `backend/MomSite.API/Controllers/BlogPublicController.cs`
- `backend/MomSite.API/Controllers/BlogAdminController.cs`
- `backend/MomSite.API/DTOs/Blog/`
- `backend/MomSite.Tests/Blog/`
- `frontend/app/blog/`
- `frontend/app/admin/blog/`
- `frontend/components/blog/`
- `frontend/components/Navigation.tsx`
- `frontend/components/Footer.tsx`
- `frontend/components/StructuredData.tsx`
- `frontend/app/sitemap.ts`
- `frontend/public/`
- `frontend/types/`
- `frontend/lib/`
- `frontend/e2e/`
