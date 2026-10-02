# QA-процедуры: Несколько фото работы (artwork-images)

Общие предпосылки:
- Backend: `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj --filter "<фильтр>"` из корня репозитория. Тесты Coder-а называются по сценарию (имя теста/класса содержит id сценария, например `US1_BE1`); если фильтра по id нет — запускать по классу ниже.
- Frontend: из `frontend/`: `npx jest <файл> -t "<id сценария>"`; E2E: `npx playwright test e2e/artwork-images.spec.ts -g "<id>"`.
- Ожидаемые классы тестов: `ArtworkImageMigrationTests`, `ArtworkImageServiceTests`, `ArtworkImagesEndpointsTests`, `ArtworkDtoImagesTests` (backend); `__tests__/artworkImagesApi.test.ts`, `__tests__/ArtworkImagesManager.test.tsx`, `__tests__/ArtworkGallery.test.tsx`, `__tests__/ArtworkCard.test.tsx` (frontend).
- Для ручных curl: API на `http://localhost:5000`; токен: `TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"<admin>","password":"<pwd>"}' | jq -r .token)` (логин/маршрут уточнить в AuthController и `.env`).
- Критерий прохождения сценария: все выбранные тесты зелёные И в выводе тесты реально выполнены (не 0 прогнано, не пропущены). Все `dotnet test`/`jest` — exit code 0.

---

## Slice 1 — Backend + типы/клиент

### @US1-EC1 — миграция переносит существующие работы
1. `cd backend && dotnet ef migrations list --project MomSite.Infrastructure --startup-project MomSite.API` — миграция ArtworkImage присутствует.
2. `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj --filter "FullyQualifiedName~ArtworkImageMigrationTests"`
3. Assert (в тесте): после миграции для каждой работы `COUNT(ArtworkImages)=1`, `SortOrder=0`, пути равны прежним `ImagePath/ThumbnailPath`.
4. Ручная проверка SQL на копии БД: `SELECT a."Id" FROM "Artworks" a LEFT JOIN "ArtworkImages" i ON i."ArtworkId"=a."Id" GROUP BY a."Id" HAVING COUNT(i."Id")<>1;` — 0 строк.

### @US1-BE1 — мультизагрузка добавляет в конец
1. `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_BE1"`
2. Ручной контроль: `curl -s -X POST http://localhost:5000/api/admin/artworks/$ID/images -H "Authorization: Bearer $TOKEN" -F "Images=@a.jpg" -F "Images=@b.jpg" -F "Images=@c.jpg" | jq '.images | map(.sortOrder)'` → `[0,1,2,3]`.
3. Assert: HTTP 200; `GET /api/admin/artworks` — `imagePath` работы не изменился.

### @US1-BE2 — порядок сохраняется
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_BE2"`
2. curl: `curl -s -X PUT http://localhost:5000/api/admin/artworks/$ID/images/order -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"imageIds":[4,2,3,1]}' | jq '.images | map(.id)'` → `[4,2,3,1]`; повторный `GET /api/admin/artworks` даёт тот же порядок.

### @US1-BE3 — первое фото = обложка
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImageServiceTests&FullyQualifiedName~US1_BE3"`
2. Assert: после PUT order с третьим фото первым `Artwork.ImagePath == images[0].ImagePath`, `ThumbnailPath == images[0].ThumbnailPath`; `GET /api/public/gallery` отдаёт этот `imagePath`; sitemap-генерация использует его (`curl -s http://localhost:3000/sitemap.xml | grep <путь>`).

### @US1-BE4 — удаление не-обложки
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_BE4"`
2. Assert: 200, `sortOrder` = `[0,1,2]`, мок хранилища получил `DeleteImage` ровно для удалённого фото (оригинал и миниатюра), `imagePath` работы не изменился.

### @US1-EC2 — удаление обложки
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImageServiceTests&FullyQualifiedName~US1_EC2"`
2. Assert: бывшее второе фото имеет `SortOrder=0`, `Artwork.ImagePath/ThumbnailPath` равны его путям.

### @US1-BE5 — лимит 10
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_BE5"`
2. Assert: 400, `message` на русском содержит "10"; число фото = 10; хранилище не получило новых загрузок.

### @US1-EC3 — последнее фото
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_EC3"`
2. Assert: 400, `message == "У работы должно быть хотя бы одно фото"`, запись и файлы не удалены.

