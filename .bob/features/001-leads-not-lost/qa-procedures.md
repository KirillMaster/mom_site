# QA-процедуры — 001-leads-not-lost

Каждая процедура выполняется буквально против реального кода (dev-окружение: `docker compose up` с postgres, API на конфиге из `.env`/appsettings.Development). Где не указано иное — используется `curl` и прямые SQL-запросы к dev-БД через `psql`/EF.

## S1 — Persistence + Notifiers

### @S1-AS1
1. Установить в `.env`/окружении API реальные валидные `EMAIL_USERNAME`/`EMAIL_PASSWORD` (тестовый SMTP, например Mailhog/smtp4dev) и валидные `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` (тестовый бот).
2. `SELECT count(*) FROM "ContactMessages";` — зафиксировать текущее число строк N.
3. `curl -i -X POST https://<host>/api/public/contact-message -H "Content-Type: application/json" -d '{"name":"Иван Иванов","email":"ivan@example.com","subject":"Хочу картину","message":"Расскажите про доставку"}'`
4. Проверить: код ответа 200.
5. `SELECT * FROM "ContactMessages" ORDER BY "CreatedAt" DESC LIMIT 1;` — проверить count = N+1, поля Name/Email/Subject/Message совпадают, Status='New', IpAddress и UserAgent не NULL/не пустые.
6. Проверить входящее письмо в Mailhog UI / почтовом ящике администратора.
7. Проверить входящее сообщение в тестовом Telegram-чате через getUpdates или UI клиента.

### @S1-AS2
1. Установить `EMAIL_USERNAME=your-email@gmail.com`, `EMAIL_PASSWORD=your-app-password` (воспроизводит прод-баг), `TELEGRAM_BOT_TOKEN` не задан.
2. Выполнить POST как в AS1 с валидными полями.
3. Проверить код ответа 200 (не 500).
4. Проверить в БД новую запись Status='New'.
5. Проверить логи API (`docker compose logs api` или файл лога) на наличие `AuthenticationException`/`535 5.7.8` без падения процесса.
6. Проверить тело ответа клиенту — не содержит стектрейса/деталей SMTP-ошибки.

### @S1-AS3
1. `TELEGRAM_BOT_TOKEN` задан, но с намеренно неверным `TELEGRAM_CHAT_ID` (например `0`); `EMAIL_USERNAME` не задан.
2. POST с валидными полями.
3. Проверить код ответа 200, новая запись в БД Status='New'.
4. Проверить логи на ошибку Telegram Bot API без падения запроса.

### @S1-AS4
1. Убрать `EMAIL_USERNAME` и `TELEGRAM_BOT_TOKEN` из окружения (отключить оба канала конфигурацией).
2. POST с валидными полями.
3. Проверить код 200, новая запись в БД.
4. Проверить логи/моки — ни один HTTP-вызов к SMTP или Telegram API не был сделан (mock verify / отсутствие исходящих соединений в трассировке).

### @S1-AS5
1. Остановить контейнер БД: `docker compose stop postgres`.
2. POST с валидными полями.
3. Проверить код ответа 500.
4. Убедиться, что нет исходящих запросов к SMTP/Telegram (мок verify).
5. Поднять БД обратно: `docker compose start postgres`.

### @S1-AS6
1. БД и окружение в рабочем состоянии.
2. `curl -i -X POST .../api/public/contact-message -d '{"name":"Иван","email":"","subject":"S","message":"M"}'`
3. Проверить код 400.
4. `SELECT count(*)` — убедиться, что не выросло.

### @S1-AS7
1. POST с полями `utm_source=yandex&utm_medium=cpc&utm_campaign=spring` (в теле JSON).
2. Проверить код 200, `SELECT UtmSource, UtmMedium, UtmCampaign FROM "ContactMessages" ORDER BY "CreatedAt" DESC LIMIT 1;` — значения совпадают.
3. Повторить POST без utm-полей.
4. Проверить код 200, соответствующие поля NULL.

## S2 — Admin UI

### @S2-AS1
1. `curl -i https://<host>/api/admin/messages` без заголовка Authorization.
2. Проверить код 401.
3. Открыть `/admin/messages` в браузере без сессии — проверить редирект на `/admin/login`.

### @S2-AS2
1. Через SQL или сидинг создать 3 записи ContactMessage: две Status='New' (разное CreatedAt), одну Status='Read', с разными CreatedAt (проверяемый порядок).
2. Залогиниться в админку, получить JWT.
3. Открыть `/admin/messages`, проверить порядок отображения (новые сверху по CreatedAt).
4. Проверить бейдж непрочитанных = 2.

### @S2-AS3
1. Создать запись Status='New'.
2. Открыть её в UI (или дернуть `GET /api/admin/messages/{id}` с последующим переходом, если открытие меняет статус).
3. `SELECT Status FROM "ContactMessages" WHERE Id=...;` — проверить 'Read'.
4. Проверить, что бейдж непрочитанных уменьшился на 1 в UI.

### @S2-AS4
1. Взять запись Status='Read', нажать "Архивировать" в UI (или вызвать соответствующий PATCH-эндпоинт).
2. Проверить Status='Archived' в БД.
3. Проверить, что запись не учитывается в бейдже непрочитанных.
4. Проверить, что запись доступна в списке (с фильтром или отдельной вкладкой).

### @S2-AS5
1. Очистить таблицу ContactMessage в тестовой БД (или использовать чистую тестовую БД).
2. Открыть `/admin/messages`.
3. Проверить отображение пустого состояния без ошибок в консоли/логах, бейдж = 0 или скрыт.

## S3 — Anti-spam

### @S3-AS1
1. `curl -i -X POST .../api/public/contact-message -d '{"name":"Bot","email":"bot@example.com","subject":"S","message":"M","website":"http://spam.example"}'` (honeypot-поле, например `website`, заполнено).
2. Проверить код 200.
3. `SELECT count(*)` — не увеличилось.
4. Проверить логи/моки — email/Telegram не отправлялись.

### @S3-AS2
1. Тот же запрос с пустым `website=""` (или полем отсутствующим).
2. Проверить код 200 и появление новой записи в БД.

### @S3-AS3
1. Определить настроенный лимит N (см. конфиг rate-limit, напр. appsettings).
2. Скриптом отправить N+1 запросов подряд с одного IP (curl в цикле, тем же `X-Forwarded-For` при необходимости).
3. Проверить: первые N — 200/400 согласно валидности; (N+1)-й — 429.
4. `SELECT count(*)` — прирост записей равен числу успешных (не более N).

### @S3-AS4
1. После достижения лимита подождать длительность окна rate-limit (или переставить системные часы/использовать тестовый конфиг с коротким окном).
2. Отправить новый валидный запрос с того же IP.
3. Проверить код 200 и создание записи в БД.
