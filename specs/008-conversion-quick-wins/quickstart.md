# Quickstart: 008-conversion-quick-wins

## Prerequisites
- .NET 8 SDK, Node 20, Docker (postgres dev), Playwright browsers.
- `docker compose -f docker-compose.dev.yml up -d postgres` (или существующий dev-стек).

## Backend
```
cd backend
dotnet ef database update --project MomSite.Infrastructure --startup-project MomSite.API
dotnet test
```
Ожидание: миграции AddArtworkCatalogFields и AddContactPhone применены; тесты на `admin-artwork-upsert`, `public-contact-message` (контракты в contracts.yaml) зелёные.

## Frontend
```
cd frontend
npm test
npx playwright test e2e/conversion.spec.ts e2e/no-overflow.spec.ts
```

## Сценарии
| # | Шаг | Ожидание |
|---|-----|----------|
| 1 | Админка → работа → заполнить размер/технику/основу/год/статус | На карточке блок характеристик, только заполненные строки (US1) |
| 2 | Карточка работы → кнопка WhatsApp | Открывается wa.me с текстом «Здравствуйте! Интересует картина «…» <url>», цель ContactClick channel=whatsapp (US2) |
| 3 | Карточка на 390 px | Снизу панель «Написать / Позвонить», не перекрывает футер (US2) |
| 4 | /contacts?artwork=Название → только телефон | Тема подставлена, заявка принята; без email и телефона — ошибка (US3) |
| 5 | /gallery | 24 карточки, «Показать ещё» добавляет 24; карточка — ссылка, цена/«цена по запросу» и размер (US4) |
| 6 | Карточка → «Другие работы» | ≤ 8 работ, «Смотреть все» → /gallery?category=… (US5) |
| 7 | Все публичные страницы на 390 px | Нет горизонтального скролла (US6) |
| 8 | Исходник /gallery, /reviews, главная | Новые title/description, осмысленный alt hero (US7) |
| 9 | Работа с названием `"Закат"` | Выводится «Закат» (US8) |
