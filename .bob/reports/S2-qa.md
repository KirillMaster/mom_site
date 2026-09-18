# QA-отчёт — слайс S2 (admin `/admin/messages`)

Feature: `.bob/features/001-leads-not-lost/leads-not-lost.feature`
Процедуры: `.bob/features/001-leads-not-lost/qa-procedures.md`
Проверяемый коммит: `fc9cdca` (hardener, degraded — mutation отключён)
Перезапуск: предыдущий QA-агент упал по сети без коммита/отчёта; работа начата с нуля.

## 0. Сборка и тесты (обязательный первый шаг)

- `cd frontend && npx next build` → **успешно, exit 0**. Все 16 роутов собраны, включая `/admin/messages` (6.03 kB). Единственное сообщение об ошибке в логе — `Error generating sitemap: ... protocol mismatch actual 'socks5h:' expected 'http:'` при генерации `sitemap.xml` (не относится к слайсу S2: вызвано системным SOCKS-прокси окружения хоста при попытке axios дернуть Gallery API во время prerender `/sitemap.xml`; сама страница всё равно сгенерирована, билд завершился с кодом 0).
- Backend: `dotnet test` (MomSite.Tests) → **46/46 passed**, exit 0.
- Frontend: `npm test` (jest) → **15/15 unit-тестов passed** (включая `components/MessagesList.test.tsx`, покрывающий S2-AS2..AS5). Общий exit code jest = 1, но исключительно из-за двух preexisting файлов `e2e/home.spec.ts` и `e2e/admin.spec.ts` — это Playwright-спеки, ошибочно подхватываемые jest (`jest.config.js` не исключает `e2e/`). Этот баг конфигурации существует с `init commit` (be1de0b), до S1/S2/S3, и не относится к текущему слайсу. Сами admin-компоненты и остальные juest-сьюты зелёные.

## 1. Поведенческая проверка — что выполнено, что нет

Процедуры `qa-procedures.md` для S2 требуют реального dev-окружения (`docker compose up`, postgres, JWT-логин, curl без Authorization, открытие в браузере).

Попытки поднять окружение (лимит — «пара попыток», дальше не увязать):
1. `docker compose up -d postgres` — контейнер стартовал, затем упал: постгрес-образ `postgres:latest` подтянул мажорную версию 18+, несовместимую с форматом каталога данных (`pg_ctlcluster`), ошибка `PostgreSQL data in /var/lib/postgresql/data (unused mount/volume)`.
2. `docker compose down -v` (полная очистка volume/network) + повторный `up -d postgres` — **та же ошибка**. Это инфраструктурная проблема образа/volume, не связана с кодом слайса S2.

После второй неудачи — окружение остановлено (`docker compose down`), временный `.env` удалён, дальше — статическая проверка, как предписано.

**Что выполнено поведенчески:** ничего через реальный HTTP (curl/браузер) — окружение поднять не удалось за отведённое число попыток.
**Что выполнено статически (чтение кода + существующие юнит/компонентные тесты, реально прогнанные):**
- backend: `dotnet test --filter Scenario=S2-AS3|S2-AS4` → 2/2 passed; полный прогон 46/46.
- frontend: `MessagesList.test.tsx` реально прогнан через jest, 15/15 passed.
- Чтение `AdminController.cs`, `app/admin/messages/page.tsx`, `app/admin/page.tsx`, `lib/api.ts` — статический анализ авторизации и роутинга (см. §2).

Честно: **AS1 (401/редирект) поведенчески НЕ проверен ни на бэкенде, ни на фронтенде.** Причина — невозможность поднять окружение (см. выше), а не лень; hardener тоже не проверял это поведенчески (см. §2).

## 2. Достаточность проверки авторизации — НЕДОСТАТОЧНА

Hardener добавил два теста (`MessagesEndpoints_RequireAuthorization`, `AllMessageEndpoints_AreEachProtected`), оба — **чистая рефлексия**: проверяют только наличие `[Authorize]` на классе `AdminController` и отсутствие `[AllowAnonymous]` на 4 методах (`GetMessages`, `GetUnreadMessagesCount`, `GetMessage`, `ArchiveMessage`). Комментарий в самом тесте честно признаёт: «the project has no HTTP-pipeline integration test harness ... so the authorization contract is asserted [via] attributes».

Это не то же самое, что «эндпоинт реально возвращает 401 без валидного JWT»:
- Рефлексия не ловит неправильную настройку JWT-схемы в `Program.cs` (например, опечатку в `Authority`/`Issuer`/`Key`, не тот `DefaultAuthenticateScheme`, отсутствие `app.UseAuthentication()` до `UseAuthorization()`) — при такой ошибке `[Authorize]` может пропускать все запросы, а рефлексия этого не заметит.
- В проекте нет ни одного интеграционного теста через `WebApplicationFactory<Program>`, гоняющего реальный middleware pipeline — ни для одного контроллера, не только для messages.

Для персональных данных посетителей (имя/email/сообщение) этого недостаточно. **Вердикт: send-back Coder'у** с конкретным требованием: добавить интеграционный тест (`WebApplicationFactory`+`HttpClient`), реально бьющий `GET /api/admin/messages` (и остальные 3 эндпоинта) без заголовка `Authorization`, ожидающий `401`. Это единственный способ обнаружить дыру, которую рефлексия не видит, и то, что не могу проверить curl'ом при отказе окружения.

