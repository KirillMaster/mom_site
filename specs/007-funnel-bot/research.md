# Research: 007-funnel-bot

Входные решения — `design-notes.md` (D1–D7). NEEDS CLARIFICATION в `plan.yaml` нет.

## R1. Приём апдейтов: long polling vs webhook (D1)
- **Decision**: `getUpdates` (timeout 50 с, `allowed_updates=["message","callback_query"]`) в `BackgroundService` api-контейнера; регистрируется только при непустом `FUNNEL_BOT_TOKEN`. На старте — `deleteWebhook` не вызываем (webhook не настраивался), offset хранится в памяти (`last_update_id + 1`).
- **Rationale**: нет нового публичного маршрута в nginx и секрета webhook; один экземпляр api (A-6). Перезапуск безопасен: неподтверждённые апдейты Telegram отдаст повторно.
- **Alternatives**: webhook через nginx — лишняя поверхность атаки и настройка TLS-маршрута; отдельный контейнер-бот — лишний деплой ради десятков диалогов в день.

## R2. Хранение лида (D2)
- **Decision**: переиспользуем `ContactMessage`. Миграция: `Email` → nullable; новые nullable `Phone` (≤ 32), `TelegramUsername` (≤ 64), `TelegramUserId` (bigint). `ContactMessageDto` формы сайта не меняется — email там остаётся обязательным.
- **Rationale**: лиды из бота сразу видны в `/admin/messages` и счётчике непрочитанных, без новой таблицы и UI.
- **Alternatives**: отдельная таблица `BotLead` — дубль функционала (запрещено правилом «не дублировать»); пустая строка в Email — ломает семантику и возможный экспорт.

## R3. Общий сервис лидов
- **Decision**: `ILeadService.SubmitAsync(ContactMessage, ct)` в Core, реализация `LeadService` в Infrastructure: сохранить → `foreach IFeedbackNotifier where IsEnabled → NotifyAsync` (ошибки notifier'ов логируются, не пробрасываются). `PublicController.SendContactMessage` вызывает его вместо своих приватных методов; rate-limit и honeypot остаются в контроллере.
- **Rationale**: единый путь доставки (US2, FR — тот же механизм уведомлений); регрессия формы покрывается существующими тестами.
- **Alternatives**: копия логики в боте — дублирование.

## R4. Состояние диалога (D3)
- **Decision**: `IMemoryCache`, ключ `funnel:{chatId}`, sliding TTL 24 ч; значение — неизменяемый record `FunnelState`.
- **Rationale**: MVP; при рестарте теряется только незавершённый диалог (EC-3) — бот отвечает на любое сообщение стартом заново.
- **Alternatives**: таблица в БД — позже, если появится несколько экземпляров.

## R5. Клиент Bot API (D4)
- **Decision**: свой `TelegramBotClient` на именованном `HttpClient` (`FunnelBot`), base address `https://api.telegram.org/bot{token}/`; методы `GetUpdatesAsync`, `SendMessageAsync` (inline/reply keyboard, `request_contact`, `remove_keyboard`), `SendPhotoAsync` (URL фото работы), `AnswerCallbackQueryAsync`. DTO через `System.Text.Json` (snake_case), только нужные поля. HttpClient timeout 60 с (> long-poll 50 с).
- **Rationale**: 4 метода — пакет Telegram.Bot избыточен; `TelegramNotifier` уже ходит в Bot API тем же способом.
- **Alternatives**: NuGet Telegram.Bot — +зависимость, частые breaking changes.

## R6. Безопасность и анти-спам (D5, D6, D7)
- **Decision**: обрабатываем только `chat.type == "private"`; BotFather `/setjoingroups → Disable` (ручной шаг в quickstart). Лимиты в памяти: ≤ 3 лида на `TelegramUserId` за скользящие 24 ч (4-й — вежливый отказ «уже передали Анжеле, она ответит»), ≤ 1 исходящее сообщение/с на чат. Логгер `System.Net.Http.HttpClient` → Warning (уже сделано), в своих логах — только `chatId`, без текста/телефона.
- **Rationale**: защита мамы от спама; токен в URL не попадает в логи (P4).
- **Alternatives**: капча — избыточно для MVP.

## R7. Конечный автомат диалога
- **Decision**: `FunnelDialog.Handle(FunnelState?, BotInput, FunnelContext) → FunnelResult(State?, Replies[], Lead?)` — чистая функция без I/O; `FunnelPollingService` только переводит апдейты в `BotInput`, вызывает автомат и исполняет `Replies`/`Lead`. Шаги: `Goal → Detail → Theme? → Budget? → Contact → Name → Done`; «Назад» = pop из стека шагов; `/cancel` = сброс; `/start <payload>` = сброс + контекст.
- **Rationale**: каждая ветка покрывается unit-тестами без моков (P5), файлы ≤ 200 строк (P3).

## R8. Deep-link payload
- **Decision**: `art_<int>` → `GET` работы через существующий `ApplicationDbContext` (только опубликованные); не найдена → полный сценарий без контекста. `mk`, `interior` → предустановленная цель. Иное (`[A-Za-z0-9_-]{1,64}`) → `UtmCampaign`, полный сценарий. `UtmSource=telegram_bot`.

## R9. /privacy
- **Decision**: новый `GET /api/public/privacy` (по образцу `about`/`contacts`) читает `PageContent` с `PageKey=privacy, ContentKey=body`; если записи нет — отдаёт `null`, фронт показывает встроенный шаблон политики с реквизитами (A-1). Правка — существующий `/admin/pages` (`POST/PUT admin/page-content`). Страница — SSR (`app/privacy/page.tsx`, `revalidate`), `generateMetadata`, в `sitemap.ts`; ссылки — футер, строка согласия под формой контактов, шаг 4 бота.
- **Alternatives**: статичный текст только во фронте — нельзя править из админки (P9).
