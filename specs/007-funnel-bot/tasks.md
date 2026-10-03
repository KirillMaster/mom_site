<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: 007-funnel-bot

## `T001` Передать FUNNEL_BOT_TOKEN в api-контейнер [P] [US1]

Добавить переменную окружения FUNNEL_BOT_TOKEN в docker-compose.prod.yml без значения

**Context**: Публичный бот включается только по токену; токен живёт в серверном .env, не в репозитории

- **Depends on**: —
- **Requirements**: FR-011
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Добавить переменную** — В docker-compose.prod.yml, сервис api, блок environment, после TELEGRAM_CHAT_IDS: `- FUNNEL_BOT_TOKEN=${FUNNEL_BOT_TOKEN:-}`; пустое значение = бот выключен
2. **Проверить отсутствие секретов** — `git grep -nE "bot[0-9]{6,}:"` ничего не находит; в dev docker-compose.yml переменную не добавлять
3. **Зафиксировать ручной шаг** — Токен кладёт владелец в серверный .env; deploy.yml и scripts/deploy_remote.sh TELEGRAM_* не передают, менять их не нужно

**Technical Notes**:

- `docker-compose.prod.yml`: Telegram-переменные уже в environment сервиса api (~строки 23-24); extra_hosts api.telegram.org уже закреплён
- `scripts/deploy_remote.sh`: Не передаёт TELEGRAM_*; .env живёт на сервере. Расхождение: quickstart говорит про GitHub secret, фактически используется серверный .env

**Acceptance Criteria**:

- [x] `AC-1` Переменная FUNNEL_BOT_TOKEN объявлена в api prod-compose, дефолт пустой
- [x] `AC-2` В репозитории нет значений токенов

**Test Scenarios**:

- `TS-1` (integration)
  - Given: docker-compose.prod.yml изменён
  - When: выполнено `docker compose -f docker-compose.prod.yml config` при пустом FUNNEL_BOT_TOKEN
  - Then: команда проходит, переменная пустая
  - Verification: automated

## `T002` Расширить модель ContactMessage полями бота [US2]

Email сделать nullable, добавить Phone, TelegramUsername, TelegramUserId в модель, конфигурацию EF и admin-DTO

**Context**: Заявка из бота хранится в существующей таблице; email у неё нет, зато есть телефон и Telegram

- **Depends on**: —
- **Requirements**: FR-004
- **Entities**: contact-message
- **Contracts**: lead-service

**Steps**:

1. **Изменить модель** — В backend/MomSite.Core/Models/ContactMessage.cs: `string? Email` без [Required]; добавить `[MaxLength(100)] string? Phone`, `[MaxLength(64)] string? TelegramUsername`, `long? TelegramUserId`
2. **Обновить конфигурацию EF** — В ApplicationDbContext.OnModelCreating, блок ContactMessage: убрать IsRequired у Email (HasMaxLength(200) оставить), Phone HasMaxLength(100), TelegramUsername HasMaxLength(64)
3. **Обновить admin-DTO** — В ContactMessageAdminDto: `string? Email`, добавить Phone, TelegramUsername, TelegramUserId; дополнить ToAdminDto в MappingExtensions.cs
4. **Не трогать DTO формы** — ContactMessageDto.Email остаётся [Required]: форма сайта по-прежнему требует email
5. **Собрать** — `cd backend && dotnet build`; поправить места, где Email считался non-null (см. T006)

**Technical Notes**:

- `backend/MomSite.Core/Models/ContactMessage.cs`: Email сейчас [Required] string
- `backend/MomSite.Infrastructure/Data/ApplicationDbContext.cs`: Блок конфигурации ContactMessage ~строки 104-120
- `backend/MomSite.API/DTOs/ContactMessageAdminDto.cs`: Email сейчас non-null string
- `backend/MomSite.API/DTOs/MappingExtensions.cs`: ToAdminDto ~строки 121-135
- `specs/008-conversion-quick-wins`: ПЕРЕСЕЧЕНИЕ: 008 тоже делает Email nullable и добавляет Phone (<=100, миграция AddContactPhone, ContactMessageDto : IValidatableObject). Phone здесь тоже <=100 (в data-model 007 указано 32 - выровнять). Кто сливается вторым, не дублирует поле, а ребейзит модель, DTO и миграцию

**Acceptance Criteria**:

- [x] `AC-1` ContactMessage содержит Phone, TelegramUsername, TelegramUserId; Email nullable
- [x] `AC-2` Сборка зелёная, ContactMessageDto не изменён

**Test Scenarios**:

- `TS-1` (unit)
  - Given: модель обновлена
  - When: dotnet build
  - Then: 0 ошибок
  - Verification: automated

## `T003` Миграция БД для полей заявки из бота [US2]

Сгенерировать EF-миграцию AddContactBotFields

**Context**: Новые колонки и nullable Email должны попасть в Postgres при деплое

- **Depends on**: T002
- **Requirements**: FR-004
- **Entities**: contact-message
- **Contracts**: —

**Steps**:

1. **Проверить миграции 008** — Если AddContactPhone из 008 уже в ветке - в этой миграции только TelegramUsername и TelegramUserId; иначе также Email nullable и Phone
2. **Сгенерировать** — `cd backend && dotnet ef migrations add AddContactBotFields --project MomSite.Infrastructure --startup-project MomSite.API`
3. **Проверить Up/Down** — Up: Email nullable, Phone varchar(100), TelegramUsername varchar(64), TelegramUserId bigint, все NULL; Down обратим
4. **Применить локально** — `dotnet ef database update` на dev-Postgres

**Technical Notes**:

- `backend/MomSite.Infrastructure/Data/Migrations`: Последняя миграция 20261002174348_AddBlog; меняется ApplicationDbContextModelSnapshot.cs - конфликт при мердже с 008 разрешать вручную
- `docker-compose.prod.yml`: Миграции применяются при деплое сервисом api

**Acceptance Criteria**:

- [x] `AC-1` Миграция создана и применяется к чистой и существующей БД
- [x] `AC-2` Существующие заявки сохраняют Email

**Test Scenarios**:

- `TS-1` (integration)
  - Given: БД с заявками формы
  - When: применена миграция
  - Then: старые строки не изменились, новые колонки NULL
  - Verification: manual

## `T004` Создать ILeadService и LeadService [US2]

Вынести сохранение заявки и рассылку уведомлений в общий сервис

**Context**: Форма сайта и бот должны доставлять заявки одним кодом без дублирования

- **Depends on**: T002
- **Requirements**: FR-004, FR-005, FR-006
- **Entities**: contact-message
- **Contracts**: lead-service, lead-service-impl, feedback-notifier

**Steps**:

