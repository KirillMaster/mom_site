# QA-процедуры: Каталог, доверие и картина на заказ (catalog-trust-order, 011)

Общие предпосылки:
- Backend: `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj --filter "FullyQualifiedName~<класс>&FullyQualifiedName~<id>"` из корня (id в имени теста, например `US7_BE1`).
- Frontend (из `frontend/`): `npx jest <файл> -t "<id>"`; e2e: `npx playwright test e2e/<spec>.ts -g "<id>"`; финально `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- curl: API `http://localhost:5000`; токен админа через `/api/auth/login` (учётные данные из `.env`).
- Ожидаемые тесты Coder-а: backend `WatermarkGeometryTests`, `WatermarkPairingTests`, `RewatermarkServiceTests`, `RewatermarkEndpointTests`, `HowToBuyEndpointTests`, `DescriptionCleanerTests`, `HomeAboutDataTests`; frontend `__tests__/HomeHero.test.tsx`, `AvailableGrid.test.tsx`, `ArtworkCarousel.seaside.test.tsx`, `TrustStrip.test.tsx`, `ReviewsPreview.test.tsx`, `OrderForm.test.tsx`, `HowToBuy.test.tsx`, `ScaleDiagram.test.tsx`, `ArtworkPageTrust.test.tsx`, `gallery.test.ts`, `GalleryFilters.test.tsx`, `AboutExhibitions.test.tsx`; e2e `e2e/catalog-trust.spec.ts`.
- Критерий прохождения: выбранные тесты зелёные, exit code 0, реально выполнены (не 0 прогнано, не skipped). Имя не найдено в фильтре - провал.
- Е2E на проде: только чтение, форма /order НЕ отправляется.

---
## Slice S1

### @US7-AS1
`dotnet test ... --filter "FullyQualifiedName~WatermarkGeometryTests|FullyQualifiedName~ArtworkImageServiceTests&FullyQualifiedName~US7_AS1"`. Assert: для 3000x2000 высота текста <= 60 px, текст в правой нижней четверти, пиксели центра нижней кромки равны исходным, alpha <= 0.4; превью без отличий от ресайза без знака; StoreAsync вернул оригинал и ArtworkImage.OriginalPath заполнен; DeleteFiles оригинал не удаляет. Ручное: загрузить тестовое изображение в админке, открыть копию и превью.
### @US7-AS2
`dotnet test ... --filter "FullyQualifiedName~RewatermarkServiceTests&FullyQualifiedName~US7_AS2"`. Assert: вызваны AddWatermarkAsync(original) и CreateThumbnailAsync(original); ImagePath/ThumbnailPath/OriginalPath обновлены; Artwork.ImagePath/ThumbnailPath обновлены если совпадали; удаление старых файлов после SaveChanges; удаление оригинала не вызывалось.
### @US7-AS3
`dotnet test ... --filter "FullyQualifiedName~RewatermarkServiceTests&FullyQualifiedName~US7_AS3"` и integration `RewatermarkEndpointTests`. Assert: id в `skipped`, в S3-моке нет записей/удалений, БД без изменений.
### @US7-BE1
`dotnet test ... --filter "FullyQualifiedName~WatermarkPairingTests"`. Assert (по одному тесту): точная пара a<->b (3 с); копия раньше оригинала - без пары; разница > 120 с - skipped; два оригинала - ближайший, второй не повторно; разные расширения - без пары; граница ровно 120 с зафиксирована тестом.
### @US7-BE2
`dotnet test ... --filter "FullyQualifiedName~RewatermarkEndpointTests&FullyQualifiedName~US7_BE2"`. curl: `curl -s -X POST -H "Authorization: Bearer $T" http://localhost:5000/api/admin/images/rewatermark` -> JSON с `dryRun:true`, `processed:0`, ключи matched/skipped/failed/remaining; `SELECT COUNT(*) FROM "ArtworkImages" WHERE "OriginalPath" IS NOT NULL;` не изменился. Затем `?dryRun=false&take=1` дважды: второй вызов не обрабатывает то же изображение.
### @US7-BE3
`dotnet test ... --filter "FullyQualifiedName~RewatermarkEndpointTests&FullyQualifiedName~US7_BE3"`. curl без токена: `curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:5000/api/admin/images/rewatermark?dryRun=false"` -> 401.
### @US7-BE4
`dotnet test ... --filter "FullyQualifiedName~RewatermarkEndpointTests&FullyQualifiedName~US7_BE4"`. curl `take=0`, `take=101`, `take=100`: первые два - 400 либо зажаты в 1..100 (поведение должно быть зафиксировано тестом и совпадать с контрактом), third - 200, число обработанных <= 100.
### @US7-EC4
`dotnet test ... --filter "FullyQualifiedName~RewatermarkServiceTests&FullyQualifiedName~US7_EC4"`. Assert: S3-мок бросает на одном изображении -> id в `failed` с текстом ошибки, его пути неизменны, остальные обработаны.

