# Research: 009-design-system-seaside

## R1. Контраст палитры (WCAG 2.1)
- Decision: ink #1F2328 / paper #F7F6F3 ≈ 14.8:1; sea #2F4A5C / paper ≈ 8.6:1; белый / sea ≈ 9.3:1 — AA. Ochre #B8862F / paper ≈ 3.0:1 — **не проходит** для текста. Для текста цены/статуса — ochre-700 #8A6420 (≈ 4.9:1); #B8862F — линии, маркеры, крупный декор.
- Rationale: FR-003 требует ≥ 4.5:1; оттенок той же охры сохраняет характер.
- Alternatives: охра полужирным 18px+ (3:1 для large text) — отвергнуто, цена в этикетке мелкая.

## R2. Токены и админка
- Decision: добавить `paper, ink, sea, ochre, line` (с оттенками 50–900 у sea/ochre/ink) в `theme.extend.colors`; `primary/secondary/warm` оставить в конфиге для админки (A-2). Публичная часть их не использует — проверяет jest-гард.
- Alternatives: удалить старые цвета и перекрасить админку — вне скоупа.

## R3. Гард запрещённых классов
- Decision: jest-тест читает публичные файлы (список в `lib/publicSurface.ts`: app/** кроме app/admin, components/** кроме admin/, blog/admin/, MessagesList, AdminPageShell, AdminAuthGuard) и ищет `\b(bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|shadow|divide|placeholder)-(primary|secondary|warm|purple|indigo|blue|violet|fuchsia|orange)-` и `bg-gradient-`/`gradient-bg`/`text-gradient`.
- Rationale: дёшево, работает в CI, ловит регресс (FR-013).

## R4. Шрифты
- Decision: `Cormorant_Garamond({weight:['500','600'], style:['normal','italic'], subsets:['latin','cyrillic'], variable:'--font-serif'})`, `Manrope({weight:['400','500','600'], subsets:['latin','cyrillic'], variable:'--font-sans'})`; Tailwind fontFamily serif/sans на переменные. Курсив Cormorant нужен для названия в этикетке.

## R5. Шкала типографики
- Decision: в globals.css `@layer base` — h1 `text-4xl md:text-5xl`, h2 `text-3xl md:text-4xl`, h3 `text-2xl`, h4 `text-xl`, font-serif weight 500, leading-tight; body 16px/1.65; `.caption` 14px; `.prose-measure { max-width: 75ch }`.

## R6. Цена
- Decision: `lib/price.ts` — `formatPrice(n)` через `Intl.NumberFormat('ru-RU',{maximumFractionDigits:0})` + ` ₽` (как galleryCard); `priceLabel(artwork, exhibition)` переносится туда же; ArtworkInfoCard использует их. Пробел-разделитель от Intl — неразрывный U+00A0 (A-5), тесты нормализуют.

## R7. Анимации
- Decision: существующие rise-in/scroll-анимации оборачиваются `@media (prefers-reduced-motion: reduce) { animation: none }` (EC-4).