1. **Объявить интерфейс** — backend/MomSite.Core/Interfaces/ILeadService.cs: `Task<LeadSubmitResult> SubmitAsync(ContactMessage message, CancellationToken ct = default)`; record LeadSubmitResult(Id, NotifiedChannels) в том же файле
2. **Реализовать** — backend/MomSite.Infrastructure/Services/LeadService.cs: Add + SaveChangesAsync (ошибка БД пробрасывается); затем foreach IFeedbackNotifier где IsEnabled: try NotifyAsync, catch логируется и не пробрасывается; считать успешные каналы
3. **Зарегистрировать** — В Program.cs рядом с AddScoped<IFeedbackNotifier,...>: `AddScoped<ILeadService, LeadService>()`
4. **Логи** — Только Id и тип notifier'а; без имени, телефона, текста

**Technical Notes**:

- `backend/MomSite.API/Controllers/PublicController.cs`: Исходная логика в приватных TryPersistContactMessageAsync и NotifyContactMessageAsync (~строки 472-505) переносится
- `backend/MomSite.API/Program.cs`: DI notifier'ов ~строки 158-165
- `backend/MomSite.Core/Interfaces/IFeedbackNotifier.cs`: IsEnabled, NotifyAsync(ContactMessage)

**Acceptance Criteria**:

- [x] `AC-1` Сохранение и уведомление выполняются в одном сервисе
- [x] `AC-2` Сбой notifier'а не пробрасывается, лид сохранён
- [x] `AC-3` Сбой БД пробрасывается

**Test Scenarios**:

- `TS-1` (unit)
  - Given: один notifier бросает, второй исправен
  - When: SubmitAsync
  - Then: заявка в БД, исключения нет, второй notifier вызван
  - Verification: automated
- `TS-2` (unit)
  - Given: включённый и выключенный notifier
  - When: SubmitAsync
  - Then: вызван только включённый
  - Verification: automated
- `TS-3` (unit)
  - Given: SaveChanges бросает
  - When: SubmitAsync
  - Then: исключение проброшено, notifier не вызван
  - Verification: automated

## `T005` Перевести PublicController.SendContactMessage на ILeadService [US2]

Заменить приватные Persist/Notify вызовом ILeadService; rate-limit и honeypot оставить

**Context**: Единый путь доставки заявок; поведение формы не должно измениться

- **Depends on**: T004
- **Requirements**: FR-004, FR-005
- **Entities**: contact-message
- **Contracts**: lead-service, public-contact-message

**Steps**:

1. **Внедрить сервис** — В конструктор PublicController добавить ILeadService; убрать список notifier'ов и приватные TryPersistContactMessageAsync/NotifyContactMessageAsync
2. **Вызвать** — После honeypot и валидации `await _leadService.SubmitAsync(BuildContactMessageEntity(dto))` в try; при исключении - лог и 500 с прежним сообщением
3. **Обновить тесты** — В PublicControllerTests.cs конструктор контроллера принимает реальный LeadService с теми же моками notifier'ов; ожидания не менять
4. **Прогнать** — `dotnet test --filter FullyQualifiedName~PublicController`

**Technical Notes**:

- `backend/MomSite.API/Controllers/PublicController.cs`: ПЕРЕСЕЧЕНИЕ: 008 меняет этот же action (валидация email|phone) и ContactMessageDto - мерджить аккуратно
- `backend/MomSite.Tests/PublicControllerTests.cs`: Фабрика контроллера и моки notifier'ов в начале файла

**Acceptance Criteria**:

- [x] `AC-1` Ответы формы (200/400/429/500, honeypot) прежние
- [x] `AC-2` Существующие тесты PublicController проходят без смены ожиданий

**Test Scenarios**:

- `TS-1` (integration)
  - Given: валидная форма, notifier бросает
  - When: POST contact-message
  - Then: 200, заявка в БД
  - Verification: automated
- `TS-2` (unit)
  - Given: заполнен honeypot
  - When: POST contact-message
  - Then: 200, заявки в БД нет
  - Verification: automated

## `T006` Расширить уведомления Telegram и Email под заявки без email [P] [US2]

TelegramNotifier.BuildText добавляет Телефон и Telegram; EmailNotifier не падает при пустом Email

**Context**: Мама должна сразу написать клиенту, у которого может не быть email

- **Depends on**: T002
- **Requirements**: FR-005
- **Entities**: contact-message
- **Contracts**: telegram-notifier, feedback-notifier

**Steps**:

1. **Заголовок** — В TelegramNotifier.BuildText: при UtmSource == "telegram_bot" первая строка «Новая заявка из Telegram-бота», иначе прежняя «Новое сообщение с сайта»
2. **Опциональные строки** — Email только если не пуст; `Телефон: …` если Phone; `Telegram: @username`, иначе `Telegram: tg://user?id=<id>` если есть TelegramUserId
3. **Email-канал** — EmailNotifier: Email через `?? "-"`; ReplyTo только при непустом Email; Phone и Telegram добавить в text и html (через кодирование)
4. **Тесты** — TelegramNotifierTests.cs и EmailNotifierTests.cs: заявка бота без email, с username, без username, без телефона; заявка формы не меняется

**Technical Notes**:

- `backend/MomSite.Infrastructure/Notifications/TelegramNotifier.cs`: BuildText - public static, тесты вызывают напрямую
- `backend/MomSite.Infrastructure/Notifications/EmailNotifier.cs`: message.Email используется ~строки 46-62 и 86
- `backend/MomSite.Infrastructure/Notifications/LeadSource.cs`: Describe не меняется

**Acceptance Criteria**:

- [x] `AC-1` В уведомлении есть телефон и/или ссылка на Telegram клиента
- [x] `AC-2` Заявка формы выглядит как раньше
- [x] `AC-3` Email-канал не падает при Email = null

**Test Scenarios**:

- `TS-1` (unit)
  - Given: заявка с TelegramUsername
  - When: BuildText
  - Then: строка «Telegram: @user»
  - Verification: automated
- `TS-2` (unit)
  - Given: заявка без username, с TelegramUserId
  - When: BuildText
  - Then: строка с tg://user?id=
  - Verification: automated
- `TS-3` (unit)
  - Given: заявка с формы
  - When: BuildText
  - Then: текст идентичен прежнему
  - Verification: automated

## `T007` Клиент Bot API и DTO апдейтов [P] [US1]

Реализовать тонкий TelegramBotClient (getUpdates, sendMessage, sendPhoto, answerCallbackQuery) и DTO апдейтов

**Context**: Бот принимает и отправляет сообщения без внешнего пакета

- **Depends on**: T001
- **Requirements**: FR-001, FR-011
- **Entities**: —
- **Contracts**: bot-api-client, telegram-bot-client

**Steps**:

