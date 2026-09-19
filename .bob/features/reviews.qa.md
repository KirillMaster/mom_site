# QA-процедуры: Отзывы (reviews)

Общие предпосылки:
- Backend поднят локально/на staging, доступен `dotnet test` для `backend/MomSite.Tests`.
- Frontend: команды запускаются из `frontend/`.
- Тесты API — либо через xUnit-интеграционные тесты (предпочтительно, БД PostgreSQL), либо через `curl`/`http` против запущенного API (`http://localhost:5000` или конфигурируемый порт — уточнить в `appsettings.Development.json`).

---

## Slice 1 — Review entity

### @S1-AS1 — сущность валидна, дефолты
1. `cd backend && dotnet ef migrations list --project MomSite.Infrastructure --startup-project MomSite.API` — убедиться, что миграция для Review присутствует и применена (`dotnet ef database update`).
2. xUnit-тест в `MomSite.Tests`: создать `Review { AuthorName="Ольга", Text="Прекрасные работы!", Rating=5 }`, сохранить через `ApplicationDbContext`, `SaveChangesAsync()`.
3. Assert: `Id > 0`, `IsPublished == false`, `CreatedAt` в пределах последних 5 секунд от `DateTime.UtcNow`.
4. `dotnet test --filter FullyQualifiedName~ReviewEntityTests`

### @S1-AS2 — AuthorName обязателен/лимит
1. Тест: `Validator.TryValidateObject` на `Review` с `AuthorName = ""` → ожидать `ValidationResult` с member `AuthorName`.
2. Тест: `AuthorName` длиной 101 символ → тот же результат.
3. `dotnet test --filter FullyQualifiedName~ReviewValidationTests.AuthorName`

### @S1-AS3 — Text обязателен/лимит 2000
1. Аналогично AS2 для `Text = ""` и `Text` длиной 2001 символ.
2. `dotnet test --filter FullyQualifiedName~ReviewValidationTests.Text`

### @S1-AS4 — Rating диапазон 1..5
1. Тест с `Rating = 0` → ValidationResult с member `Rating`.
2. Тест с `Rating = 6` → аналогично.
3. Тест с `Rating = 1` и `Rating = 5` → `IsValid == true`.
4. `dotnet test --filter FullyQualifiedName~ReviewValidationTests.Rating`

### @S1-AS5 — опциональные поля
1. Создать `Review` без `AuthorCity`, `ArtworkId`, `PhotoPath`, но с валидными обязательными полями.
2. Assert: `SaveChangesAsync()` не бросает исключение, запись читается обратно с `AuthorCity == null`.
3. `dotnet test --filter FullyQualifiedName~ReviewEntityTests.OptionalFields`

### @S1-AS6 — FK на Artwork
1. Создать/использовать существующий `Artwork` (seed или `_context.Artworks.Add(...)`).
2. Создать `Review { ArtworkId = artwork.Id }`, сохранить.
3. Загрузить `Review` с `.Include(r => r.Artwork)`, проверить `review.Artwork.Id == artwork.Id`.
4. `dotnet test --filter FullyQualifiedName~ReviewEntityTests.ArtworkRelation`

---

## Slice 2 — Публичные API

Базовый URL для ручных проверок: `$API=http://localhost:5000` (уточнить порт по `launchSettings.json`).

### @S2-AS1 — только опубликованные
1. Seed в тестовой БД: Review "A" (`IsPublished=true, SortOrder=1`), Review "B" (`IsPublished=false, SortOrder=0`).
2. `curl -s $API/api/public/reviews | jq` (или `WebApplicationFactory` интеграционный тест).
3. Assert: в ответе ровно один элемент с `authorName`/содержимым "A"; "B" отсутствует.

### @S2-AS2 — сортировка по SortOrder
1. Seed: "X" (`SortOrder=2`, published), "Y" (`SortOrder=1`, published).
2. GET `/api/public/reviews`.
3. Assert: индекс "Y" в массиве меньше индекса "X".

### @S2-AS3 — пустой список
1. Очистить/использовать БД без опубликованных Review.
2. GET `/api/public/reviews` → `200`, тело `[]`.

### @S2-AS4 — POST создаёт неопубликованный + Telegram
1. `curl -s -X POST $API/api/public/reviews -H "Content-Type: application/json" -d '{"authorName":"Тест","text":"Отличная выставка","rating":5}'`
2. Assert: HTTP `200`/`201`.
3. Проверить в БД: новая запись `IsPublished=false`.
4. Проверить мок/лог `IFeedbackNotifier` (в интеграционном тесте подставить fake-notifier и assert `SendAsync` вызван с данными отзыва) — по аналогии с существующим тестом для ContactMessage, найти его в `MomSite.Tests` (`grep -r "IFeedbackNotifier" backend/MomSite.Tests`) и повторить паттерн.

