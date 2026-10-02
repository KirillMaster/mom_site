# QA-процедуры: кэш SSR (ssr-cache)

Общее: frontend — из `frontend/`: `npx jest --testPathIgnorePatterns=e2e/ -t "<id>"`; backend — `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj --filter "Scenario=<id>"` (тесты помечены `[Trait("Scenario","<id>")]`). Критерий: exit 0 и тесты реально выполнены (не 0 прогнано).

## Slice 1 — Frontend

### @US1-AS1 — кэш публичных страниц
1. `npx jest -t "US1-AS1"`
2. `grep -rn "force-dynamic" frontend/app` — пусто вне admin/internal.
3. `grep -rln "revalidate = 3600" frontend/app` — во всех публичных сегментах.

### @US1-AS2 — рендер по запросу
1. `npx jest -t "US1-AS2"`
2. `grep -n "generateStaticParams\|dynamicParams" frontend/app/gallery/[slug]/page.tsx`
3. `npx next build` при недоступном API — успешна.

### @US1-AS3 — stale-while-revalidate
1. `npx jest -t "US1-AS3"` (экспорт revalidate; само SWR — Next.js).

### @US4-AS9 — ошибка API не кэшируется
1. `npx jest -t "US4-AS9"` — загрузчики бросают при reject/500.

### @US1-EC2 — несуществующий slug
1. `npx jest -t "US1-EC2"` — 404 API → `notFound()`.

### @US1-EC1 — `/gallery?artwork=N`
1. `npx jest -t "US1-EC1"`

### @US2-AS5 — 401 без верного секрета
1. `npx jest -t "US2-AS5"` — без заголовка / неверный / env не задан → 401, `revalidatePath` не вызван.

### @US2-AS4 — 200 с верным секретом
1. `npx jest -t "US2-AS4"` — `revalidatePath('/', 'layout')`, warmup "started".

### @US3-AS8 — прогрев по sitemap
1. `npx jest -t "US3-AS8"` — запросы на 127.0.0.1:PORT, все URL, одновременно ≤ 3.

### @US2-EC3 — single-flight
1. `npx jest -t "US2-EC3"` — второй вызов во время прогрева → "already-running".

## Slice 2 — Backend

### @US2-BE1 — инвалидация после 2xx
1. `--filter "Scenario=US2-BE1"` — POST/PUT/PATCH/DELETE /api/admin 2xx → invalidator вызван; `FrontendCacheInvalidator` шлёт POST с `X-Revalidate-Secret`.

### @US2-BE2 — без инвалидации
1. `--filter "Scenario=US2-BE2"` — GET, 4xx/5xx, login → не вызван.

### @US2-AS6 — фронт недоступен
1. `--filter "Scenario=US2-AS6"` — исключение/таймаут не меняет 2xx, логируется.

## Slice 3 — Инфраструктура и e2e

### @US2-IN1 — /internal закрыт
1. `grep -n "location ^~ /internal/" nginx/*.conf` → `return 404;` в server 443.
2. После деплоя: `curl -s -o /dev/null -w "%{http_code}" -X POST https://angelamoiseenko.ru/internal/revalidate` → 404.

### @US3-EC4 — секрет в deploy
1. `bash -n scripts/deploy_remote.sh`
2. grep `openssl rand -hex 32`, `REVALIDATE_SECRET` в deploy_remote.sh и docker-compose.prod.yml (frontend; api: `Frontend__RevalidateUrl`, `Frontend__RevalidateSecret`).

### @US3-AS7 — прогрев после деплоя
1. `bash -n scripts/deploy_remote.sh`
2. grep после healthcheck: `xargs -P 3` + `curl` по sitemap.

### @US1-E2E1 — e2e
1. `npx playwright test e2e/ssr-cache.spec.ts` (PLAYWRIGHT_BASE_URL=прод) — второй ответ `x-nextjs-cache: HIT`; `/internal/revalidate` → 404.