1. **DTO** — backend/MomSite.Infrastructure/TelegramBot/BotUpdateDtos.cs: Update, Message, Chat(id,type), User(id,username,first_name), Contact(phone_number), CallbackQuery, разметки клавиатур; System.Text.Json с JsonPropertyName
2. **Интерфейс** — backend/MomSite.Infrastructure/TelegramBot/IBotApiClient.cs: GetUpdatesAsync(offset, ct), SendMessageAsync, SendPhotoAsync, AnswerCallbackQueryAsync
3. **Реализация** — backend/MomSite.Infrastructure/TelegramBot/TelegramBotClient.cs на именованном HttpClient "FunnelBot" (Timeout 60 с); getUpdates timeout=50, allowed_updates=[message, callback_query]; ошибки API (в т.ч. 429 с retry_after) и сетевые возвращать результатом, не бросать
4. **Токен не в логах** — Логировать только имя метода и error_code; не логировать URL, exception.ToString(), текст и телефон
5. **Тесты** — backend/MomSite.Tests/TelegramBot/TelegramBotClientTests.cs с фейковым HttpMessageHandler: разбор getUpdates, request_contact, 429, сетевая ошибка

**Technical Notes**:

- `backend/MomSite.Infrastructure/Notifications/TelegramNotifier.cs`: Образец похода в Bot API
- `backend/MomSite.API/Program.cs`: Serilog Override System.Net.Http.HttpClient -> Warning уже стоит: URL с токеном в лог не попадает
- `backend/MomSite.Infrastructure/TelegramBot/`: Новая папка; каждый файл <= 200 строк (P3)

**Acceptance Criteria**:

- [x] `AC-1` Все 4 метода работают против фейкового Bot API
- [x] `AC-2` Ошибки Telegram не бросают исключений наружу
- [x] `AC-3` Токен не появляется в логах

**Test Scenarios**:

- `TS-1` (unit)
  - Given: фейковый ответ getUpdates с message и callback_query
  - When: GetUpdatesAsync
  - Then: Update десериализован с from.username и contact.phone_number
  - Verification: automated
- `TS-2` (unit)
  - Given: ответ 429 retry_after=3
  - When: SendMessageAsync
  - Then: результат с retry_after, исключения нет
  - Verification: automated

## `T008` Модели диалога воронки и тексты [P] [US1]

Описать FunnelState, BotInput, FunnelResult, FunnelContext и тексты, кнопки, вилки

**Context**: Чистая функция сценария нуждается в неизменяемых моделях и централизованных текстах

- **Depends on**: —
- **Requirements**: FR-001
- **Entities**: funnel-state
- **Contracts**: funnel-dialog

**Steps**:

1. **Модели** — backend/MomSite.Infrastructure/TelegramBot/FunnelModels.cs: enum FunnelStep {Goal, Detail, Theme, Budget, Contact, Name, Done}; enum FunnelGoal {Buy, Interior, Commission, Masterclass, Other}; records FunnelState, BotUser, FunnelContext(User, Artwork, QuotaExceeded), FunnelResult(State, Replies, Lead); BotInput: Start | Cancel | Callback | Text | Contact | Unsupported
2. **Ответы** — Reply(text, photoUrl?, keyboard?): inline-кнопки, reply-кнопка request_contact или remove
3. **Тексты** — backend/MomSite.Infrastructure/TelegramBot/FunnelTexts.cs: приветствие, 5 целей, размеры, форматы МК, бюджеты, подтверждение, отказ по квоте, подсказка для Unsupported; тексты черновые (согласует владелец)
4. **callback_data** — Короткие коды <= 64 байт

**Technical Notes**:

- `backend/MomSite.Infrastructure/TelegramBot/`: Новые файлы FunnelModels.cs, FunnelTexts.cs
- `specs/007-funnel-bot/data-model.yaml`: funnel-state: шаги и цели берутся оттуда

**Acceptance Criteria**:

- [x] `AC-1` Модели - неизменяемые record, тексты в одном файле
- [x] `AC-2` callback_data всех кнопок <= 64 байт

**Test Scenarios**:

- `TS-1` (unit)
  - Given: все кнопки FunnelTexts
  - When: проверка длины callback_data
  - Then: каждая <= 64 байт
  - Verification: automated

## `T009` Основной сценарий FunnelDialog: цель, уточнение, бюджет, контакт, имя, лид [US1]

Реализовать автомат FunnelDialog.Handle для 5 целей и сборку ContactMessage

**Context**: Ядро воронки: превращает ответы посетителя в квалифицированный лид

- **Depends on**: T008
- **Requirements**: FR-001, FR-003
- **Entities**: funnel-state, contact-message
- **Contracts**: funnel-dialog

**Steps**:

1. **Ветвление** — backend/MomSite.Infrastructure/TelegramBot/FunnelDialog.cs: Goal -> (Interior|Commission: Detail(размер) -> Theme) | (Masterclass: Detail(формат), бюджет пропускается) | (Buy: Budget) | (Other: свободный текст); затем Budget (кроме МК) -> Contact -> Name -> Done
2. **Контакт** — Кнопка «Поделиться номером» (request_contact) и «Пишите мне в Telegram»; без username «в Telegram» возвращает запрос номера (FR-003)
3. **Имя** — Подставить first_name с кнопкой подтверждения; свободный ввод обрезать до 200
4. **Сборка лида** — backend/MomSite.Infrastructure/TelegramBot/FunnelLeadBuilder.cs: ContactMessage{Name, Email=null, Phone, TelegramUsername, TelegramUserId, Subject="Telegram-бот: <цель>", Message из ответов, UtmSource="telegram_bot", UtmCampaign=payload}; Message до 5000, Subject до 200
5. **Размер файлов** — FunnelDialog.cs, FunnelKeyboards.cs, FunnelLeadBuilder.cs - каждый <= 200 строк; без I/O и статического состояния

**Technical Notes**:

- `backend/MomSite.Core/Models/ContactMessage.cs`: Subject <= 200, Message <= 5000, UtmCampaign <= 200
- `specs/007-funnel-bot/design-notes.md`: Формат ContactMessage лида
- `backend/MomSite.Infrastructure/TelegramBot/`: FunnelDialog - чистая функция (state, input, context) -> result

**Acceptance Criteria**:

- [x] `AC-1` Все 5 целей доходят до готового лида
- [x] `AC-2` Для мастер-класса бюджет пропускается
- [x] `AC-3` Без username бот просит телефон
- [x] `AC-4` Лид с пустым контактом не создаётся

**Test Scenarios**:

- `TS-1` (unit)
  - Given: новый диалог
  - When: пройдены все шаги ветки «Картина для интерьера»
  - Then: лид: Subject «Telegram-бот: Картина для интерьера», Message с размером, темой, бюджетом; Email = null
  - Verification: automated
- `TS-2` (unit)
  - Given: цель «Мастер-класс»
  - When: выбран формат
  - Then: следующий шаг Contact, Budget пропущен
  - Verification: automated