### @S2-AS5 — пустое AuthorName → 400
1. `curl -i -X POST $API/api/public/reviews -d '{"authorName":"","text":"x","rating":5}' -H "Content-Type: application/json"`
2. Assert: `400`, тело содержит указание на поле `authorName`.
3. Assert в БД: количество Review не увеличилось.

### @S2-AS6 — Rating вне диапазона → 400
1. POST с `rating: 0` → `400`.
2. POST с `rating: 7` → `400`.

### @S2-AS7 — Text длиннее лимита → 400
1. Сгенерировать строку 2001 символ: `python3 -c "print('a'*2001)"` (или `pwsh -c "'a'*2001"`).
2. POST с этим текстом → `400`.

### @S2-AS8 — rate limiting
1. Отправить валидный POST (успех).
2. Немедленно повторить POST с того же IP (в тесте — тот же `HttpClient`/фиксированный `X-Forwarded-For`, либо переиспользовать существующий `IContactRateLimiter` мок/реальную реализацию).
3. Assert: второй ответ `429`.
4. Assert: в БД не появилась вторая запись.
5. Найти существующий тест rate limiting для контактной формы: `grep -r "RateLimiter" backend/MomSite.Tests` — повторить паттерн для reviews.

### @S2-AS9 — без ArtworkId и без фото
1. POST `{"authorName":"Тест","text":"Хорошо","rating":4}` без `artworkId`/`photoPath`.
2. Assert: `200/201`, созданная запись имеет `ArtworkId == null`, `PhotoPath == null`.

---

## Slice 3 — Приватный CRUD / модерация

Используется тот же паттерн авторизации, что у `AdminController`/messages — найти механизм: `grep -rn "Authorize" backend/MomSite.API/Controllers/AdminController.cs`.

### @S3-AS1 — 401 без авторизации
1. `curl -i $API/api/admin/reviews` (без токена/куки).
2. Assert: `401`.

### @S3-AS2 — админ видит все
1. Seed: Review "A" (published), "B" (unpublished).
2. Авторизованный запрос (с валидным токеном/сессией, как в существующих admin-тестах) GET `/api/admin/reviews`.
3. Assert: оба элемента присутствуют.

### @S3-AS3 — публикация
1. Seed неопубликованный Review "B".
2. Авторизованный `PATCH`/`PUT` `/api/admin/reviews/{id}/publish` (или эквивалент, найти реальный маршрут в реализации).
3. Assert: `IsPublished == true`, `PublishedAt != null`.
4. GET `/api/public/reviews` → "B" присутствует.

### @S3-AS4 — снятие с публикации
1. Seed опубликованный Review "A".
2. Авторизованный вызов снятия с публикации.
3. Assert: `IsPublished == false`.
4. GET `/api/public/reviews` → "A" отсутствует.

### @S3-AS5 — редактирование
1. Seed Review "A" с `Text = "старый текст"`.
2. Авторизованный `PUT`/`PATCH` `/api/admin/reviews/{id}` с `{"text":"новый текст"}`.
3. Assert: в БД `Text == "новый текст"`.
4. Если "A" опубликован — GET `/api/public/reviews` отдаёт новый текст.

### @S3-AS6 — удаление
1. Seed Review "C".
2. Авторизованный `DELETE /api/admin/reviews/{id}`.
3. Assert: `204`/`200`.
4. GET `/api/admin/reviews` не содержит "C".

---

## Slice 4 — Публичная страница /reviews + SEO

Запуск: `cd frontend && npm run dev` (или использовать staging URL); Jest/Playwright команды из требований.

### @S4-AS1 — 200 и один h1
1. Playwright: `page.goto('/reviews')`, assert `response.status() === 200`.
2. `await expect(page.locator('h1')).toHaveCount(1)`.

### @S4-AS2 — карточка отзыва
1. Seed через API опубликованный Review (имя "Ольга", город "Москва", rating 4, текст "Очень понравилось").
2. `page.goto('/reviews')`.
3. Assert текстовое содержимое включает "Ольга", "Москва", "Очень понравилось" и дату; assert число закрашенных звёзд = 4 (по `data-testid`/классу звезды, уточнить реализацию).

### @S4-AS3 — ссылка на работу
1. Seed Review с `ArtworkId` существующей работы "Закат над рекой".
2. `page.goto('/reviews')`, assert наличие `<a>` со ссылкой на страницу этой работы.

