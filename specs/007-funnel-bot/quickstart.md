# Quickstart: проверка 007-funnel-bot

Ссылки на контракты — `contracts.yaml` (id), сущности — `data-model.yaml` (id).

## Предусловия
- `FUNNEL_BOT_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_IDS` — в локальном `.env` (gitignore) / серверном `/root/mom_site/.env`. В репозиторий не попадают.
- `docker-compose.prod.yml`: в env api добавлена строка `FUNNEL_BOT_TOKEN=${FUNNEL_BOT_TOKEN}`.
- BotFather для @angela_moiseenko_bot: `/setjoingroups → Disable`, `/setcommands`: `start`, `cancel`.
- Локальная БД (docker compose dev) с применённой миграцией `contact-message`.

## Автотесты
```bash
cd backend && dotnet test --filter "FullyQualifiedName~TelegramBot|FullyQualifiedName~LeadService|FullyQualifiedName~PublicController"
cd frontend && npm test -- privacy && npx tsc --noEmit && npx playwright test e2e/privacy.spec.ts
```
Ожидается: все зелёные; тесты `public-contact-message` (регрессия формы) проходят без изменений.

## Сценарии

| # | Шаги | Ожидаемо | Контракт |
|---|---|---|---|
| 1 | Без `FUNNEL_BOT_TOKEN` запустить api | Старт без ошибок, в логе «funnel bot disabled», polling не идёт | `bot-api-client` |
| 2 | С токеном: `/start` в личке боту, пройти «Купить картину → бюджет → Поделиться номером → Да, это я» | «Спасибо…»; в `/admin/messages` новое сообщение `Telegram-бот: Купить картину`, Email пуст, Phone заполнен; в mom_site_bot уведомление с «Телефон» и «Telegram» | `funnel-dialog`, `lead-service`, `telegram-notifier` |
| 3 | `https://t.me/angela_moiseenko_bot?start=art_<id опубликованной>` | Фото + название работы, цель «Купить», в лиде ссылка на работу | `funnel-dialog` |
| 4 | `?start=art_999999`, `?start=mk`, `?start=promo_vk` | Полный сценарий; цель «Мастер-класс»; `UtmCampaign=promo_vk` | `funnel-dialog` |
| 5 | На каждом шаге «Назад», затем `/cancel` | Возврат на шаг назад; сброс | `funnel-dialog` |
| 6 | Отправить стикер/голос; затем произвольный текст вне сценария | Подсказка; текст сохраняется как лид «Другой вопрос» | `funnel-dialog` |
| 7 | 4 лида подряд от одного пользователя | 4-й — вежливый отказ, лида нет | `lead-quota` |
| 8 | Добавить бота в группу | Нельзя (BotFather) / апдейты из группы игнорируются | `bot-api-client` |
| 9 | Перезапустить api посреди диалога, написать боту | Бот начинает заново, не падает | `funnel-state` |
| 10 | Форма на `/contacts` | Работает как раньше, уведомление приходит | `public-contact-message` |
| 11 | Открыть `/privacy` без записи в PageContent | SSR-страница с шаблоном и реквизитами; ссылка в футере, под формой, в шаге «Контакт» бота; есть в `/sitemap.xml` | `public-privacy` |
| 12 | В `/admin/pages` создать `privacy/body`, обновить `/privacy` | Показан текст из админки и дата редакции | `public-privacy`, `page-content-privacy` |
| 13 | `docker logs mom_site_api_prod \| grep -c "bot[0-9]*:"` | `0` — токен в логах не встречается | P4 |

## Прод (после merge и деплоя)
1. `FUNNEL_BOT_TOKEN` уже в серверном `.env` и GitHub secret.
2. Пройти сценарий 2 с телефона; убедиться, что лид пришёл в оба `TELEGRAM_CHAT_IDS`.
3. Закрытие задачи — после «добро» пользователя (P5).