### @US1-EC4 — недопустимые файлы
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_EC4"`
2. Все 4 примера Outline (текст вместо картинки, > 15 МБ, пустой список, валидный + невалидный): 400 с русским `message`, число фото неизменно (атомарность пакета).
3. Ручной контроль: `curl -s -o /dev/null -w "%{http_code}" -X POST .../images -H "Authorization: Bearer $TOKEN" -F "Images=@note.txt;type=text/plain"` → `400`.

### @US1-EC5 — некорректный набор id порядка
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_EC5"`
2. Все 4 примера: чужой id, несуществующий, неполный набор, дубликат → 400; порядок и `ImagePath` работы A не изменены.

### @US1-EC6 — удаление работы
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_EC6"`
2. Assert: после `DELETE /api/admin/artworks/{id}` в БД нет `ArtworkImage` этой работы; мок S3 получил `DeleteImage` для всех 3 фото (оригиналы и миниатюры).

### @US1-EC7 — Create и Update
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_EC7"`
2. Assert: после Create — ровно 1 `ArtworkImage` (SortOrder 0 == ImagePath работы); после Update с новым Image — по-прежнему 1 фото на SortOrder 0 с новым путём, старые файлы удалены, `ImagePath` синхронизирован.

### @US1-BE6 — 401 без JWT
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_BE6"`
2. curl для всех трёх: `for m in "POST images" "DELETE images/1" "PUT images/order"; do set -- $m; curl -s -o /dev/null -w "%{http_code}\n" -X $1 http://localhost:5000/api/admin/artworks/1/$2; done` → `401` ×3.

### @US1-BE7 — 404
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkImagesEndpointsTests&FullyQualifiedName~US1_BE7"`
2. Assert: несуществующая работа → 404 для POST/PUT; DELETE с imageId чужой работы → 404 и чужое фото в БД на месте.

### @US2-BE1 — images[] в DTO
1. `dotnet test ... --filter "FullyQualifiedName~ArtworkDtoImagesTests"`
2. curl: `curl -s http://localhost:5000/api/public/gallery | jq '.[0].images'` (и `/api/public/home`, с токеном `/api/admin/artworks`) — массив по возрастанию `sortOrder`, у каждого поля `id, imagePath, thumbnailPath, sortOrder`; `[0].imagePath == .imagePath` работы.
3. Fallback: тест с работой без ArtworkImage → `images` из одного элемента, собранного из `imagePath/thumbnailPath`.

### @US1-FE1 — типы и API-клиент
1. `cd frontend && npx jest __tests__/artworkImagesApi.test.ts`
2. Assert: FormData содержит ключ `Images` для каждого файла; reorder шлёт `{imageIds:[...]}`; delete бьёт в `/images/{imageId}`; возвращается `ArtworkImage[]`.
3. `cd frontend && npx tsc --noEmit` — exit 0 (strict, поле `Artwork.images` существует).

---

## Slice 2 — Админка

### @US1-AS1 — мультизагрузка
1. `cd frontend && npx jest __tests__/ArtworkImagesManager.test.tsx -t "US1-AS1"` — выбор 3 файлов: 3 превью (object URL) до сохранения; при сохранении вызван `uploadArtworkImages` с 3 файлами в порядке выбора.
2. E2E: `cd frontend && npx playwright test e2e/artwork-images.spec.ts -g "US1-AS1"` — логин, редактирование работы с 1 фото, `setInputFiles` 3 файла, превью видны, Save, после перезагрузки 4 фото, обложка прежняя.

### @US1-AS2 — смена порядка
1. `npx jest __tests__/ArtworkImagesManager.test.tsx -t "US1-AS2"` — drag-and-drop (или эквивалентный move) вызывает `reorderArtworkImages` с новым списком id.
2. E2E: `npx playwright test e2e/artwork-images.spec.ts -g "US1-AS2"` — после перезагрузки порядок сохранён, на `/gallery/<slug>` фото в новом порядке.

### @US1-AS3 — «Сделать обложкой»
1. `npx jest __tests__/ArtworkImagesManager.test.tsx -t "US1-AS3"` — клик у третьего фото: вызван `reorderArtworkImages` с этим id первым, бейдж «Обложка» на нём.
2. E2E: `-g "US1-AS3"` — на `/gallery` у карточки именно это фото.

### @US1-AS4 — удаление с подтверждением
1. `npx jest __tests__/ArtworkImagesManager.test.tsx -t "US1-AS4"` — после подтверждения вызван `deleteArtworkImage`, список из 3; при отмене (`confirm` → false / Cancel в диалоге) вызова нет; при удалении обложки новая обложка — следующее фото.
2. E2E: `-g "US1-AS4"`.

