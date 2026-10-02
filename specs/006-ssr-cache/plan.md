<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: Кэширование серверного рендеринга публичных страниц

**Branch**: `feature/006-ssr-cache`

## Summary

Перевод публичных страниц Next.js 14 с force-dynamic на ISR (revalidate 3600, файловый кэш .next/cache внутри контейнера), загрузчики данных бросают ошибку вместо отдачи пустой страницы, backend после каждой успешной записи в админке fire-and-forget вызывает внутренний POST /internal/revalidate на фронте (секрет X-Revalidate-Secret), фронт делает revalidatePath('/', 'layout') и фоновый прогрев по sitemap; nginx закрывает /internal извне; deploy_remote.sh прогревает кэш после healthcheck.

## Technical Context

- **Language/Version**: TypeScript strict, Next.js 14.0 App Router; C# / .NET 8
- **Primary Dependencies**: Next.js ISR (segment config revalidate, revalidatePath), ASP.NET Core 8 IHttpClientFactory + action filter / MediatR-независимый сервис, nginx (reverse proxy), Docker Compose prod, bash deploy_remote.sh
- **Storage**: файловый кэш Next (.next/cache, .next/server/app) в контейнере фронта, без volume
- **Testing**: Jest (route handler, warmup, конфигурация сегментов), xUnit + WebApplicationFactory (вызов инвалидации), Playwright/curl (x-nextjs-cache HIT на проде)
- **Target Platform**: Linux Docker (prod)
- **Project Type**: web_application
- **Performance Goals**: TTFB закэшированной страницы < 200 мс; прогрев ~300 URL с параллелизмом 3
- **Constraints**: сборка без доступа к API; админка не кэшируется; ошибка инвалидации не влияет на ответ админки; файлы ≤ 200 строк, функции ≤ 50
- **Scale/Scope**: ~300 публичных URL, 1 администратор, 1 инстанс фронта

## Constitution Check

| Principle | Status | Justification |
|---|---|---|
| `P1` | pass | spec/plan/tasks через yamlkit, реализация через bob-pipeline |
| `P2` | pass | интерфейс ICacheInvalidator в Core, HTTP-реализация в Infrastructure, фильтр в API |
| `P3` | pass | маленькие модули: route handler, warmup, invalidator |
| `P4` | pass | секрет в заголовке, сравнение constant-time, /internal закрыт в nginx (deny all / 404) |
| `P5` | pass | unit (jest/xUnit), integration (WebApplicationFactory), e2e проверка заголовков на проде |
| `P6` | pass | ветка feature/006-ssr-cache, PR в main |
| `P7` | pass | полный HTML из кэша для ботов, нет кэширования страниц-ошибок |
| `P8` | pass | основная цель — производительность (TTFB) |
| `P9` | pass | правки владелицы видны в течение 10 секунд |
| `P10` | not_applicable | — |

## Project Structure

**Layout**: web_application

Существующая структура: backend (Clean Architecture), frontend (Next.js App Router), инфраструктура в корне.

**Directories**:

- `frontend/app/*/page.tsx, frontend/app/layout.tsx (revalidate вместо force-dynamic, generateStaticParams)`
- `frontend/app/internal/revalidate/route.ts`
- `frontend/lib/cacheWarmup.ts`
- `backend/MomSite.Core/Interfaces/ICacheInvalidator.cs`
- `backend/MomSite.Infrastructure/Services/FrontendCacheInvalidator.cs`
- `backend/MomSite.API/Filters/InvalidateCacheFilter.cs`
- `nginx.conf, docker-compose.prod.yml, scripts/deploy_remote.sh`
