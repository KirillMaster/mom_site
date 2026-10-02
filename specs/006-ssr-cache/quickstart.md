# Quickstart: 006-ssr-cache

Контракты: `contracts.yaml` (C-1 `/internal/revalidate`, C-2 инвалидация из admin API).

## Локально
1. `cd frontend && npx jest` — зелёные тесты загрузчиков, route `/internal/revalidate`, `cacheWarmup`.
2. `cd backend && dotnet test MomSite.Tests` — тесты фильтра инвалидации и `FrontendCacheInvalidator`.
3. `REVALIDATE_SECRET=x npx next build && node .next/standalone/server.js`:
   - `curl -I localhost:3000/gallery` дважды → второй ответ `x-nextjs-cache: HIT`;
   - `curl -X POST localhost:3000/internal/revalidate` → 401; с `-H "X-Revalidate-Secret: x"` → 200 `{"revalidated":true,...}`.

## Прод (после деплоя)
| Проверка | Ожидание |
|---|---|
| `curl -I https://angelamoiseenko.ru/gallery` (повторно) | `x-nextjs-cache: HIT` |
| `curl -X POST https://angelamoiseenko.ru/internal/revalidate` | 404 (nginx) |
| Правка работы в админке | видна на публичной странице ≤ 10 с |
| Лог деплоя | прогрев sitemap выполнен после healthcheck |
