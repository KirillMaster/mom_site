<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: Кэширование серверного рендеринга публичных страниц

## `T001` ISR-конфигурация публичных страниц и layout [US1]

Убрать export const dynamic = 'force-dynamic' из layout.tsx и всех публичных page.tsx, добавить export const revalidate = 3600; в gallery/[slug] добавить generateStaticParams() { return [] } и dynamicParams = true.

**Context**: Сейчас каждая страница рендерится на каждый запрос; ISR даёт отдачу из файлового кэша.

- **Depends on**: —
- **Requirements**: FR-001, FR-002, FR-008
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Заменить force-dynamic на revalidate** — frontend/app/layout.tsx, page.tsx, about, contacts, gallery, gallery/[slug], reviews, videos: export const revalidate = 3600
2. **Пустой generateStaticParams** — frontend/app/gallery/[slug]/page.tsx: generateStaticParams возвращает [] — сборка не ходит в API, страницы строятся при первом запросе
3. **Проверить, что ничто не делает страницу динамической** — нет cookies()/headers()/searchParams в серверных компонентах публичных страниц; useSearchParams в клиентских компонентах обёрнут в Suspense; legacy /gallery?artwork=N обрабатывает middleware.ts
4. **Сборка без API** — npm run build с недоступным NEXT_PUBLIC_API_URL/INTERNAL_API_URL проходит; в выводе build публичные маршруты помечены ISR/○, а не λ

**Technical Notes**:

- `frontend/app/sitemap.ts`: sitemap тоже revalidate = 3600; уже ловит ошибку API
- `frontend/hooks/useApi.ts`: загрузчики через axios — Data Cache не участвует, кэшируется Full Route Cache

**Acceptance Criteria**:

- [x] `AC-1` В публичных сегментах нет force-dynamic, есть revalidate = 3600
- [x] `AC-2` next build проходит без доступа к API

**Test Scenarios**:

- `TS-1` (unit)
  - Given: исходники публичных страниц
  - When: jest-тест читает файлы сегментов
  - Then: нет 'force-dynamic'; revalidate = 3600 экспортирован
  - Verification: automated

## `T002` Ошибка API не кэшируется как страница [US4]

Публичные page.tsx при ошибке загрузки данных бросают исключение (не рендерят заглушку «Ошибка загрузки»), generateMetadata может проглатывать ошибку. Несуществующий slug — notFound().

**Context**: При ISR отрендеренная заглушка ошибки попала бы в кэш на час; брошенная ошибка при фоновой регенерации оставляет прежнюю версию.

- **Depends on**: T001
- **Requirements**: FR-007
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Убрать try/catch-заглушки в страницах** — frontend/app/page.tsx, about, contacts, videos, gallery, reviews: catch → rethrow; ветки if (!data) return <Ошибка> заменить на throw
2. **Оставить защиту metadata** — generateMetadata ловит ошибку и возвращает дефолты (не влияет на кэш страницы)

**Technical Notes**:

- `frontend/app/gallery/page.tsx`: сейчас рендерит «Ошибка загрузки» при пустых данных

**Acceptance Criteria**:

- [x] `AC-3` При ошибке загрузчика серверный компонент страницы отклоняет промис

**Test Scenarios**:

- `TS-2` (unit)
  - Given: загрузчик замокан и бросает ошибку
  - When: вызывается серверный компонент страницы
  - Then: промис отклонён; заглушка ошибки не возвращена
  - Verification: automated

## `T003` Внутренний endpoint сброса кэша [US2]

frontend/app/internal/revalidate/route.ts: POST, проверка X-Revalidate-Secret (timingSafeEqual) против env REVALIDATE_SECRET, revalidatePath('/', 'layout'), запуск фонового прогрева без ожидания.

**Context**: Бэкенду нужен способ сбросить кэш после правок в админке.

- **Depends on**: T004
- **Requirements**: FR-003, FR-004
- **Entities**: —
- **Contracts**: C-1

**Steps**:

1. **Route handler** — export const dynamic = 'force-dynamic'; runtime nodejs; пустой/незаданный секрет → 401
2. **Сброс и прогрев** — revalidatePath('/', 'layout'); void warmCache() из lib/cacheWarmup; ответ {revalidated:true, warmup}

**Technical Notes**:

- `frontend/next.config.js`: rewrite /api/:path* уходит на бэкенд — поэтому путь /internal, не /api

**Acceptance Criteria**:

- [x] `AC-4` Верный секрет → 200 и revalidatePath вызван; неверный/пустой → 401 без вызова

**Test Scenarios**:

- `TS-3` (unit)
  - Given: REVALIDATE_SECRET задан
  - When: POST без/с неверным/с верным заголовком
  - Then: 401/401/200; revalidatePath вызван только в последнем случае
  - Verification: automated

## `T004` Прогрев кэша по sitemap [P] [US3]

