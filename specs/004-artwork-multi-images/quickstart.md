# Quickstart — 004

## Prereqs
`docker compose up -d postgres`, backend `dotnet run --project backend/MomSite.API`, frontend `npm run dev` (frontend/).

## Автотесты
- `dotnet test backend/MomSite.Tests` — C-1..C-5, миграция (E-1/E-2).
- `cd frontend && npx jest` — галерея страницы работы, бейдж, админ-менеджер фото.
- `npx playwright test e2e/artwork-images.spec.ts`.

## Ручная проверка
1. Админка → новая работа, выбрать 3 файла → сохранить → в списке бейдж «📷 3».
2. Редактирование: перетащить 3-е фото первым → обложка в сетке /gallery сменилась (C-3).
3. Удалить фото → осталось 2; удаление последнего невозможно (C-2).
4. Загрузить 11-е фото → ошибка лимита (C-1).
5. `/gallery/<slug>` десктоп: миниатюры переключают фото, клик → лайтбокс, ←/→ листают.
6. Мобайл (DevTools 390px): свайп, точки, без миниатюр.
7. `curl /gallery/<slug>` → все `<img>` в HTML, JSON-LD `image` — массив.
8. Старая работа (из миграции) — одно фото, вид как раньше.
