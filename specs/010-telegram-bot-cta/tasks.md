<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: 010-telegram-bot-cta

## `T001` botLink и константа [US1]

lib/funnelBot.ts: FUNNEL_BOT_USERNAME (env override), botLink(payload?), artworkBotLink(id)

**Context**: Фича 010

- **Depends on**: —
- **Requirements**: FR-005
- **Entities**: E-1
- **Contracts**: —

**Steps**:

1. **Тесты** — Сначала jest-тесты
2. **Реализовать** — lib/funnelBot.ts: FUNNEL_BOT_USERNAME (env override), botLink(payload?), artworkBotLink(id)

**Technical Notes**:

- `frontend/lib/funnelBot.ts`: минимальная правка

**Acceptance Criteria**:

- [x] `AC-1` Тесты зелёные, tsc без ошибок

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Компонент отрисован
  - When: Рендер
  - Then: Ожидаемые ссылки присутствуют
  - Verification: automated

## `T002` Кнопка бота на странице работы [US1]

BotCtaButton + подключение в ArtworkInfoCard; цель telegram_bot

**Context**: Фича 010

- **Depends on**: T001
- **Requirements**: FR-001, FR-003
- **Entities**: E-1
- **Contracts**: —

**Steps**:

1. **Тесты** — Сначала jest-тесты
2. **Реализовать** — BotCtaButton + подключение в ArtworkInfoCard; цель telegram_bot

**Technical Notes**:

- `frontend/app/gallery/[slug]/BotCtaButton.tsx`: минимальная правка
- `frontend/app/gallery/[slug]/ArtworkInfoCard.tsx`: минимальная правка

**Acceptance Criteria**:

- [x] `AC-1` Тесты зелёные, tsc без ошибок

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Компонент отрисован
  - When: Рендер
  - Then: Ожидаемые ссылки присутствуют
  - Verification: automated

## `T003` Иконка бота в мобильной панели [US1]

MobileContactBar: проп artworkId, компактная иконка-ссылка; page.tsx передаёт id

**Context**: Фича 010

- **Depends on**: T001
- **Requirements**: FR-002, FR-003, FR-006
- **Entities**: E-1
- **Contracts**: —

**Steps**:

1. **Тесты** — Сначала jest-тесты
2. **Реализовать** — MobileContactBar: проп artworkId, компактная иконка-ссылка; page.tsx передаёт id

**Technical Notes**:

- `frontend/app/gallery/[slug]/MobileContactBar.tsx`: минимальная правка
- `frontend/app/gallery/[slug]/page.tsx`: минимальная правка

**Acceptance Criteria**:

- [x] `AC-1` Тесты зелёные, tsc без ошибок

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Компонент отрисован
  - When: Рендер
  - Then: Ожидаемые ссылки присутствуют
  - Verification: automated

## `T004` Ссылка в /contacts и футере [US2]

ContactsSocialSection и Footer: ссылка botLink('site')

**Context**: Фича 010

- **Depends on**: T001
- **Requirements**: FR-004
- **Entities**: E-1
- **Contracts**: —

**Steps**:

1. **Тесты** — Сначала jest-тесты
2. **Реализовать** — ContactsSocialSection и Footer: ссылка botLink('site')

**Technical Notes**:

- `frontend/app/contacts/ContactsSocialSection.tsx`: минимальная правка
- `frontend/components/Footer.tsx`: минимальная правка

**Acceptance Criteria**:

- [x] `AC-1` Тесты зелёные, tsc без ошибок

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Компонент отрисован
  - When: Рендер
  - Then: Ожидаемые ссылки присутствуют
  - Verification: automated

## `T005` e2e bot-cta [US2]

e2e/bot-cta.spec.ts: только goto и проверка href, без кликов наружу

**Context**: Фича 010

- **Depends on**: T002, T003, T004
- **Requirements**: FR-001, FR-004, FR-006
- **Entities**: E-1
- **Contracts**: —

**Steps**:

1. **Тесты** — Сначала jest-тесты
2. **Реализовать** — e2e/bot-cta.spec.ts: только goto и проверка href, без кликов наружу

**Technical Notes**:

- `frontend/e2e/bot-cta.spec.ts`: минимальная правка

**Acceptance Criteria**:

- [x] `AC-1` Тесты зелёные, tsc без ошибок

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Компонент отрисован
  - When: Рендер
  - Then: Ожидаемые ссылки присутствуют
  - Verification: automated