- `TS-3` (unit)
  - Given: пользователь без username
  - When: нажато «Пишите мне в Telegram»
  - Then: запрос номера телефона
  - Verification: automated

## `T010` FunnelDialog: «Назад», /cancel, повторный /start, вне-сценарный текст, неподдерживаемый ввод [US1]

Добавить навигацию назад, сброс, обработку произвольного текста и фото/стикеров

**Context**: Сценарий не должен ломаться на нестандартных действиях

- **Depends on**: T009
- **Requirements**: FR-002
- **Entities**: funnel-state, contact-message
- **Contracts**: funnel-dialog

**Steps**:

1. **Назад** — На шагах 2-5 «Назад» делает pop из History, сохраняя ответы; на шаге Goal кнопки нет
2. **/cancel и /start** — /cancel сбрасывает состояние с подтверждением; /start [payload] в любой момент начинает заново с новым payload
3. **Текст вне сценария** — Нет состояния (или Done) и пришёл текст - лид с целью Other и этим текстом; на шаге с кнопками - подсказка нажать кнопку
4. **Unsupported** — Фото, стикер, голос: подсказка текущего шага, состояние не меняется
5. **Квота** — context.QuotaExceeded при завершении - вежливый отказ, лид не создаётся

**Technical Notes**:

- `backend/MomSite.Infrastructure/TelegramBot/FunnelDialog.cs`: При приближении к 200 строкам вынести в FunnelNavigation.cs

**Acceptance Criteria**:

- [x] `AC-1` «Назад» и /cancel работают на каждом шаге
- [x] `AC-2` Текст вне сценария сохраняется как лид «Другой вопрос»
- [x] `AC-3` Неподдерживаемый ввод не ломает сценарий

**Test Scenarios**:

- `TS-1` (unit)
  - Given: диалог на шаге Budget
  - When: нажато «Назад»
  - Then: шаг Detail, ответы сохранены
  - Verification: automated
- `TS-2` (unit)
  - Given: диалог на любом шаге
  - When: /cancel
  - Then: состояние сброшено, подтверждение
  - Verification: automated
- `TS-3` (unit)
  - Given: нет состояния
  - When: текст «Сколько стоит доставка?»
  - Then: лид «Другой вопрос» с этим текстом
  - Verification: automated
- `TS-4` (unit)
  - Given: диалог на шаге Contact
  - When: прислан стикер
  - Then: подсказка, состояние прежнее
  - Verification: automated

## `T011` Unit-тесты FunnelDialog по всем веткам [US1]

Покрыть тестами каждую цель, переходы, «Назад», /cancel, квоту, Unsupported

**Context**: Каждая ветка автомата проверяется без моков (P5)

- **Depends on**: T010, T012
- **Requirements**: FR-001, FR-002, FR-003
- **Entities**: funnel-state
- **Contracts**: funnel-dialog

**Steps**:

1. **Ветки** — backend/MomSite.Tests/TelegramBot/FunnelDialogTests.cs: Theory по 5 целям до готового лида
2. **Навигация** — backend/MomSite.Tests/TelegramBot/FunnelDialogNavigationTests.cs: «Назад» на шагах 2-5, /cancel, повторный /start с новым payload
3. **Граничные** — Квота, Unsupported, текст вне сценария, имя > 200, Message > 5000
4. **Прогон** — `cd backend && dotnet test --filter FullyQualifiedName~TelegramBot`

**Technical Notes**:

- `backend/MomSite.Tests/TelegramBot/`: Новая подпапка по аналогии с backend/MomSite.Tests/Blog

**Acceptance Criteria**:

- [x] `AC-1` Все ветки автомата покрыты зелёными тестами
- [x] `AC-2` В тестах автомата нет моков и I/O

**Test Scenarios**:

- `TS-1` (unit)
  - Given: набор тестов
  - When: dotnet test --filter FullyQualifiedName~FunnelDialog
  - Then: все зелёные
  - Verification: automated

## `T012` Лимиты: 3 лида в сутки на пользователя и 1 сообщение/с на чат [P] [US1]

Реализовать скользящую квоту лидов и ограничитель исходящих сообщений в памяти

**Context**: Защита от спама и флуда в Telegram API

- **Depends on**: —
- **Requirements**: FR-008
- **Entities**: lead-quota
- **Contracts**: funnel-dialog

**Steps**:

1. **Квота** — backend/MomSite.Infrastructure/TelegramBot/LeadQuota.cs: ILeadQuota.TryReserve(userId) на IMemoryCache, ключ quota:{userId}, времена за 24 ч, лимит 3; TimeProvider для тестов
2. **Лимит чата** — backend/MomSite.Infrastructure/TelegramBot/ChatSendGate.cs: не более 1 исходящего сообщения/с на chatId
3. **Тесты** — backend/MomSite.Tests/TelegramBot/LeadQuotaTests.cs: 3 прохода, 4-й отказ, освобождение через 24 ч (FakeTimeProvider)

**Technical Notes**:

- `backend/MomSite.Tests/MomSite.Tests.csproj`: Проверить наличие Microsoft.Extensions.TimeProvider.Testing; при отсутствии - свой TimeProvider-стаб

**Acceptance Criteria**:

- [x] `AC-1` 4-я заявка за 24 ч от одного пользователя отклоняется
- [x] `AC-2` Через 24 ч квота освобождается

**Test Scenarios**:

- `TS-1` (unit)
  - Given: 3 лида от userId=1
  - When: TryReserve для userId=1
  - Then: false
  - Verification: automated
- `TS-2` (unit)
  - Given: 3 лида, прошло 24 ч + 1 с
  - When: TryReserve
  - Then: true
  - Verification: automated

## `T013` FunnelPollingService: приём апдейтов и исполнение ответов [US1]

BackgroundService с long polling: апдейт в BotInput, вызов FunnelDialog, исполнение Replies и Lead

**Context**: Связывает Telegram, автомат и общий сервис лидов

- **Depends on**: T004, T007, T009, T010, T012
- **Requirements**: FR-001, FR-006, FR-008, FR-011
- **Entities**: funnel-state, lead-quota, contact-message
- **Contracts**: bot-api-client, funnel-dialog, lead-service

**Steps**:

