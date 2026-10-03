<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: 010-telegram-bot-cta

**Branch**: `feature/010-bot-cta`

## Summary

Чисто фронтенд: lib/funnelBot.ts (константа + botLink), компонент BotCtaButton на странице работы (в ArtworkInfoCard над ContactChannels), иконка бота в MobileContactBar (проп artworkId), ссылка в ContactsSocialSection и Footer, цель contact_click channel=telegram_bot, e2e bot-cta (только чтение).

## Technical Context

- **Language/Version**: TypeScript 5 strict / Next.js 14
- **Primary Dependencies**: lib/analytics reachGoal (существует), react-icons FaTelegram (существует)
- **Storage**: нет
- **Testing**: Jest (funnelBot, BotCta, Footer, ContactsBotLink); Playwright e2e/bot-cta.spec.ts без кликов наружу
- **Target Platform**: Linux Docker, mobile-first
- **Project Type**: web_application
- **Performance Goals**: без влияния на LCP
- **Constraints**: Минимальные локальные правки (параллельный редизайн 009); бэкенд не меняется
- **Scale/Scope**: 4 страницы/компонента

## Constitution Check

| Principle | Status | Justification |
|---|---|---|
| `P1` | pass | — |
| `P2` | pass | — |
| `P3` | pass | — |
| `P4` | pass | — |
| `P5` | pass | — |
| `P6` | pass | — |
| `P7` | pass | — |
| `P8` | pass | — |
| `P9` | pass | — |
| `P10` | pass | — |

## Project Structure

**Layout**: web_application

frontend/lib/funnelBot.ts(+test); frontend/app/gallery/[slug]/BotCtaButton.tsx, ArtworkInfoCard.tsx, MobileContactBar.tsx, page.tsx; frontend/app/contacts/ContactsSocialSection.tsx; frontend/components/Footer.tsx; frontend/e2e/bot-cta.spec.ts

**Directories**:

- `frontend/lib/`
- `frontend/app/gallery/[slug]/`
- `frontend/app/contacts/`
- `frontend/components/`
- `frontend/e2e/`