### @S4-AS4 — без работы, без ошибок
1. Seed Review без `ArtworkId`.
2. `page.goto('/reviews')`, assert отсутствие ссылки на работу для этой карточки, assert отсутствие консольных ошибок (`page.on('console', ...)` фильтр на `error`).

### @S4-AS5 — пустое состояние
1. Убедиться, что опубликованных Review нет (очистить/использовать тестовое окружение).
2. `page.goto('/reviews')`, assert видимое сообщение "отзывов пока нет" (или эквивалент), assert форма отправки видима.

### @S4-AS6 — успешная отправка через форму
1. `page.goto('/reviews')`.
2. Заполнить поля формы (имя, текст, рейтинг), нажать submit.
3. Assert появление сообщения об успехе/модерации.
4. Assert через API `/api/public/reviews`, что новый отзыв НЕ в списке (не опубликован).

### @S4-AS7 — пустое имя в форме
1. Оставить поле имени пустым, заполнить остальное, submit.
2. Assert: клиентская ошибка валидации видна, `fetch`/`XHR` POST не отправлен (проверить через перехват сетевых запросов в Playwright).

### @S4-AS8 — текст длиннее лимита в форме
1. Ввести 2001+ символ в текстовое поле.
2. Submit → assert ошибка валидации, запрос не отправлен.

### @S4-AS9 — ссылки в Header/Footer
1. `page.goto('/')`.
2. Assert `page.locator('header a[href="/reviews"]')` существует.
3. Assert `page.locator('footer a[href="/reviews"]')` существует.

### @S4-AS10 — SEO метаданные
1. `curl -s $FRONTEND/reviews | grep -E "<title>|canonical|meta name=\"description\""`.
2. Assert title/description отличаются от, например, `/gallery` (сравнить через `diff`).
3. Assert `<link rel="canonical" href="https://angelamoiseenko.ru/reviews">`.

### @S4-AS11 — sitemap
1. `curl -s $FRONTEND/sitemap.xml | grep "angelamoiseenko.ru/reviews"`.
2. Assert найдена строка с URL `/reviews`.

### @S4-AS12 — AggregateRating присутствует
1. Убедиться, что есть ≥1 опубликованный Review.
2. `curl -s $FRONTEND/reviews | grep -A5 "AggregateRating"`.
3. Assert JSON-LD содержит `"@type":"AggregateRating"`, корректные `ratingValue`/`reviewCount` (сверить `reviewCount` со значением из API `/api/public/reviews`).
4. Assert для каждого отзыва в HTML присутствует блок JSON-LD `"@type":"Review"` с `author`, `reviewRating`, `reviewBody`, `datePublished`.

### @S4-AS13 — AggregateRating отсутствует при нуле отзывов
1. Обнулить опубликованные Review в тестовом окружении.
2. `curl -s $FRONTEND/reviews | grep "AggregateRating"` → пусто (grep возвращает ненулевой код завершения).

Дополнительно для Slice 4: `npx jest --ci --passWithNoTests --testPathIgnorePatterns='e2e/'` и `npx tsc --noEmit` должны оставаться зелёными (13+ сьютов, без регрессий); после `next build`, `git checkout frontend/tsconfig.json` перед коммитом.

---

## Slice 5 — Админская страница /admin/reviews

### @S5-AS1 — редирект неавторизованных
1. Открыть `/admin/reviews` в приватном/разлогиненном браузерном контексте Playwright.
2. Assert редирект на страницу логина, либо код ответа/UI отказа в доступе (свериться с поведением `/admin/messages`).

### @S5-AS2 — список со статусами
1. Авторизоваться как админ (использовать существующий helper логина, как в тестах `/admin/messages`).
2. Seed Review "A" (published), "B" (unpublished).
3. `page.goto('/admin/reviews')`.
4. Assert оба видимы, у каждого — явный индикатор статуса (текст "Опубликован"/"Черновик" или бейдж).

### @S5-AS3 — публикация через UI
1. На странице списка найти "B", нажать кнопку "Опубликовать".
2. Assert UI обновляет статус без `page.reload()`.
3. Дополнительно проверить через API `/api/admin/reviews/{id}` (или public), что `IsPublished == true`.

### @S5-AS4 — снятие с публикации через UI
1. Найти "A" (published), нажать "Снять с публикации".
2. Assert статус меняется на "не опубликован" в UI.

### @S5-AS5 — редактирование через UI
1. Открыть форму редактирования "A", изменить текст, сохранить.
2. Assert новый текст виден в списке без перезагрузки.

### @S5-AS6 — удаление через UI
1. Найти "C", нажать "Удалить", подтвердить в диалоге/модалке.
2. Assert "C" исчезает из списка.
3. `page.reload()`, assert "C" по-прежнему отсутствует.