1. **Отключение** — backend/MomSite.Infrastructure/TelegramBot/FunnelPollingService.cs: при пустом FUNNEL_BOT_TOKEN ExecuteAsync пишет одно предупреждение и завершается
2. **Цикл** — getUpdates(offset=last+1, timeout=50); сетевая ошибка - пауза 5 с; 429 - ждать retry_after; исключения не роняют сервис
3. **Фильтр** — Игнорировать апдейты, где chat.type != "private"
4. **Перевод в BotInput** — backend/MomSite.Infrastructure/TelegramBot/BotInputMapper.cs: /start [payload] -> Start; /cancel -> Cancel; callback_query -> Callback (+ answerCallbackQuery); contact -> Contact; text -> Text; прочее -> Unsupported
5. **Исполнение** — Состояние в IMemoryCache `funnel:{chatId}` (TTL 24 ч); Handle -> сохранить State -> отправить Replies через ChatSendGate -> при Lead проверить LeadQuota, создать scope (IServiceScopeFactory) и вызвать ILeadService.SubmitAsync; при ошибке БД ответить «Не удалось отправить, попробуйте позже», диалог не завершать
6. **Логи** — chatId и этап; без текста, телефона, имени, токена

**Technical Notes**:

- `backend/MomSite.API/Program.cs`: ILeadService и DbContext scoped, сервис singleton - только через IServiceScopeFactory
- `backend/MomSite.Infrastructure/TelegramBot/`: Файл <= 200 строк; при росте вынести обработку апдейта в FunnelUpdateHandler.cs

**Acceptance Criteria**:

- [x] `AC-1` Без токена сервис не стартует, сайт работает
- [x] `AC-2` Апдейты из групп игнорируются
- [x] `AC-3` Сбой Telegram не роняет api
- [x] `AC-4` Лид уходит только через ILeadService

**Test Scenarios**:

- `TS-1` (unit)
  - Given: токен пуст
  - When: запуск сервиса
  - Then: завершается без ошибки, одно предупреждение
  - Verification: automated
- `TS-2` (unit)
  - Given: апдейт из группы
  - When: обработка
  - Then: ответа и лида нет
  - Verification: automated
- `TS-3` (unit)
  - Given: Bot API бросает сетевую ошибку
  - When: цикл опроса
  - Then: пауза и повтор, сервис жив
  - Verification: automated

## `T014` Регистрация бота в Program.cs [US1]

Подключить HttpClient FunnelBot, IMemoryCache, квоту и FunnelPollingService в DI

**Context**: Сервис должен стартовать вместе с api и брать токен из окружения

- **Depends on**: T013
- **Requirements**: FR-011
- **Entities**: —
- **Contracts**: telegram-bot-client

**Steps**:

1. **HttpClient** — `AddHttpClient("FunnelBot", c => c.Timeout = TimeSpan.FromSeconds(60))`; адрес с токеном собирает TelegramBotClient, не логирует
2. **Сервисы** — `AddMemoryCache()`, `AddSingleton<IBotApiClient, TelegramBotClient>()`, `AddSingleton<ILeadQuota, LeadQuota>()`, `AddHostedService<FunnelPollingService>()`; оформить методом расширения AddFunnelBot в Infrastructure/TelegramBot/FunnelBotRegistration.cs, чтобы не раздувать Program.cs
3. **Интеграционные тесты** — WebApplicationFactory-тесты стартуют без FUNNEL_BOT_TOKEN, polling отключён
4. **Прогнать** — `cd backend && dotnet build && dotnet test`

**Technical Notes**:

- `backend/MomSite.API/Program.cs`: Блок AddHttpClient/AddScoped notifier'ов ~строки 158-165
- `backend/MomSite.Tests/AdminEnvIntegrationCollection.cs`: Интеграционные тесты поднимают приложение без Telegram-переменных

**Acceptance Criteria**:

- [x] `AC-1` api стартует без FUNNEL_BOT_TOKEN
- [x] `AC-2` С токеном в логе нет строк с токеном

**Test Scenarios**:

- `TS-1` (integration)
  - Given: WebApplicationFactory без FUNNEL_BOT_TOKEN
  - When: старт приложения
  - Then: старт без ошибок, polling не запущен
  - Verification: automated

## `T015` Интеграционный тест: диалог до заявки в БД и вызова notifier [US2]

Прогнать сценарий через FunnelPollingService с фейковым Bot API и реальным LeadService

**Context**: Проверить, что заявка из бота сохраняется и уведомляет тем же механизмом, а сбой уведомления её не теряет

- **Depends on**: T014
- **Requirements**: FR-004, FR-005, FR-006
- **Entities**: contact-message, funnel-state
- **Contracts**: lead-service, bot-api-client, feedback-notifier

**Steps**:

1. **Стенд** — backend/MomSite.Tests/TelegramBot/FunnelEndToEndTests.cs: SQLite in-memory, фейковый HttpMessageHandler с последовательностью апдейтов, Mock<IFeedbackNotifier> (IsEnabled=true)
2. **Успех** — Апдейты /start, цель, размер, тема, бюджет, контакт, имя -> 1 ContactMessage в БД (Phone, UtmSource=telegram_bot); NotifyAsync ровно 1 раз; отправлено подтверждение
3. **Сбой уведомления** — notifier бросает -> заявка в БД, подтверждение отправлено
4. **Квота** — 4 лида от одного пользователя -> в БД 3, четвёртому отказ

**Technical Notes**:

- `backend/MomSite.Tests/TelegramBot/`: Стенд по образцу backend/MomSite.Tests/PublicControllerTests.cs
- `backend/MomSite.Tests/AdminMessagesControllerTests.cs`: Образец работы с ContactMessages в тестах

**Acceptance Criteria**:

- [x] `AC-1` Заявка из бота в таблице ContactMessages со статусом New
- [x] `AC-2` Notifier вызван один раз
- [x] `AC-3` Сбой notifier'а не влияет на подтверждение

**Test Scenarios**:

- `TS-1` (integration)
  - Given: фейковый Bot API
  - When: пройден полный сценарий
  - Then: заявка в БД, уведомление вызвано один раз
  - Verification: automated
- `TS-2` (integration)
  - Given: notifier бросает исключение
  - When: сценарий завершён
  - Then: заявка в БД, подтверждение получено
  - Verification: automated

## `T016` Админка «Заявки»: телефон и Telegram, пустой email [P] [US2]

Обновить типы и UI заявок: Email может быть пустым, показать Телефон и Telegram

**Context**: Лиды из бота без email не должны ломать список и должны позволять ответить клиенту

- **Depends on**: T002
- **Requirements**: FR-004
- **Entities**: contact-message
- **Contracts**: —

**Steps**:

1. **Типы** — frontend/lib/api.ts, админ-заявка: email?: string | null, phone?, telegramUsername?, telegramUserId?
2. **Список** — components/MessagesList.tsx: поиск без undefined (message.email ?? ''), mailto только при email; показать tel: и https://t.me/<username> либо tg://user?id=
3. **Детали** — app/admin/messages/page.tsx (~строка 61): то же для открытой заявки
4. **Тесты** — components/MessagesList.test.tsx: заявка без email, с телефоном и username

**Technical Notes**:

