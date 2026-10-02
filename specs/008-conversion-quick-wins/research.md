# Research: 008-conversion-quick-wins

## R1. Поля характеристик Artwork
- **Decision**: подмножество data-model 005 — `Status` (enum, хранится int, default Available), `WidthCm`, `HeightCm` (int?, 1–1000), `Year` (int?, 1950–текущий), `Support`, `Technique` (string? ≤ 100). Миграция `AddArtworkCatalogFields`; при апгрейде `Status = IsForSale ? Available : NotForSale` (A-2).
- **Rationale**: 005 позже добавит остальные поля (ShortDescription, IsFeatured, NeedsReshoot, IsPublished) отдельной миграцией без конфликта имён/типов.
- **Alternatives**: реализовать 005 целиком — тянет импорт xlsx, раздувает скоуп; свои имена полей — конфликт с 005.

## R2. IsForSale vs Status
- **Decision**: колонка IsForSale остаётся; при Create/Update сервер выставляет `IsForSale = Status == Available`. Админка редактирует только Status.
- **Rationale**: публичные DTO, фильтры, sitemap и blog уже читают IsForSale — обратная совместимость без каскада правок.
- **Alternatives**: computed-свойство без колонки — ломает существующие LINQ-запросы к БД.

## R3. Контакт без email
- **Decision**: `ContactMessage.Email` nullable, новое `Phone` (≤ 100, без строгого формата — может быть @ник в мессенджере). `ContactMessageDto : IValidatableObject` — ошибка, если оба пусты. `[EmailAddress]` проверяется только при непустом значении. Миграция `AddContactPhone`.
- **Rationale**: телефон/мессенджер — основной канал покупателей картин; ASP.NET автоматически вернёт 400 ValidationProblem.
- **Alternatives**: отдельный endpoint — дублирование rate-limit и honeypot.

## R4. Предзаполненные сообщения мессенджеров
- **Decision**: `lib/contactChannels.ts`: `buildPrefilledMessage(title, url)` → «Здравствуйте! Интересует картина «<title>» <url>»; WhatsApp — `https://wa.me/<digits>?text=<enc>`; Telegram — ссылка из socialLinks (A-4, без text: Telegram не поддерживает text для чата пользователя); MAX — `maxProfileUrl`; телефон — `tel:`. Канал без ссылки не рендерится.
- **Rationale**: wa.me — единственный канал с надёжным text-параметром; остальные — открывают чат, текст копируется в буфер при клике (fallback).
- **Alternatives**: deep-link `tg://msg` — не работает на десктопе без клиента.

## R5. Пагинация галереи
- **Decision**: клиентский срез `visible = filtered.slice(0, page*24)`, кнопка «Показать ещё»; сброс страницы при смене категории; первые 4 превью eager, остальные `loading="lazy" decoding="async"`.
- **Rationale**: данные уже приходят целиком через ISR (A-5), ~300 работ — серверная пагинация преждевременна; SEO-список работ остаётся в JSON-LD.
- **Alternatives**: infinite scroll — хуже для футера/контактов и доступности.

## R6. Overflow на мобильных
- **Decision**: на /about убрать вылет декоративного элемента (`-right-6` → внутри контейнера / `overflow-hidden` у обёртки). E2E: на 390 px для каждой публичной страницы `document.documentElement.scrollWidth <= clientWidth`.
- **Rationale**: регрессионная защита для всех страниц.

## R7. Нормализация названий
- **Decision**: `normalizeTitle(raw)` — trim, снимает одну пару обрамляющих кавычек любого типа (`"…"`, `«…»`, `„…“`, `“…”`); в заголовках карточки выводится как «normalized». Данные в БД не меняются.
- **Rationale**: безопасно для slug и SEO; правка в одном месте.

## R8. Мобильная панель
- **Decision**: `MobileContactBar` — `fixed bottom-0` только `< md`, две кнопки «Написать» (WhatsApp или Telegram, что есть) и «Позвонить»; у страницы `pb-20 md:pb-0`, чтобы панель не перекрывала футер. Учитывает `env(safe-area-inset-bottom)`.
