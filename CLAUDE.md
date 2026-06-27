# Mom's Art Portfolio — angelamoiseenko.ru

## Проект
Сайт-портфолио художницы Анжелы Моисеенко. Галерея работ, видео, биография, контакты, отзывы. Админка для управления контентом.

## Архитектура

### Backend (Clean Architecture)
```
backend/
├── MomSite.API/            — ASP.NET Core Web API (controllers, DTOs, Program.cs)
├── MomSite.Core/           — Domain models, interfaces
├── MomSite.Infrastructure/ — EF Core, S3, Email, Image services
└── MomSite.Tests/          — xUnit тесты
```

### Frontend (Next.js App Router)
```
frontend/
├── app/           — App Router pages (about, gallery, videos, contacts, admin)
├── components/    — React компоненты
├── hooks/         — Custom hooks (useApi)
├── lib/           — API client
├── __tests__/     — Jest component tests
├── e2e/           — Playwright E2E tests
└── types/         — TypeScript типы
```

### Infrastructure
- **Nginx**: reverse proxy, SSL, security headers, gzip, rate limiting
- **Docker Compose**: api + frontend + nginx (prod), + postgres (dev)
- **S3 (Timeweb)**: хранение изображений и видео
- **Deploy**: GitHub Actions → SSH → `scripts/deploy_remote.sh`
- **Domain**: angelamoiseenko.ru

## Правила разработки

### Spec-Driven Development (SpecKit)
Конституция и все правила: `.specify/memory/constitution.md`

### Git
- Ветки: `feature/`, `fix/`, `chore/`
- Коммиты: conventional commits (`feat:`, `fix:`, `chore:`)
- PR в `main` → CI → auto-deploy
