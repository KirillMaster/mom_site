<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Feature Specification: Кнопка «Спросить в Telegram» (публичный бот)

**Branch**: `feature/010-bot-cta` | **Created**: 2026-10-03 | **Status**: InReview

**Input**: Публичный бот @angela_moiseenko_bot (007-funnel-bot) принимает deep-link start=art_<id> и показывает фото работы. Добавить на страницу работы отдельную заметную кнопку «Спросить в Telegram» в бота (личный Telegram мамы остаётся обычным каналом), путь в бота на мобильной панели, ссылку на бота в /contacts и футере. Username бота — константа с env-override. Вне скоупа: изменения бота, редизайн (009).

## User Scenarios & Testing

### User Story 1 - Покупатель спрашивает о работе через бота (Priority: P1)

На странице работы рядом с каналами есть заметная кнопка «Спросить в Telegram», ведущая в бота с параметром art_<id>; на мобильной нижней панели — компактная иконка-кнопка в бота. Личный Telegram остаётся в списке каналов.

**Why this priority**: Страница работы — главная точка конверсии.

**Motivation**:
- **Problem**: Личный Telegram требует писать «с нуля»; бот сам показывает работу и собирает заявку.
- **Value**: Меньше трения и готовая заявка с привязкой к работе и целью «Купить».
- **Consequence if skipped**: Бот не получает трафик со страниц работ.

**Independent Test**: Открыть /gallery/<slug>: видна кнопка «Спросить в Telegram» с href .../angela_moiseenko_bot?start=art_<id> и рядом личный Telegram; на 390 px в нижней панели есть иконка бота.

**Acceptance Scenarios**:

1. **Given** Страница работы с id 7, **When** Страница отрисована, **Then** Есть ссылка «Спросить в Telegram» на https://t.me/angela_moiseenko_bot?start=art_7 с target=_blank и rel=noopener; личный канал «Написать в Telegram» тоже на месте
2. **Given** Мобильная ширина, **When** Видна нижняя панель, **Then** В ней есть иконка-ссылка в бота (accessible name «Спросить в Telegram»), кнопки «Написать» и «Позвонить» не изменены
3. **Given** Страница отрисована, **When** Пользователь кликает по кнопке бота, **Then** Отправляется цель contact_click с channel=telegram_bot и названием работы

**Acceptance Criteria**:

- [x] `AC-1` Кнопка бота отдельна и заметна, личный Telegram не удалён
- [x] `AC-2` Мобильная панель содержит путь в бота, горизонтального скролла на 390 px нет

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Страница работы
  - When: Рендер
  - Then: Кнопка бота с art_<id> и личный Telegram присутствуют
  - Verification: automated
- `TS-2` (unit)
  - Given: Мобильная панель
  - When: Рендер и клик
  - Then: Ссылка в бота есть и шлёт цель
  - Verification: automated

### User Story 2 - Посетитель находит бота в контактах и футере (Priority: P2)

На /contacts и в футере есть ссылка на бота без привязки к работе (start=site); бот трактует неизвестный payload как кампанию и запускает полный сценарий.

**Why this priority**: Дополняет US1, меньший трафик.

**Motivation**:
- **Problem**: Вне страницы работы о боте не узнать.
- **Value**: Дополнительный канал обращений с любой страницы.
- **Consequence if skipped**: Бот виден только на работах.

**Independent Test**: На /contacts и в футере найти ссылку на бота с ?start=site.

**Acceptance Scenarios**:

1. **Given** Страница /contacts, **When** Отрисована секция соцсетей, **Then** Есть ссылка «Telegram-бот» на https://t.me/angela_moiseenko_bot?start=site рядом с личным Telegram
2. **Given** Любая страница, **When** Отрисован футер, **Then** В колонке «Контакты» есть ссылка «Бот в Telegram» на тот же адрес

**Acceptance Criteria**:

- [x] `AC-1` Ссылки есть на /contacts и в футере и открываются в новой вкладке

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Футер и контакты
  - When: Рендер
  - Then: Ссылки на бота с start=site присутствуют
  - Verification: automated


## Edge Cases

- `EC-1` Задан NEXT_PUBLIC_FUNNEL_BOT_USERNAME → Все ссылки строятся с этим username
- `EC-2` Фото с выставки (нет каналов связи) → Кнопка бота не показывается вместе с остальными каналами
- `EC-3` Payload site неизвестен боту → StartPayloadParser возвращает Campaign, запускается полный сценарий

## Functional Requirements

- **FR-001**: The page of an artwork MUST show a separate button «Спросить в Telegram» linking to https://t.me/<bot>?start=art_<artworkId>, opening in a new tab with rel noopener, keeping the personal Telegram channel. (stories: US1)
- **FR-002**: The mobile contact bar MUST include a compact link to the bot with accessible name «Спросить в Telegram» without removing existing buttons. (stories: US1)
- **FR-003**: WHEN a bot link is clicked the system MUST send the ContactClick goal with channel telegram_bot and the artwork title. (stories: US1)
- **FR-004**: The /contacts page and the footer MUST link to the bot with start=site. (stories: US2)
- **FR-005**: The bot username MUST be a single constant in frontend/lib/funnelBot.ts overridable via NEXT_PUBLIC_FUNNEL_BOT_USERNAME, exposed through botLink(payload?). (stories: US1, US2)
- **FR-006**: The change MUST NOT cause horizontal scroll at 390 px. (stories: US1)

## Key Entities

- **Ссылка на бота (botLink)** (`E-1`): URL https://t.me/<username>[?start=<payload>]; payload art_<id> или site

## Success Criteria

- **SC-001**: Появляются заявки из бота с привязкой к работе (payload art_<id>) (measured via: Цель contact_click channel=telegram_bot в Метрике и заявки бота)
- **SC-002**: Jest, tsc и e2e bot-cta проходят (measured via: CI)

## Assumptions

- `A-1` Бот @angela_moiseenko_bot запущен и поддерживает art_<id>; неизвестный payload даёт полный сценарий (StartPayload.cs)
- `A-2` Правки минимальны и локальны, чтобы не конфликтовать с редизайном 009
