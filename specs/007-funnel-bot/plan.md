<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: 007-funnel-bot

**Branch**: `feature/005-growth-foundation`

## Summary

Публичный бот @angela_moiseenko_bot ведёт посетителя по короткому сценарию (цель → уточнение → бюджет → контакт → имя) и сохраняет лид как существующий ContactMessage; уведомление уходит существующими IFeedbackNotifier (TelegramNotifier через mom_site_bot в те же TELEGRAM_CHAT_IDS, EmailNotifier). Бот работает long polling внутри api-контейнера и включается только при заданном FUNNEL_BOT_TOKEN. Общий код сохранения+уведомления выносится из PublicController в LeadService, которым пользуются и форма сайта, и бот. Плюс SSR-страница /privacy, текст которой хранится в существующем PageContent (pageKey=privacy) и правится в /admin/pages.

## Technical Context

- **Language/Version**: C# 12 / .NET 8 (backend); TypeScript 5 strict / Next.js 14 App Router (frontend)
- **Primary Dependencies**: ASP.NET Core 8 (BackgroundService, IHttpClientFactory, IMemoryCache), EF Core 8 + Npgsql (миграция ContactMessage), Telegram Bot API (HTTPS, getUpdates/sendMessage/sendPhoto/answerCallbackQuery) — свой тонкий клиент, без NuGet-пакетов, Next.js 14 (SSR /privacy, sitemap.ts)
- **Storage**: PostgreSQL (ContactMessage + 3 новых nullable-поля, Email nullable; PageContent без изменений схемы); состояние диалога — IMemoryCache (TTL 24 ч)
- **Testing**: xUnit (unit — FunnelDialog/payload/лимиты; integration — фейковый HttpMessageHandler Bot API + InMemory/SQLite БД), Jest + Testing Library (/privacy, строка согласия), Playwright (/privacy доступна из футера)
- **Target Platform**: Linux Docker (mom_site_api_prod, extra_hosts api.telegram.org), браузеры mobile-first, Telegram-клиенты
- **Project Type**: web_application
- **Performance Goals**: Ответ бота на нажатие ≤ 2 с (p95) при доступном Telegram; уведомление маме ≤ 10 с после подтверждения
- **Constraints**: Секреты только из env (FUNNEL_BOT_TOKEN, TELEGRAM_BOT_TOKEN); токен не попадает в логи (HttpClient → Warning); один экземпляр api (long polling); только приватные чаты; ≤ 3 лида/пользователь/сутки, ≤ 1 сообщение/с на чат; ошибка Telegram не роняет api
- **Scale/Scope**: Десятки диалогов в день, один экземпляр сервиса, 2 получателя уведомлений

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

Новый код бота — изолированная папка Infrastructure/TelegramBot (клиент Bot API, DTO, polling-сервис, конечный автомат на чистых функциях, тексты). Сохранение лида и рассылка уведомлений — ILeadService (Core) + LeadService (Infrastructure), PublicController переводится на него без изменения поведения. TelegramNotifier дополняет текст телефоном/Telegram-ссылкой. Frontend — новая страница app/privacy и ссылки из футера, формы контактов и sitemap.

**Directories**:

- `backend/MomSite.Core/Interfaces/ILeadService.cs`
- `backend/MomSite.Core/Models/ContactMessage.cs`
- `backend/MomSite.Infrastructure/Services/LeadService.cs`
- `backend/MomSite.Infrastructure/TelegramBot/`
- `backend/MomSite.Infrastructure/Notifications/TelegramNotifier.cs`
- `backend/MomSite.Infrastructure/Data/Migrations/`
- `backend/MomSite.API/Controllers/PublicController.cs`
- `backend/MomSite.API/Program.cs`
- `backend/MomSite.Tests/TelegramBot/`
- `frontend/app/privacy/`
- `frontend/app/sitemap.ts`
- `frontend/components/`
- `frontend/e2e/`
- `docker-compose.prod.yml`