frontend/lib/cacheWarmup.ts: warmCache(baseUrl) получает /sitemap.xml с собственного сервера (http://127.0.0.1:${PORT}), извлекает <loc>, переписывает origin на локальный, запрашивает с параллелизмом 3; single-flight — повторный вызов во время прогрева возвращает 'already-running'.

**Context**: Чтобы первый бот после сброса/деплоя получал HIT.

- **Depends on**: —
- **Requirements**: FR-006
- **Entities**: —
- **Contracts**: C-1

**Steps**:

1. **Пул с лимитом** — без новых зависимостей; ошибки отдельных URL игнорируются и считаются
2. **Single-flight** — модульный флаг inProgress; после окончания сбрасывается

**Technical Notes**:

- `frontend/app/sitemap.ts`: абсолютные URL https://angelamoiseenko.ru/... — путь сохранить, origin заменить

**Acceptance Criteria**:

- [x] `AC-5` Все URL sitemap запрошены, одновременно ≤ 3; параллельный вызов не запускает второй прогрев

**Test Scenarios**:

- `TS-4` (unit)
  - Given: fetch замокан, sitemap с 7 URL
  - When: warmCache вызван дважды подряд
  - Then: 7 запросов страниц; максимум 3 одновременно; второй вызов → already-running
  - Verification: automated

## `T005` Backend: инвалидация кэша после записи в админке [P] [US2]

ICacheInvalidator (Core), FrontendCacheInvalidator (Infrastructure, HttpClient, таймаут 5 с, заголовок X-Revalidate-Secret, URL из Frontend:RevalidateUrl), глобальный фильтр/middleware в API: после успешного (2xx) не-GET запроса под /api/admin, кроме /api/admin/login, fire-and-forget вызов; пустой URL/секрет → no-op.

**Context**: Правки владелицы должны появляться сразу, а сбой фронта не должен ломать админку.

- **Depends on**: —
- **Requirements**: FR-003, FR-005
- **Entities**: —
- **Contracts**: C-2

**Steps**:

1. **Интерфейс и реализация** — Task InvalidateAsync(CancellationToken); исключения ловятся и логируются Warning
2. **Хук в пайплайне** — IAsyncResultFilter или middleware после next(); запуск через Task.Run без await ответа клиенту
3. **Конфигурация** — Frontend__RevalidateUrl, Frontend__RevalidateSecret из env; в Testing — фейк-инвалидатор

**Technical Notes**:

- `backend/MomSite.API/Program.cs`: AddHttpClient<ICacheInvalidator, FrontendCacheInvalidator>

**Acceptance Criteria**:

- [x] `AC-6` Успешный POST/PUT/DELETE админки вызывает инвалидатор; GET, login, 4xx — нет
- [x] `AC-7` Исключение инвалидатора не меняет ответ админки

**Test Scenarios**:

- `TS-5` (integration)
  - Given: WebApplicationFactory с фейковым ICacheInvalidator
  - When: успешный PUT админки / GET / неуспешный PUT
  - Then: вызван один раз / не вызван / не вызван
  - Verification: automated
- `TS-6` (unit)
  - Given: HttpMessageHandler, бросающий исключение
  - When: FrontendCacheInvalidator.InvalidateAsync
  - Then: исключение не всплывает; запрос содержит X-Revalidate-Secret
  - Verification: automated

## `T006` Инфраструктура: nginx, compose, deploy-прогрев [P] [US3]

nginx.conf: location ^~ /internal/ { return 404; }. docker-compose.prod.yml: REVALIDATE_SECRET фронту, Frontend__RevalidateUrl=http://mom_site_frontend_prod:3000/internal/revalidate и Frontend__RevalidateSecret бэкенду. deploy_remote.sh: если в .env нет REVALIDATE_SECRET — сгенерировать (openssl rand -hex 32) и дописать до up -d; после public endpoint check — прогрев: curl sitemap.xml, xargs -P 3 curl по URL (ошибки не валят деплой).

**Context**: Секрет без ручной настройки сервера; путь сброса недоступен извне; кэш прогрет после деплоя.

- **Depends on**: —
- **Requirements**: FR-004, FR-006
- **Entities**: —
- **Contracts**: C-1

**Steps**:

1. **nginx** — блок до location /
2. **compose + .env** — ${REVALIDATE_SECRET} в обоих сервисах
3. **deploy_remote.sh** — шаг warm cache с таймаутом на запрос 30 с, итог 'warmed N/M'

**Technical Notes**:

- `scripts/deploy_remote.sh`: set -e — прогрев обернуть, чтобы сбой не ронял деплой

**Acceptance Criteria**:

- [x] `AC-8` curl https://angelamoiseenko.ru/internal/revalidate → 404
- [x] `AC-9` после деплоя первый запрос страницы работы — x-nextjs-cache HIT

**Test Scenarios**:

- `TS-7` (unit)
  - Given: deploy_remote.sh
  - When: bash -n и shellcheck (если есть)
  - Then: синтаксис валиден
  - Verification: automated

## `T007` E2E-проверка кэша [US1]

frontend/e2e/ssr-cache.spec.ts: для BASE_URL на prod-сборке — второй запрос /gallery и страницы работы имеет x-nextjs-cache HIT; /internal/revalidate снаружи → 404; правка в админке видна ≤ 10 с (только при наличии admin-кредов в env, иначе skip).

**Context**: Подтверждение SC-001..SC-003 на реальном окружении.

- **Depends on**: T001, T003, T005, T006
- **Requirements**: FR-001, FR-003, FR-004
- **Entities**: —
- **Contracts**: C-1, C-2

**Steps**:

1. **Playwright request-тесты** — skip, если BASE_URL указывает на next dev (заголовка нет)

**Technical Notes**:

- `frontend/playwright.config.ts`: использовать существующий baseURL

**Acceptance Criteria**:

- [x] `AC-10` Спека зелёная против прода после деплоя

**Test Scenarios**:

- `TS-8` (e2e)
  - Given: прод после деплоя
  - When: npx playwright test e2e/ssr-cache.spec.ts
  - Then: все проверки зелёные
  - Verification: automated