---
## Slice S2

### @US3-BE1
`dotnet test ... --filter "FullyQualifiedName~HowToBuyEndpointTests&FullyQualifiedName~US3_BE1"`. curl: `curl -s http://localhost:5000/api/public/how-to-buy` без токена -> 200 `{"text":null,"updatedAt":null}`.
### @US3-BE2
`dotnet test ... --filter "FullyQualifiedName~HowToBuyEndpointTests&FullyQualifiedName~US3_BE2"`. Assert: 200, text из записи, updatedAt не null.
### @US3-BE3
`dotnet test ... --filter "FullyQualifiedName~HowToBuyEndpointTests&FullyQualifiedName~US3_BE3"`. Assert: неактивная запись -> text null.
### @US8-AS1
`dotnet test ... --filter "FullyQualifiedName~DescriptionCleanerTests&FullyQualifiedName~US8_AS1"`. Assert: результат точно "Холст на подрамнике , масло, 80х65, Севастополь 2012г." (включая пробел перед запятой).
### @US8-AS2
`dotnet test ... --filter "FullyQualifiedName~DescriptionCleanerTests&FullyQualifiedName~US8_AS2"`. Assert: авторский текст (включая абзацы) возвращается без изменений; null -> null.
### @US8-BE1
`dotnet test ... --filter "FullyQualifiedName~DescriptionCleanerTests&FullyQualifiedName~US8_BE1"`. Assert: после двух вызовов стартовой очистки изменена только затронутая работа, второй запуск - 0 изменений; `Clean(Clean(x)) == Clean(x)`.
### @US8-EC1
`dotnet test ... --filter "FullyQualifiedName~DescriptionCleanerTests&FullyQualifiedName~US8_EC1"`. Assert: результат null или "" (в один согласованный вариант), добавленного текста нет.
### @US1-BE1
`dotnet test ... --filter "FullyQualifiedName~HomeAboutDataTests&FullyQualifiedName~US1_BE1"`. curl: `curl -s http://localhost:5000/api/public/home | jq '.availableArtworks | length, (map(.status) | unique)'` -> <= 8, только Available (либо значение enum); старые поля (jq `keys`) сохранились.
### @US1-BE2
`dotnet test ... --filter "FullyQualifiedName~HomeAboutDataTests&FullyQualifiedName~US1_BE2"`. Assert: неопубликованные/Sold/вне категорий отсутствуют; при отсутствии подходящих `availableArtworks == []`.
### @US5-BE1
`dotnet test ... --filter "FullyQualifiedName~HomeAboutDataTests&FullyQualifiedName~US5_BE1"`. curl: `curl -s http://localhost:5000/api/public/about | jq '.exhibitionPhotos | length'` <= 24; все работы из категории "Фото с выставок" и опубликованы.
### @US5-BE2
`dotnet test ... --filter "FullyQualifiedName~HomeAboutDataTests&FullyQualifiedName~US5_BE2"`. Assert: 200, `exhibitionPhotos == []`.

---
## Slice S3