### @US1-AS5 — лимит 10
1. `npx jest __tests__/ArtworkImagesManager.test.tsx -t "US1-AS5"` — при 10 фото попытка добавить файл: текст сообщения на русском содержит "10", `uploadArtworkImages` не вызван.

### @US1-EC8 — отклонённые файлы названы в сообщении
1. `npx jest __tests__/ArtworkImagesManager.test.tsx -t "US1-EC8"` — выбор `note.txt` и файла > 15 МБ среди валидных: сообщение называет имена отклонённых файлов и причину; валидные файлы остаются в списке превью.

### @US1-EC9 — создание работы с несколькими фото
1. `npx jest __tests__/ArtworkImagesManager.test.tsx -t "US1-EC9"` — режим создания: первый выбранный файл помечен как обложка, порядок = порядок выбора; кнопка удаления недоступна, когда фото одно.
2. E2E: `npx playwright test e2e/artwork-images.spec.ts -g "US1-EC9"` — создание работы с 3 файлами, в админке 3 фото, обложка = первый файл.

---

## Slice 3 — Публичная часть

### @US2-AS6 — клик по миниатюре (десктоп)
1. `cd frontend && npx jest __tests__/ArtworkGallery.test.tsx -t "US2-AS6"` — клик по 3-й миниатюре: основное `img` — 3-е, у миниатюры `aria-current="true"`, у остальных нет.
2. E2E (viewport 1280×800): `npx playwright test e2e/artwork-images.spec.ts -g "US2-AS6"`.

### @US2-AS7 — лайтбокс
1. `npx jest __tests__/ArtworkGallery.test.tsx -t "US2-AS7"` — клик по основному фото открывает лайтбокс на текущем индексе; `fireEvent.keyDown(ArrowRight)` → фото N+1, `ArrowLeft` → N, кнопки-стрелки листают, `Escape` закрывает; зум после перехода работает (существующие тесты лайтбокса не сломаны: `npx jest __tests__ -t "lightbox"`).
2. E2E: `-g "US2-AS7"`.

### @US2-AS8 — мобильная карусель
1. `npx jest __tests__/ArtworkGallery.test.tsx -t "US2-AS8"` — на узком экране: контейнер с `snap-x`, N точек-индикаторов, активная точка меняется при scroll-событии (смена `scrollLeft`), миниатюр нет.
2. E2E (viewport 375×667): `npx playwright test e2e/artwork-images.spec.ts -g "US2-AS8"` — свайп/прокрутка трека, активная точка сдвигается.

### @US2-AS9 — одно фото
1. `npx jest __tests__/ArtworkGallery.test.tsx -t "US2-AS9"` — с одним изображением нет миниатюр, точек и стрелок (`queryByRole`/`queryByTestId` → null), клик по фото всё ещё открывает лайтбокс.
2. Регрессия: `npx jest __tests__` — существующие тесты страницы работы зелёные.

### @US3-AS10 — SEO в серверном HTML
1. `npx jest __tests__/ArtworkGallery.test.tsx __tests__/ArtworkJsonLd.test.tsx -t "US3-AS10"` — `renderToString` даёт 3 `<img>` с alt «Сирень — фото 1/2/3»; JSON-LD `image` — массив из 3 URL, первый = обложка.
2. Ручной контроль на поднятом стенде: `curl -s http://localhost:3000/gallery/<slug> | grep -o 'alt="[^"]*фото [0-9]*"' | wc -l` → число фото; `curl -s http://localhost:3000/gallery/<slug> | grep -o '"image":\[[^]]*\]'` — массив всех URL.

### @US3-FR13 — приоритет загрузки и alt для одного фото
1. `npx jest __tests__/ArtworkGallery.test.tsx -t "US3-FR13"` — первое `img`: `loading="eager"`, `fetchpriority="high"`; остальные `loading="lazy"`; для работы с одним фото `alt` равен названию без «— фото 1».

### @US4-AS11 — бейдж в сетке
1. `npx jest __tests__/ArtworkCard.test.tsx -t "US4-AS11"` (файл — по факту компонента сетки) — у карточки с 3 фото текст бейджа «3», у карточки с 1 фото бейджа нет; обе используют обложку.
2. E2E: `npx playwright test e2e/artwork-images.spec.ts -g "US4-AS11"`.

---

## Общая регрессия (после всех слайсов)
- `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj` — все зелёные.
- `cd frontend && npx tsc --noEmit && npx jest && npx playwright test e2e/artwork-images.spec.ts` — все зелёные.