Дополнительно замечено (статический дефект, тоже относится к @S2-AS1): фронтенд-роут `/admin/messages` **не имеет клиентского auth-гейта вообще**. `frontend/app/admin/messages/page.tsx` сразу монтирует `MessagesPageContent` и вызывает `useContactMessages`, не проверяя `auth.getToken()` (в отличие от `/admin`, где `app/admin/page.tsx` явно проверяет токен в `useEffect` перед показом контента). При отсутствии токена: axios уходит без `Authorization`, бэкенд отвечает 401, `isError` становится true, и пользователь видит просто текст «Ошибка загрузки заявок.» — **без какого-либо редиректа**. При этом маршрута `/admin/login` в приложении не существует вовсе (`find app -iname "*login*"` → пусто; `grep -rn "admin/login"` по `app/hooks/lib` → 0 совпадений). Сценарий @S2-AS1 явно требует «редирект на страницу логина для фронтенд-маршрута» как альтернативу 401 для варианта «клиент открывает /admin/messages» — этот путь не выполнен ни в каком виде.

## 3. Трассировка сценарий → тест

| Сценарий | Тест | Файл | Результат |
|---|---|---|---|
| @S2-AS1 | `MessagesEndpoints_RequireAuthorization` (рефлексия, не поведенческий) | `AdminMessagesControllerTests.cs:63` | **fail** — процедура (реальный 401 без JWT / редирект фронтенда) не выполнена и не покрыта; см. §2 |
| @S2-AS1-EXT | `AllMessageEndpoints_AreEachProtected` (рефлексия) | `AdminMessagesControllerTests.cs:189` | pass (как рефлексия), недостаточен как единственное доказательство |
| @S2-AS2 | `GetMessages_ReturnsNewestFirst_WithUnreadBadgeCount` + `MessagesList.test.tsx` (`@S2-AS2`) | `AdminMessagesControllerTests.cs:82`, `components/MessagesList.test.tsx` | pass (прогнано) |
| @S2-AS2-EXT | `GetMessages_SortedByCreatedAtDescending_NotById` | `AdminMessagesControllerTests.cs:220` | pass (прогнано) |
| @S2-AS3 | тест на пометку Read при открытии + `MessagesList.test.tsx` (`@S2-AS3`) | `AdminMessagesControllerTests.cs:110` | pass (прогнано, `--filter Scenario=S2-AS3`) |
| @S2-AS4 | тест на архивирование + `MessagesList.test.tsx` (`@S2-AS4`) | `AdminMessagesControllerTests.cs:141` | pass (прогнано, `--filter Scenario=S2-AS4`) |
| @S2-AS5 | `GetMessages_EmptyDatabase_ReturnsEmptyListAndZeroUnread` + `MessagesList.test.tsx` (`@S2-AS5`) | `AdminMessagesControllerTests.cs:173` | pass (прогнано) |

Дополнительно проверено статически:
- Архивирование не удаляет запись физически: `ArchiveMessage` (`AdminController.cs`) только меняет `message.Status = ContactMessageStatus.Archived` и делает `SaveChangesAsync()`, нет `_context.ContactMessages.Remove(...)`. Подтверждено также `GetMessages(status)`: фильтр `"all"` и `"archived"` продолжают отдавать архивные записи — они остаются доступны в списке (соответствует @S2-AS4).
- Регрессия прочих разделов админки: полный backend-прогон 46/46 включает `AdminControllerTests.cs` (artworks/categories/videos/etc.) — все зелёные, поведение не сломано.

## 4. Метрики

- Backend тесты: 46/46 passed, 0 failed, exit 0.
- Frontend jest: 15/15 unit-тестов passed; итоговый exit code сьюта = 1 из-за preexisting misconfiguration (Playwright-спеки в jest), не относящейся к S2.
- `next build`: exit 0, `/admin/messages` собран.

## 5. Вердикт

**send-back → Coder.**

Диагноз:
1. `frontend/app/admin/messages/page.tsx` — отсутствует проверка авторизации/редирект для неаутентифицированного доступа к маршруту (@S2-AS1, ветка "открывает /admin/messages"). Нужно либо добавить клиентский гейт (по аналогии с `app/admin/page.tsx`, где есть `useEffect` + `auth.getToken()`), либо ре-использовать `/admin` как единую точку логина с редиректом оттуда — но в приложении сейчас нет вообще никакого маршрута логина, на который можно редиректить пользователя пришедшего сразу на `/admin/messages`.
2. `backend/MomSite.Tests/AdminMessagesControllerTests.cs` — тесты на @S2-AS1 и @S2-AS1-EXT проверяют только атрибуты рефлексией, не реальный HTTP-pipeline. Нужен интеграционный тест через `WebApplicationFactory<Program>` (или эквивалент), реально отправляющий запрос без `Authorization` на все 4 эндпоинта messages и проверяющий код 401 — для персональных данных посетителей одной рефлексии недостаточно.

Оба пункта относятся к одному сценарию @S2-AS1 — рекомендую чинить вместе.