### @US1-AS1
`npx jest __tests__/HomeHero.test.tsx -t "US1-AS1"`. Assert: текст подзаголовка точный; ссылка "Выбрать картину" с href, начинающимся с `/gallery`; ссылка заказа с href `/order`.
### @US1-AS2
`npx jest __tests__/AvailableGrid.test.tsx -t "US1-AS2"`. Assert: 8 карточек, MuseumLabel в каждой, href `/gallery/<slug>`.
### @US1-AS3
`npx jest __tests__/AvailableGrid.test.tsx __tests__/ArtworkCarousel.seaside.test.tsx -t "US1-AS3"`. Assert: у img нет подстроки S3-хоста в src, есть `sizes`; тест ArtworkCarousel.seaside (4 focusables) зелёный. Ручное: `grep -rn "<img" frontend/app/HomeClientPage.tsx frontend/components/home frontend/components/ArtworkCarousel*` - нет сырых img с URL работ; проверить `next.config` remotePatterns содержит S3-хост.
### @US1-EC1
`npx jest __tests__/AvailableGrid.test.tsx -t "US1-EC1"`. Assert: пустой массив -> компонент возвращает null, заголовок "Сейчас в наличии" отсутствует.
### @US1-EC2
`npx jest __tests__/AvailableGrid.test.tsx -t "US1-EC2"`. Assert: 3 карточки, нет заглушек.
### @US2-AS1
`npx jest __tests__/TrustStrip.test.tsx -t "US2-AS1"`. Assert: три текста "Член Союза художников России", "Работы в музейных собраниях", "Коллекционеры в 12 странах"; полоса подключена в HomeClientPage.
### @US2-AS3
`npx jest __tests__/ReviewsPreview.test.tsx -t "US2-AS3"`. Assert: из 5 отзывов 3, ссылка "Все отзывы" href `/reviews`.
### @US2-EC1
`npx jest __tests__/ReviewsPreview.test.tsx -t "US2-EC1"`. Assert: пустой список -> null; ошибка загрузки не роняет главную (TrustStrip рендерится).
### @US6-AS1
`npx jest __tests__/OrderForm.test.tsx -t "US6-AS1"`. Assert: fetch/api вызван с subject "Картина на заказ", message содержит сюжет/размер/комментарий; показано подтверждение; `reachGoal("custom_order_submit")` вызван; цель присутствует в `lib/analytics.ts`.
### @US6-AS2
`npx jest __tests__/OrderForm.test.tsx -t "US6-AS2"`. Assert: ошибки у пустых полей, fetch и reachGoal не вызваны.
### @US6-EC1
`npx jest __tests__/OrderForm.test.tsx -t "US6-EC1"`. Assert: после отказа API есть сообщение с предложением мессенджера, значения полей сохранены, reachGoal не вызван.
### @US6-FE1
`npx jest -t "US6-FE1"` (тест sitemap и Footer). Assert: sitemap содержит `/order`; Footer содержит ссылку href `/order`; у `app/order/page.tsx` экспортирован metadata. Ручное: `curl -s localhost:3000/sitemap.xml | grep -c "/order"` >= 1.
### @US6-FE2
`npx jest __tests__/OrderForm.test.tsx -t "US6-FE2"`. Assert: "a@b.ru" -> email; "+7 999 123-45-67" -> phone; "@artist" -> telegramUsername.
### @US6-FE3
`npx jest __tests__/OrderForm.test.tsx -t "US6-FE3"`. Assert: поле комментария содержит "Хочу похожую на «Цветы лета»"; `<script>` в параметре как текст, `grep -rn dangerouslySetInnerHTML frontend/app/order frontend/components/order` пуст.

---
## Slice S4

### @US3-AS1
`npx jest __tests__/HowToBuy.test.tsx -t "US3-AS1"`. Assert: text=null -> 4 пункта (доставка, оплата, сертификат подлинности, возврат).
### @US3-AS2
`npx jest __tests__/HowToBuy.test.tsx -t "US3-AS2"`. Assert: показан переданный текст, пунктов по умолчанию нет. Ручное: изменить how-to-buy/body в админке страниц, открыть /gallery/<slug>.
### @US3-EC1
`npx jest __tests__/HowToBuy.test.tsx -t "US3-EC1"`. Assert: "Первый\n\nВторой" -> 2 абзаца; `<b>` как текст.
### @US3-EC2
`npx jest __tests__/HowToBuy.test.tsx -t "US3-EC2"`. Assert: ошибка fetch -> текст по умолчанию, страница рендерится.
### @US4-AS1
`npx jest __tests__/ScaleDiagram.test.tsx -t "US4-AS1"`. Assert: для 80x60 ширина rect = 0.4 * ширины дивана, высота = 0.3 * ширины дивана (допуск 0.01), подпись "80 × 60 см".
### @US4-AS2
`npx jest __tests__/ScaleDiagram.test.tsx -t "US4-AS2"`. Assert: без размеров компонент возвращает null.
### @US4-EC1
`npx jest __tests__/ScaleDiagram.test.tsx -t "US4-EC1"`. Assert: только ширина либо только высота -> null.
### @US4-EC2
`npx jest __tests__/ScaleDiagram.test.tsx -t "US4-EC2"`. Assert: 400x100 -> rect полностью в viewBox SVG.
### @US2-AS2
`npx jest __tests__/ReviewsPreview.test.tsx __tests__/ArtworkPageTrust.test.tsx -t "US2-AS2"`. Assert: prioritizeArtworkId=7 -> 3 отзыва, первый о работе 7, есть "Все отзывы".
### @US2-FE1
`npx jest __tests__/ArtworkPageTrust.test.tsx -t "US2-FE1"`. Assert: TrustStrip на странице работы; сохранены `h1[data-label-line]` и цель `ask_price` (тесты MuseumLabel/AskPriceButton зелёные).
### @US6-AS3
`npx jest __tests__/ArtworkPageTrust.test.tsx -t "US6-AS3"`. Assert: ссылка "Хочу похожую" href `/order?artwork=%D0%A6...` (= encodeURIComponent("Цветы лета")).
### @US6-EC2
`npx jest __tests__/ArtworkPageTrust.test.tsx -t "US6-EC2"`. Assert: название с «»/"/&/пробелами -> href закодирован, `decodeURIComponent` возвращает исходное (через normalizeTitle, если применяется).