- `frontend/components/MessagesList.tsx`: email используется ~строки 75 (поиск) и 160-161 (mailto)
- `frontend/app/admin/messages/page.tsx`: mailto ~строки 61-62
- `frontend/lib/api.ts`: ПЕРЕСЕЧЕНИЕ с 008: он тоже трогает типы контактов; админ-типы отдельные, файл общий

**Acceptance Criteria**:

- [x] `AC-1` Заявка из бота отображается без ошибок
- [x] `AC-2` Счётчик непрочитанных не сломан

**Test Scenarios**:

- `TS-1` (unit)
  - Given: заявка без email с телефоном и username
  - When: рендер MessagesList
  - Then: нет mailto, видны телефон и ссылка t.me
  - Verification: automated

## `T017` Эндпоинт GET /api/public/privacy [P] [US4]

Добавить публичный эндпоинт с текстом политики из PageContent privacy/body

**Context**: Страница /privacy берёт текст из админки, при его отсутствии - встроенный шаблон

- **Depends on**: —
- **Requirements**: FR-009
- **Entities**: page-content-privacy
- **Contracts**: public-privacy

**Steps**:

1. **DTO** — В backend/MomSite.API/DTOs/PublicDtos.cs: `PrivacyDto(string? Text, DateTime? UpdatedAt)`
2. **Action** — В PublicController `[HttpGet("privacy")]`: запись PageContents где PageKey=="privacy", ContentKey=="body", IsActive; нет записи или пустой текст -> 200 { text: null }
3. **Тесты** — PublicControllerTests.cs: с записью, без записи, с неактивной записью

**Technical Notes**:

- `backend/MomSite.API/Controllers/PublicController.cs`: Образец - actions about/contacts/footer; ПЕРЕСЕЧЕНИЕ: файл правят T005 и 008
- `backend/MomSite.API/DTOs/PublicDtos.cs`: Публичные DTO
- `backend/MomSite.Core/Models/PageContent.cs`: TextContent ограничен MaxLength(2000): длинная политика через админку не влезет; полный текст остаётся во встроенном шаблоне

**Acceptance Criteria**:

- [x] `AC-1` Эндпоинт отдаёт text и updatedAt или text = null
- [x] `AC-2` Схема БД не менялась

**Test Scenarios**:

- `TS-1` (unit)
  - Given: запись privacy/body активна
  - When: GET /api/public/privacy
  - Then: 200, text и updatedAt заполнены
  - Verification: automated
- `TS-2` (unit)
  - Given: записи нет
  - When: GET /api/public/privacy
  - Then: 200, text = null
  - Verification: automated

## `T018` Редактирование политики в /admin/pages [P] [US4]

Добавить раздел privacy в список страниц админки

**Context**: Без этого текст политики нельзя править из админки (P9)

- **Depends on**: —
- **Requirements**: FR-009
- **Entities**: page-content-privacy
- **Contracts**: public-privacy

**Steps**:

1. **Поля** — В frontend/app/admin/pages/page.tsx: в pageFields добавить privacy с полем body (textarea, подсказка «пусто = текст по умолчанию»)
2. **Название** — В pageNames: privacy: «Политика конфиденциальности»
3. **Проверить** — Сохранение создаёт PageContent privacy/body существующим эндпоинтом

**Technical Notes**:

- `frontend/app/admin/pages/page.tsx`: pageFields и pageNames, ~строки 28-86
- `backend/MomSite.API/Controllers/AdminController.cs`: Эндпоинты page-content уже есть, менять не нужно

**Acceptance Criteria**:

- [x] `AC-1` В /admin/pages есть пункт «Политика конфиденциальности» с полем текста
- [x] `AC-2` Сохранённый текст создаёт PageContent privacy/body

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: админка открыта
  - When: выбран раздел «Политика конфиденциальности»
  - Then: отображается поле текста
  - Verification: manual

## `T019` Текст политики по умолчанию и загрузка данных [P] [US4]

Создать шаблон политики 152-ФЗ с реквизитами оператора и getPrivacyData

**Context**: Страница должна работать до того, как текст заведён в админке

- **Depends on**: T017
- **Requirements**: FR-009
- **Entities**: page-content-privacy
- **Contracts**: public-privacy

**Steps**:

1. **Шаблон** — frontend/data/privacyPolicy.ts: DEFAULT_PRIVACY_POLICY (секции {heading, paragraphs}): оператор - Моисеенко Анжела Валерьевна; ответственный за обработку и приём отзыва согласия - Сухоруких Кирилл Всеволодович, suhorukih@mail.ru; состав данных, цели, срок хранения, порядок отзыва согласия
2. **Загрузка** — frontend/hooks/useApi.ts: getPrivacyData() (GET /api/public/privacy, как getAboutData); тип PrivacyData в lib/api.ts
3. **Выбор источника** — frontend/lib/privacy.ts: resolvePrivacy(data) -> текст из админки (абзацы по пустым строкам) либо шаблон
4. **Тесты** — frontend/lib/privacy.test.ts: нет данных -> шаблон с реквизитами; есть текст -> абзацы и дата

**Technical Notes**:

- `frontend/data/`: Уже содержит biography.ts - образец статических данных
- `frontend/hooks/useApi.ts`: getAboutData, getContactsData, getFooterData
- `frontend/lib/api.ts`: Интерфейсы публичных данных

**Acceptance Criteria**:

- [x] `AC-1` Шаблон содержит оператора, состав данных, цели, срок, способ отзыва, контакт ответственного
- [x] `AC-2` Без данных от API страница получает шаблон

**Test Scenarios**:

- `TS-1` (unit)
  - Given: текст не задан в админке
  - When: resolvePrivacy(null)
  - Then: шаблон с реквизитами оператора
  - Verification: automated
- `TS-2` (unit)
  - Given: API вернул text
  - When: resolvePrivacy({text,updatedAt})
  - Then: абзацы из админки и дата
  - Verification: automated

## `T020` SSR-страница /privacy [US4]

Создать app/privacy/page.tsx с generateMetadata и ISR

**Context**: Посетитель, бот и площадки видят политику по постоянному адресу

- **Depends on**: T019
- **Requirements**: FR-009
- **Entities**: page-content-privacy
- **Contracts**: public-privacy

**Steps**:

1. **Страница** — frontend/app/privacy/page.tsx - серверный компонент, `revalidate = 3600`; данные через loadOrBuildFallback(getPrivacyData, { text: null, updatedAt: null }) как в app/about/page.tsx; h1 «Политика конфиденциальности»; абзацы <p> без dangerouslySetInnerHTML
2. **Метаданные** — generateMetadata: title, description, alternates.canonical '/privacy', openGraph
3. **Инвалидация** — Проверить, нужна ли запись /privacy в AdminCacheInvalidationMiddleware; иначе страница обновится по revalidate
4. **Тесты** — frontend/app/privacy/page.test.tsx: рендер шаблона и текста из админки

