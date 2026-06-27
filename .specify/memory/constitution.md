# Mom's Art Portfolio (angelamoiseenko.ru) — Constitution

## Core Principles

### I. Spec-Driven Development
Никакая фича не начинается без спецификации. Сначала spec → clarify → plan → tasks → implement. Код без спеки = технический долг.

### II. Чистая архитектура
- Backend: C# ASP.NET Core 8+ с Clean Architecture (MomSite.API / MomSite.Core / MomSite.Infrastructure)
- Frontend: Next.js (App Router), React, TypeScript strict mode
- Стили: Tailwind CSS
- Файловое хранилище: S3 (Timeweb)
- Контейнеризация: Docker Compose (dev + prod), Nginx reverse proxy с SSL
- Логирование: Serilog

### III. Качество кода (NON-NEGOTIABLE)
- Backend: следовать C# conventions, async/await everywhere, nullable reference types enabled
- Frontend: TypeScript strict, никаких `any`, компоненты — функциональные с хуками
- Максимум 50 строк на функцию/метод, максимум 200 строк на файл (стремиться к)
- DRY, KISS, YAGNI — в этом порядке приоритета

### IV. Безопасность
- JWT токены — только через env variables, никогда в коде
- CORS — явно перечисленные origins, никаких wildcard в production
- Все пользовательские входы валидируются на backend
- Пароли — через env переменную ADMIN_PASSWORD
- Nginx: security headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options)
- Rate limiting на nginx (api: 10r/s, login: 5r/m)

### V. Тестирование (NON-NEGOTIABLE)
- **Каждая задача** должна быть покрыта unit-тестами И integration-тестами
- Backend: unit-тесты (MomSite.Tests), integration-тесты для API endpoints
- Frontend: компонентные тесты (Jest + React Testing Library)
- E2E: Playwright для критических user flows
- Тесты запускаются в CI перед деплоем
- То, что нельзя проверить автоматически, **проверяется вручную пользователем**
- **Задача НЕ считается закрытой**, пока:
  1. Все автоматические тесты написаны и проходят
  2. Если требуется ручная проверка — пользователь явно подтвердил ("дал добро")
- Без подтверждения пользователя задачу НЕ закрывать и НЕ считать завершённой

### VI. Git Workflow
- Основная ветка: `main` (protected)
- Рабочие ветки: `feature/xxx`, `fix/xxx`, `chore/xxx`
- Коммиты: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Один PR = одна логическая задача
- Мерж в main только через PR с пройденным CI
- Деплой: автоматический через GitHub Actions при push в main

### VII. SEO (CRITICAL)
- SEO — приоритет №1 для публичной части сайта, цель — топ поисковой выдачи
- SSR/SSG обязателен для всех публичных страниц
- Schema.org разметка (StructuredData компонент) на каждой странице
- Мета-теги: title, description, og:image, og:type на каждой странице
- Семантический HTML: правильные heading levels, alt на изображениях
- Оптимизация Core Web Vitals: LCP, FID, CLS
- sitemap.ts и robots.ts — автогенерация (Next.js App Router)
- Canonical URLs, чистые человекочитаемые URL

### VIII. Производительность (NON-NEGOTIABLE)
- Время открытия любой страницы < 200ms (TTFB + render)
- Lighthouse score: 90+ по всем категориям
- S3 для медиа-контента (не в БД)
- Nginx gzip сжатие, статика с Cache-Control immutable
- Next.js Image optimization
- Минификация и tree-shaking

### IX. Админ-панель (CRITICAL)
- Админка должна быть **самодостаточной**: хозяин сайта управляет всем контентом без разработчиков
- Все операции должны работать **без ошибок**
- UX: простой и понятный для нетехнического пользователя (русский язык, подтверждения, обратная связь)
- Безопасность: JWT [Authorize], rate limiting на login
- E2E тесты (Playwright) для админки
- Каждая фича проходит **ручную проверку** пользователем перед закрытием

### X. Простота и UX
- Сайт — портфолио художницы, должен быть красивым и быстрым
- Mobile-first подход
- Минимум JavaScript для посетителей, максимум — для админки

## Технический стек

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend API | ASP.NET Core (Clean Architecture) | 8+ |
| ORM | Entity Framework Core | 8+ |
| Database | PostgreSQL | latest |
| File Storage | S3 (Timeweb) | — |
| Frontend | Next.js (App Router) + React | latest |
| Styling | Tailwind CSS | latest |
| Auth | JWT Bearer | — |
| Reverse Proxy | Nginx + SSL | — |
| Container | Docker Compose | — |
| CI/CD | GitHub Actions → SSH deploy | — |
| Logging | Serilog | — |
| Email | SMTP (Gmail) | — |
| Hosting | VPS (89.169.3.32) | Ubuntu |
| Domain | angelamoiseenko.ru | — |

## Deployment

- VPS: `root@89.169.3.32`
- Путь на сервере: `/root/mom_site/`
- Деплой: `scripts/deploy_remote.sh <git-sha>`
- Docker Compose prod: `docker-compose.prod.yml`
- SSL: `/etc/ssl/angelamoiseenko.ru/`
- Env: `/root/mom_site/.env`

## Development Workflow

1. Создать спеку (`/speckit.specify`)
2. Уточнить (`/speckit.clarify`)
3. Спланировать (`/speckit.plan`)
4. Разбить на задачи (`/speckit.tasks`)
5. Проанализировать (`/speckit.analyze`)
6. Реализовать по фазам (`/speckit.implement Phase N`)
7. Тестировать после каждой фазы
8. PR → CI → Code Review → Merge → Auto-deploy

## Governance

- Конституция — главный документ, превалирует над всеми другими практиками
- Изменения в конституцию — через PR с обоснованием
- Все PR и ревью должны проверять соответствие конституции

**Version**: 2.0.0 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
