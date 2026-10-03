# Quickstart: 009-design-system-seaside

## Prerequisites
- Node 20, Playwright browsers (chromium). Backend не меняется — достаточно прод-API или существующего dev-стека.

## Frontend
```
cd frontend
npm test
npx playwright test e2e/design-system.spec.ts e2e/no-overflow.spec.ts --project=chromium
```
Против прода: `PLAYWRIGHT_BASE_URL=https://angelamoiseenko.ru`.

Ожидание: зелёные тесты `price-lib`, `museum-label-component`, `ui-primitives` (contracts.yaml), контраст палитры `design-tokens` (data-model.yaml), гард запрещённых классов.

## Сценарии
| # | Шаг | Ожидание |
|---|-----|----------|
| 1 | Любая публичная страница | Фон бумага rgb(247,246,243), текст графит, нет оранжевого/фиолетового/градиентов (US1) |
| 2 | /admin | Выглядит как раньше (US1, EC5) |
| 3 | Заголовки и текст | h1 — Cormorant Garamond, текст — Manrope; абзац биографии на /about ≤ 75ch (US2) |
| 4 | /gallery и карточка работы | Этикетка: «Название» курсивом, техника, размер, год, цена охрой; пустые строки опущены; проданная — «Продана», без цены — «цена по запросу» (US3) |
| 5 | Tab по /contacts | У полей и кнопки видимое морское кольцо фокуса; ошибки связаны с полем (US4) |
| 6 | Все публичные страницы на 390 px | Нет горизонтального скролла (US4) |
| 7 | Шапка на /gallery | Пункт «Галерея» выделен, aria-current=page; футер графитовый (US5) |
| 8 | Скриншоты главной, /gallery, работы, /contacts на 1280 и 390 | Сохранены в `frontend/test-results/design/` для визуальной проверки (US5) |