**Technical Notes**:

- `frontend/app/about/page.tsx`: Образец generateMetadata + loadOrBuildFallback + revalidate
- `backend/MomSite.API`: Найти AdminCacheInvalidationMiddleware или аналог grep'ом (`git grep -il invalidat backend`) перед правкой

**Acceptance Criteria**:

- [x] `AC-1` /privacy отдаётся сервером с h1, метаданными и реквизитами
- [x] `AC-2` Правка в админке отображается на странице

**Test Scenarios**:

- `TS-1` (unit)
  - Given: текст не задан
  - When: рендер /privacy
  - Then: показан шаблон с реквизитами
  - Verification: automated

## `T021` Ссылка на /privacy в футере [P] [US4]

Добавить ссылку «Политика конфиденциальности» в нижний блок Footer

**Context**: Политика доступна со всех страниц

- **Depends on**: T020
- **Requirements**: FR-010
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Ссылка** — В frontend/components/Footer.tsx, блок «Bottom Section» рядом с копирайтом: Link на /privacy «Политика конфиденциальности»
2. **Тест** — components/Footer.test.tsx: ссылка есть и ведёт на /privacy

**Technical Notes**:

- `frontend/components/Footer.tsx`: Блок Bottom Section в конце файла; возможное пересечение с 008 локально
- `frontend/components/Footer.test.tsx`: Существующий тест футера

**Acceptance Criteria**:

- [x] `AC-1` Ссылка видна на всех страницах и ведёт на /privacy

**Test Scenarios**:

- `TS-1` (unit)
  - Given: рендер Footer
  - When: поиск ссылки по тексту
  - Then: href="/privacy"
  - Verification: automated

## `T022` Строка согласия под формой контактов [P] [US4]

Добавить текст согласия со ссылкой на /privacy под кнопкой отправки

**Context**: Форма собирает персональные данные, согласие должно быть явным

- **Depends on**: T020
- **Requirements**: FR-010
- **Entities**: —
- **Contracts**: public-contact-message

**Steps**:

1. **Строка** — В frontend/app/contacts/ContactsClientPage.tsx под кнопкой submit (~строки 232-240): «Отправляя форму, вы соглашаетесь с политикой конфиденциальности» со ссылкой на /privacy
2. **Тест** — ContactsClientPage.test.tsx: строка и ссылка есть; тесты отправки не менять

**Technical Notes**:

- `frontend/app/contacts/ContactsClientPage.tsx`: ПЕРЕСЕЧЕНИЕ с 008: он правит эту же форму (поле «Телефон», кнопка). Вставка локальная после кнопки; мерджить после 008 или ребейзить
- `frontend/app/contacts/ContactsClientPage.test.tsx`: Тесты формы

**Acceptance Criteria**:

- [x] `AC-1` Под формой есть строка согласия со ссылкой на /privacy
- [x] `AC-2` Отправка формы работает как раньше

**Test Scenarios**:

- `TS-1` (unit)
  - Given: страница контактов
  - When: рендер формы
  - Then: ссылка на /privacy под кнопкой
  - Verification: automated

## `T023` Добавить /privacy в sitemap [P] [US4]

Включить страницу политики в sitemap.xml

**Context**: SEO (P7): все публичные страницы в карте сайта

- **Depends on**: T020
- **Requirements**: FR-010
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Запись** — В frontend/app/sitemap.ts, массив staticPages: url /privacy, changeFrequency 'yearly', priority 0.3
2. **Тест** — app/sitemap.test.ts: URL /privacy присутствует

**Technical Notes**:

- `frontend/app/sitemap.ts`: staticPages; ПЕРЕСЕЧЕНИЕ с 008 (он правит sitemap), добавление независимое
- `frontend/app/sitemap.test.ts`: Существующий тест

**Acceptance Criteria**:

- [x] `AC-1` /sitemap.xml содержит https://angelamoiseenko.ru/privacy

**Test Scenarios**:

- `TS-1` (unit)
  - Given: сборка sitemap
  - When: вызов sitemap()
  - Then: есть запись /privacy
  - Verification: automated

## `T024` E2E: переход из футера на /privacy [US4]

Playwright-тест открытия политики из футера и формы

**Context**: Сквозная проверка пути посетителя

- **Depends on**: T020, T021, T022
- **Requirements**: FR-009, FR-010
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Тест** — frontend/e2e/privacy.spec.ts: открыть /, клик по ссылке в футере, ожидать URL /privacy и h1
2. **Реквизиты** — Проверить «Моисеенко Анжела Валерьевна» на странице
3. **Форма** — Открыть /contacts, проверить ссылку согласия на /privacy
4. **Запуск** — `cd frontend && npx playwright test e2e/privacy.spec.ts`

**Technical Notes**:

- `frontend/e2e/blog.spec.ts`: Образец структуры spec
- `frontend/playwright.config.ts`: baseURL и webServer

**Acceptance Criteria**:

- [x] `AC-1` Тест зелёный на мобильном viewport 360x740

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: сайт запущен
  - When: переход из футера на /privacy
  - Then: страница открыта, заголовок «Политика конфиденциальности»
  - Verification: automated

## `T025` Строка согласия со ссылкой на /privacy в боте [US4]

Показывать перед шагом «Контакт» согласие на обработку данных со ссылкой

**Context**: Бот собирает телефон и Telegram-данные, согласие обязательно

- **Depends on**: T010
- **Requirements**: FR-010
- **Entities**: funnel-state
- **Contracts**: funnel-dialog

**Steps**:

1. **Текст** — В FunnelTexts.cs: ConsentLine «Нажимая кнопку, вы соглашаетесь на обработку персональных данных: https://angelamoiseenko.ru/privacy»; базовый URL сайта - константа SiteUrl
2. **Шаг Contact** — При переходе в Contact первый reply содержит ConsentLine и клавиатуру контакта
3. **Тест** — FunnelDialogTests: сообщение шага Contact содержит /privacy

**Technical Notes**:

- `backend/MomSite.Infrastructure/TelegramBot/FunnelTexts.cs`: Тексты и URL в одном месте
- `specs/007-funnel-bot/spec.yaml`: US4: согласие в боте

**Acceptance Criteria**:

- [x] `AC-1` Сообщение запроса контакта содержит ссылку на /privacy

**Test Scenarios**:

- `TS-1` (unit)
  - Given: диалог дошёл до шага Contact
  - When: формируется ответ
  - Then: в тексте есть ссылка на /privacy
  - Verification: automated

## `T026` Разбор deep-link payload [P] [US3]

Реализовать разбор параметра /start: art_<id>, mk, interior, прочее, пустое

**Context**: По параметру бот понимает контекст работы или кампанию

- **Depends on**: T008
- **Requirements**: FR-007
- **Entities**: funnel-state
- **Contracts**: funnel-dialog

