<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Implementation Plan: 009-design-system-seaside

**Branch**: `feature/009-design-system-seaside`

## Summary

Семантические токены paper/ink/sea/ochre/line в tailwind.config (старые primary/secondary/warm остаются только для админки); шрифты Cormorant Garamond + Manrope через next/font с переменными --font-serif/--font-sans; шкала типографики и .prose-measure (max-width 75ch) в globals.css; примитивы components/ui (Button, TextLink, Input, Textarea, Card, Section, Container); MuseumLabel в components/artwork и единый lib/price.ts (formatPrice, priceLabel) вместо двух реализаций; перевод публичных страниц, Navigation, Footer, MobileContactBar на токены и примитивы; jest-гард запрещённых цветовых классов в публичных файлах, тест контраста палитры, e2e на фон/шрифты/скриншоты 1280 и 390.

## Technical Context

- **Language/Version**: TypeScript 5 strict / Next.js 14 App Router, React 18 (только frontend)
- **Primary Dependencies**: Tailwind CSS 3 (theme.extend.colors — новые токены), next/font/google (Cormorant_Garamond, Manrope, subsets latin+cyrillic, display swap), Intl.NumberFormat ru-RU (lib/price.ts), Jest + Testing Library, Playwright (существуют); новых npm-зависимостей нет
- **Storage**: N/A — данные и API не меняются
- **Testing**: Jest (ui-примитивы, MuseumLabel, formatPrice/priceLabel, контраст палитры, гард запрещённых классов по исходникам, Navigation aria-current); Playwright (фон body и font-family, ширина абзаца ≤ 75ch, no-overflow 390, скриншоты главной/галереи/карточки/контактов 1280 и 390)
- **Target Platform**: Linux Docker (mom_site_frontend_prod), браузеры mobile-first
- **Project Type**: web_application
- **Performance Goals**: Не более 2 семейств шрифтов, ≤ 5 начертаний; CLS от шрифтов ≈ 0 (adjustFontFallback next/font); LCP карточки на мобильном ≤ 2,5 с (P8)
- **Constraints**: Админка (app/admin, components/admin, components/blog/admin, MessagesList, AdminPageShell, AdminAuthGuard) визуально не меняется; backend не трогаем; ochre
- **Scale/Scope**: ~430 работ, ~10 публичных страниц, ~35 публичных компонентов с цветовыми классами

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

Только frontend. Токены — frontend/tailwind.config.js; базовые стили и шкала — frontend/app/globals.css; шрифты — frontend/app/layout.tsx. Новые примитивы — frontend/components/ui/*. Этикетка — frontend/components/artwork/MuseumLabel.tsx. Цена — frontend/lib/price.ts (заменяет formatPrice/priceLabel из lib/galleryCard.ts и ArtworkInfoCard). Список публичных путей для гарда — frontend/lib/publicSurface.ts. Перевод страниц app/{page,HomeClientPage,about,gallery,videos,reviews,contacts,blog} и components (Navigation, Footer, ArtworkCarousel, ArtistCredentials, ReviewsList, ExhibitionTimeline, PhoneLink, blog/* кроме admin). Долг 008: SITE_PHONE переносится в lib/site.ts, lib → components зависимость убирается.

**Directories**:

- `frontend/tailwind.config.js`
- `frontend/app/`
- `frontend/app/gallery/`
- `frontend/app/gallery/[slug]/`
- `frontend/app/about/`
- `frontend/app/contacts/`
- `frontend/app/videos/`
- `frontend/app/reviews/`
- `frontend/app/blog/`
- `frontend/components/`
- `frontend/components/ui/`
- `frontend/components/artwork/`
- `frontend/components/blog/`
- `frontend/lib/`
- `frontend/__tests__/`
- `frontend/e2e/`