---
## Slice S5

### @US5-AS1
`npx jest __tests__/gallery.test.ts -t "US5-AS1"`. Assert: `filterArtworks(..., {size:"M"})` -> только 60x50.
### @US5-AS2
`npx jest __tests__/gallery.test.ts -t "US5-AS2"`. Assert: вид по умолчанию без категорий "Пейзажи Всеволода Сухоруких" и "Фото с выставок".
### @US5-AS3
`npx jest __tests__/GalleryFilters.test.tsx -t "US5-AS3"`. Assert: выбран раздел Сухоруких -> только его работы, видна подпись авторства.
### @US5-AS4
`npx jest __tests__/AboutExhibitions.test.tsx -t "US5-AS4"`. Assert: раздел "Выставки", 5 изображений, `sizes` задан; тест prose-measure биографии (e2e US2-E2E2) не сломан.
### @US5-AS5
`npx jest __tests__/GalleryFilters.test.tsx -t "US5-AS5"`. Assert: начальный `?size=M&available=1` -> нужные кнопки `aria-pressed="true"` и тот же отбор; изменение фильтра вызывает `router.replace` с обновлёнными параметрами.
### @US5-FE1
`npx jest __tests__/gallery.test.ts -t "US5-FE1"`. Assert: sizeClass(40,30)=S, (41,10)=M, (80,50)=M, (81,10)=L, (null,10)=null.
### @US5-FE2
`npx jest __tests__/gallery.test.ts __tests__/GalleryFilters.test.tsx -t "US5-FE2"`. Assert: комбинация И; счётчик; "Ничего не найдено" + "Сбросить"; сброс очищает query; в UI нет фильтра цены.
### @US5-FE3
`npx jest __tests__/AboutExhibitions.test.tsx -t "US5-FE3"`. Assert: пустой/undefined массив -> нет заголовка "Выставки".
### @US5-EC1
`npx jest __tests__/gallery.test.ts -t "US5-EC1"`. Assert: без этих категорий нет вкладки Сухоруких, все работы доступны.
### @US5-EC2
`npx jest __tests__/gallery.test.ts -t "US5-EC2"`. Assert: работа с одной стороной не попадает ни в S/M/L.
### @US5-E2E1
`npx playwright test e2e/catalog-trust.spec.ts -g "US5-E2E1"` (baseURL прод, waitUntil domcontentloaded). Assert: после выбора размера M и "в наличии" URL содержит `size=M` и `available=1`; результат либо карточки, либо пустое состояние с "Сбросить".
### @US1-E2E1
`npx playwright test e2e/catalog-trust.spec.ts -g "US1-E2E1"`; затем `npx playwright test e2e/design-system.spec.ts` (`/order` добавлен в OVERFLOW_PAGES). Assert: главная - подзаголовок, "Сейчас в наличии", полоса доверия, все src картин работ начинаются с `/_next/image`; страница работы - "Как купить" и схема масштаба; `/order` отдаёт 200 и форму, на 390 px нет горизонтальной прокрутки; `/about` - "Выставки". Форма не отправляется. Финально: `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj`, `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` - exit code 0.