**Steps**:

1. **Парсер** — backend/MomSite.Infrastructure/TelegramBot/StartPayload.cs: Parse(string? raw) -> record (Kind: Artwork|Masterclass|Interior|Campaign|None, ArtworkId?, Raw); допустимо только [A-Za-z0-9_-]{1,64}; art_<число> в пределах int; невалидное -> None
2. **Тесты** — backend/MomSite.Tests/TelegramBot/StartPayloadTests.cs: art_12, art_999999, mk, interior, abc-promo, пустое, null, 100 символов, art_abc, недопустимые символы - без исключений

**Technical Notes**:

- `backend/MomSite.Infrastructure/TelegramBot/`: Новый файл StartPayload.cs; результат хранится в FunnelState

**Acceptance Criteria**:

- [x] `AC-1` Работа, МК и интерьер распознаются; прочее - кампания
- [x] `AC-2` Невалидный ввод не бросает исключений

**Test Scenarios**:

- `TS-1` (unit)
  - Given: art_12, art_999999, mk, interior, abc-promo, пусто
  - When: Parse
  - Then: корректный контекст для каждого
  - Verification: automated

## `T027` Контекст работы в сценарии: фото, цель «Купить», пропуск шагов [US3]

Подгрузить работу по art_<id>, сократить сценарий, сохранить источник в лиде

**Context**: Контекст работы сокращает путь и показывает художнице, о какой картине речь

- **Depends on**: T013, T026
- **Requirements**: FR-007
- **Entities**: funnel-state, artwork, contact-message
- **Contracts**: funnel-dialog

**Steps**:

1. **Поиск работы** — В FunnelPollingService при Start с Kind=Artwork через IServiceScopeFactory: ApplicationDbContext.Artworks.Visible() и Id == id -> ArtworkInfo(Id, Title, ThumbnailPath); не найдена -> context.Artwork = null
2. **Автомат** — Работа найдена: sendPhoto (ThumbnailPath, подпись Title), цель Buy, шаги Detail/Theme/Budget пропускаются, сразу Contact; mk -> Masterclass; interior -> Interior; не найдена -> полный сценарий
3. **Лид** — Message содержит «Работа: <Title> https://angelamoiseenko.ru/gallery/artwork-<id>» (фронт резолвит по хвостовому id); UtmSource=telegram_bot, UtmCampaign=Raw
4. **Тесты** — backend/MomSite.Tests/TelegramBot/FunnelDialogPayloadTests.cs: art_<существующий>, art_999999, mk, interior, abc-promo

**Technical Notes**:

- `backend/MomSite.Infrastructure/Data/ArtworkQueryExtensions.cs`: Visible() - единый фильтр; 005 добавит условие публикации, использовать его, не писать свой (скрытая работа не показывается)
- `backend/MomSite.Core/Models/Artwork.cs`: Title, ThumbnailPath: проверить, хранится ли абсолютный URL; иначе собрать так же, как в MappingExtensions
- `frontend/lib/artworkSlug.ts`: Slug <translit>-<id>, разбор по хвостовому id - ссылка artwork-<id> рабочая
- `frontend/app/gallery`: Deep-link CTA на карточке работы вне скоупа 007

**Acceptance Criteria**:

- [x] `AC-1` Для существующей работы бот показывает фото и название и сразу просит контакт
- [x] `AC-2` Для несуществующей или скрытой - обычный сценарий без ошибки
- [x] `AC-3` Кампания сохраняется в UtmCampaign

**Test Scenarios**:

- `TS-1` (integration)
  - Given: ссылка с art_<id> существующей работы
  - When: /start
  - Then: фото и название, цель Buy, шаг Contact
  - Verification: automated
- `TS-2` (integration)
  - Given: ссылка с art_999999
  - When: /start
  - Then: обычный сценарий без исключения
  - Verification: automated
- `TS-3` (unit)
  - Given: ссылка с abc-promo
  - When: заявка завершена
  - Then: UtmCampaign = abc-promo
  - Verification: automated

## `T028` Проверка размера файлов и чистоты логов [P] [US1]

Убедиться, что новые файлы <= 200 строк, а токен и ПДн не попадают в логи

**Context**: P3 и P4 (NON-NEGOTIABLE)

- **Depends on**: T014
- **Requirements**: FR-011
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Размер** — `find backend/MomSite.Infrastructure/TelegramBot backend/MomSite.Tests/TelegramBot -name '*.cs' | xargs wc -l`: ни один файл > 200; иначе разделить
2. **Логи** — Запустить api с тестовым токеном, пройти диалог; `grep -c "bot[0-9]*:"` по логам = 0, телефонов и текстов нет
3. **Секреты** — `git grep -n "FUNNEL_BOT_TOKEN="` - только в compose без значения

**Technical Notes**:

- `backend/MomSite.API/Program.cs`: Serilog пишет в консоль и файл - проверять оба

**Acceptance Criteria**:

- [x] `AC-1` Нет файлов длиннее 200 строк
- [x] `AC-2` В логах нет токена и ПДн

**Test Scenarios**:

- `TS-1` (integration)
  - Given: пройден диалог с тестовым токеном
  - When: grep по логам
  - Then: 0 вхождений токена
  - Verification: manual

## `T029` Полный прогон тестов и ручные сценарии quickstart [US1]

Запустить backend и frontend тесты, пройти сценарии quickstart.md и ручную проверку с телефона

**Context**: Закрытие фичи только после подтверждения владельца (P5)

- **Depends on**: T003, T005, T006, T011, T015, T016, T018, T024, T025, T027, T028
- **Requirements**: FR-001, FR-002, FR-005, FR-009
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Backend** — `cd backend && dotnet test`
2. **Frontend** — `cd frontend && npm test && npx tsc --noEmit && npx playwright test e2e/privacy.spec.ts`
3. **BotFather** — Вручную: /setjoingroups -> Disable, /setcommands: start, cancel
4. **Сценарии** — Пройти specs/007-funnel-bot/quickstart.md и прод-проверку после деплоя; лид приходит во все TELEGRAM_CHAT_IDS и в /admin/messages
5. **Закрытие** — Не закрывать без «добро» владельца

**Technical Notes**:

- `specs/007-funnel-bot/quickstart.md`: Таблица сценариев и прод-шаги
- `.github/workflows`: CI гоняет dotnet test, tsc и jest - должны быть зелёными

**Acceptance Criteria**:

- [x] `AC-1` Все автотесты зелёные
- [x] `AC-2` Сценарии quickstart пройдены
- [x] `AC-3` Реальный бот проходит сценарий с телефона

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: реальный бот на проде
  - When: сценарий пройден с телефона
  - Then: подтверждение получено, лид в Telegram и /admin/messages
  - Verification: manual

