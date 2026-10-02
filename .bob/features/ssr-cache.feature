Feature: Кэширование серверного рендеринга публичных страниц
  Как посетитель и поисковый бот я хочу получать готовый HTML из кэша,
  как администратор — видеть свои правки на сайте сразу после сохранения,
  чтобы сайт был быстрым (SEO, TTFB) и актуальным.

  # Идентификаторы: @US<n>-AS<k> — сценарии приёмки из spec.yaml,
  # @US<n>-EC<k> — edge cases, @US<n>-BE<k>/IN<k>/E2E<k> — backend/инфраструктура/e2e.
  # TTL кэша 3600 с; секрет — заголовок X-Revalidate-Secret; прогрев — параллелизм 3.

  # Slice 1 — Frontend

  @US1-AS1
  Scenario: Повторный запрос страницы отдаётся из кэша
    Given публичные сегменты экспортируют revalidate = 3600 и не помечены force-dynamic
    When страницу запрашивают повторно
    Then ответ берётся из кэша (x-nextjs-cache: HIT)

  @US1-AS2
  Scenario: Первая отрисовка страницы работы сохраняется в кэш
    Given generateStaticParams страницы работы возвращает [] и dynamicParams = true
    When страницу впервые открывают после деплоя
    Then она рендерится по запросу и кэшируется, сборка не обращается к API

  @US1-AS3
  Scenario: Устаревший кэш отдаётся, свежая версия строится в фоне
    Given кэш страницы старше revalidate
    When страницу открывают
    Then отдаётся сохранённая версия (stale-while-revalidate)

  @US4-AS9
  Scenario: Ошибка API при регенерации не перезаписывает кэш
    Given загрузчик данных страницы получает ошибку API
    When выполняется регенерация
    Then загрузчик бросает исключение, а не возвращает пустые данные

  @US1-EC2
  Scenario: Несуществующий slug работы
    Given API отвечает 404 по работе
    When открывают /gallery/<несуществующий-slug>
    Then вызывается notFound (404), а не ошибка регенерации

  @US1-EC1
  Scenario: Старые ссылки /gallery?artwork=N продолжают работать
    Given ссылка вида /gallery?artwork=N
    When её открывают
    Then поведение прежнее при кэшируемой галерее

  @US2-AS5
  Scenario: Сброс кэша без верного секрета отклоняется
    Given REVALIDATE_SECRET задан на фронте
    When POST /internal/revalidate без заголовка, с неверным секретом или при незаданном REVALIDATE_SECRET
    Then ответ 401 {revalidated:false}, revalidatePath не вызывается

  @US2-AS4
  Scenario: Сброс кэша с верным секретом
    Given верный X-Revalidate-Secret
    When POST /internal/revalidate
    Then вызывается revalidatePath('/', 'layout'), ответ 200 {revalidated:true, warmup:"started"}

  @US3-AS8
  Scenario: Фоновый прогрев после сброса
    Given кэш сброшен
    When запускается прогрев
    Then все URL из sitemap запрашиваются через 127.0.0.1:PORT не более чем по 3 параллельно

  @US2-EC3
  Scenario: Несколько сбросов подряд не запускают параллельные прогревы
    Given прогрев уже идёт
    When приходит ещё один валидный сброс
    Then кэш сбрасывается, ответ warmup:"already-running", второй прогрев не стартует

  # Slice 2 — Backend

  @US2-BE1
  Scenario: Успешная запись в админке инициирует сброс кэша
    Given успешный (2xx) POST/PUT/PATCH/DELETE под /api/admin
    When ответ отправлен
    Then ICacheInvalidator вызывается fire-and-forget и шлёт POST с X-Revalidate-Secret на Frontend:RevalidateUrl

  @US2-BE2
  Scenario: GET, ошибки и login не инициируют сброс
    Given GET-запрос, ответ 4xx/5xx или POST /api/admin/auth/login
    When ответ отправлен
    Then ICacheInvalidator не вызывается

  @US2-AS6
  Scenario: Недоступный фронт не ломает сохранение
    Given фронт не отвечает, отвечает ошибкой или таймаутом (5 с)
    When администратор сохраняет правку
    Then админ-запрос возвращает успех, ошибка сброса только логируется

  # Slice 3 — Инфраструктура и e2e

  @US2-IN1
  Scenario: /internal недоступен извне
    Given публичный nginx
    When запрос https://angelamoiseenko.ru/internal/revalidate
    Then 404 (location ^~ /internal/ { return 404; })

  @US3-EC4
  Scenario: Деплой передаёт секрет обоим сервисам
    Given deploy_remote.sh
    When REVALIDATE_SECRET отсутствует в .env
    Then он генерируется (openssl rand -hex 32) и попадает в env frontend и api (Frontend__RevalidateUrl, Frontend__RevalidateSecret)

  @US3-AS7
  Scenario: Прогрев после деплоя
    Given деплой завершён и healthcheck пройден
    When скрипт деплоя завершается
    Then все URL из sitemap запрошены через xargs -P 3 curl

  @US1-E2E1
  Scenario: E2E — кэш и закрытый /internal на работающем сайте
    Given работающий сайт
    When страницу запрашивают дважды и снаружи пробуют /internal/revalidate
    Then второй ответ x-nextjs-cache: HIT, /internal/revalidate — 404
