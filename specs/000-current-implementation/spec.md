# Spec 000: Текущая реализация — Портфолио художницы Анжелы Моисеенко

**Status**: Baseline (as-is)  
**Created**: 2026-06-27  
**Updated**: 2026-06-28  
**URL**: https://angelamoiseenko.ru

---

## Feature Overview

Сайт-портфолио художницы Анжелы Моисеенко. Публичная часть — витрина работ, видео, биография, контакты. Админка — полное управление контентом (CMS) через веб-интерфейс с JWT-авторизацией. Хранение медиа в S3.

## User Stories

### Посетитель
- Просмотр главной страницы с каруселью работ по категориям и приветственным блоком
- Просмотр галереи картин с фильтрацией по категориям
- Просмотр деталей картины в lightbox
- Чтение биографии художницы
- Просмотр видео по категориям
- Контакты и форма обратной связи (email)
- SEO: sitemap, robots.txt, Schema.org, Open Graph

### Администратор
- Авторизация через логин/пароль → JWT
- CRUD для картин (загрузка, редактирование, удаление, watermark)
- Управление категориями картин
- CRUD для видео и видео-категорий
- Редактирование контента страниц (биография, контакты, футер, соцсети)
- Управление порядком отображения

---

## Architecture

### Backend (C# ASP.NET Core 8 — Clean Architecture)

```
backend/
├── MomSite.API/
│   ├── Controllers/
│   │   ├── AdminController.cs    — CRUD: artworks, categories, videos, page-content, login
│   │   ├── PublicController.cs   — GET: home, gallery, about, contacts, videos, footer
│   │   └── TestController.cs     — Health/test endpoints
│   ├── DTOs/                     — ArtworkDto, CategoryDto, VideoDto, PublicDtos
│   └── Program.cs                — DI, JWT, CORS, Serilog, S3/Image/Email services
├── MomSite.Core/
│   ├── Models/                   — Artwork, Category, Video, VideoCategory, PageContent
│   └── Interfaces/               — Service interfaces
├── MomSite.Infrastructure/
│   ├── Data/ApplicationDbContext.cs
│   ├── Services/
│   │   ├── S3Service.cs          — Timeweb S3 storage
│   │   ├── ImageService.cs       — Image processing + watermarks
│   │   └── EmailService.cs       — SMTP (Gmail)
│   └── Migrations/
└── MomSite.Tests/                — xUnit tests
```

### Frontend (Next.js 14 App Router + React + Tailwind)

```
frontend/
├── app/
│   ├── page.tsx                  — Главная (карусель по категориям)
│   ├── gallery/page.tsx          — Галерея с фильтрами
│   ├── about/page.tsx            — Биография (SSR)
│   ├── videos/page.tsx           — Видео по категориям
│   ├── contacts/page.tsx         — Контакты + форма
│   ├── admin/                    — Админка (artworks, categories, pages, videos)
│   ├── sitemap.ts                — Динамический sitemap
│   └── robots.ts                 — robots.txt
├── components/                   — UI компоненты
├── hooks/useApi.ts               — React Query hooks
├── lib/api.ts                    — Axios клиент, типы
├── __tests__/                    — Jest тесты
└── e2e/                          — Playwright E2E
```

### Infrastructure

- **Nginx**: reverse proxy, SSL (angelamoiseenko.ru), HTTP→HTTPS, security headers, gzip, rate limiting
- **Docker Compose**: api + frontend + nginx (prod), + postgres (dev)
- **S3**: Timeweb (`s3.twcstorage.ru`) — изображения, видео
- **PostgreSQL**: внешний хост (`188.225.75.81`)
- **CI/CD**: GitHub Actions — CI (build+test) → Deploy (SSH → VPS)

---

## API Endpoints

### Public (`/api/public/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | /home | Данные главной (welcome, categories с artworks) |
| GET | /gallery | Все категории и картины |
| GET | /about | Биография, фото, философия |
| GET | /contacts | Контакты, FAQ |
| GET | /videos | Видео по категориям |
| GET | /footer | Данные футера |
| POST | /contact-message | Отправка email через форму |

### Admin (`/api/admin/`) — все требуют JWT
| Method | Path | Description |
|--------|------|-------------|
| POST | /login | Авторизация → JWT |
| GET/POST/PUT/DELETE | /artworks | CRUD картин |
| GET/POST/PUT/DELETE | /categories | CRUD категорий |
| GET/POST/PUT/DELETE | /videos | CRUD видео |
| GET/POST/PUT/DELETE | /video-categories | CRUD видео-категорий |
| GET | /page-content-by-key | Контент страницы по ключу |
| POST | /page-content | Создание/upsert контента |
| PUT | /page-content/{id} | Обновление контента |

---

## Key Entities

| Entity | Description |
|--------|-------------|
| Artwork | Картина: Title, Description, ImagePath (S3), Category, Year, Technique, Size, IsAvailable |
| Category | Категория: Name, Description, DisplayOrder, ShowOnHome |
| Video | Видео: Title, Description, VideoPath (S3), VideoCategory |
| VideoCategory | Категория видео: Name, Description, DisplayOrder |
| PageContent | CMS-контент: PageKey, ContentKey, TextContent, ImagePath, LinkUrl, IsActive, DisplayOrder |

---

## Known Issues (Fixed in this session)

### ✅ Fixed
1. **Biography save** — `formData` init перезаписывала `textContent` полем `imagePath` (баг в инициализации)
2. **Missing page-content records** — `additional_biography`, `philosophy` не создавались в БД из-за falsy check
3. **Duplicate key on POST** — POST `/page-content` не проверял дубликаты (добавлен upsert)
4. **CI отсутствовал** — deploy шёл без тестов (добавлен CI workflow)
5. **Deploy race condition** — frontend стартовал раньше API при пересборке контейнеров

### ⚠️ Known Issues
1. **Frontend SSR через внешний URL** — `NEXT_PUBLIC_API_URL=https://angelamoiseenko.ru/api` заставляет SSR ходить через nginx вместо docker network (race condition при деплое)
2. **MailKit уязвимость** — `MailKit 4.3.0` has moderate severity vulnerability (GHSA-9j88-vvj5-vhgr)
3. **ImageSharp уязвимости** — `SixLabors.ImageSharp 3.1.4` has high severity vulnerabilities

---

## Deployment

| Component | Detail |
|-----------|--------|
| VPS | 89.169.3.32 (Ubuntu) |
| Domain | angelamoiseenko.ru |
| Path | /root/mom_site/ |
| Deploy | GitHub Actions → SSH → `scripts/deploy_remote.sh <sha>` |
| Docker | `docker-compose.prod.yml` (api + frontend + nginx) |
| SSL | /etc/ssl/angelamoiseenko.ru/ |
| DB | PostgreSQL @ 188.225.75.81 |
| S3 | s3.twcstorage.ru |
