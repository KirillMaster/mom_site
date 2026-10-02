# QA-процедуры: Конверсия в заявку и P0-правки (conversion-quick-wins, 008)

Общие предпосылки:
- Backend: `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj --filter "FullyQualifiedName~<класс>&FullyQualifiedName~<id>"` из корня (id сценария в имени теста, например `US1_BE1`; нет фильтра по id - запускать класс целиком).
- Frontend (из `frontend/`): `npx jest <файл> -t "<id>"`; E2E: `npx playwright test e2e/<spec>.ts -g "<id>"`; финально `npx tsc --noEmit`, `npm run lint`.
- Ожидаемые тесты Coder-а: backend `ArtworkCatalogFieldsTests`, `ContactMessagePhoneTests`, `ContactNotifiersPhoneTests`; frontend `__tests__/normalizeTitle.test.ts`, `ArtworkSpecs.test.tsx`, `contactChannels.test.ts`, `ContactChannels.test.tsx`, `MobileContactBar.test.tsx`, `ContactsClientPage.test.tsx`, `GalleryClientPage.test.tsx`, `RelatedWorks.test.tsx`, `seoMetadata.test.ts`; e2e `e2e/no-overflow.spec.ts`, `e2e/conversion.spec.ts`.
- Для curl: API `http://localhost:5000`, токен админа получить через `/api/auth/login` (учётные данные из `.env`).
- Критерий прохождения: выбранные тесты зелёные, exit code 0, и реально выполнены (не 0 прогнано, не skipped).

---
## Slice S1

### @US1-AS1
`npx jest __tests__/ArtworkSpecs.test.tsx -t "US1-AS1"`. Assert: строки "80 × 70 см", "масло", "холст на подрамнике", "2026", "В наличии" присутствуют. Ручное: открыть /gallery/<slug> работы с пятью полями.
### @US1-AS2
`npx jest __tests__/ArtworkSpecs.test.tsx -t "US1-AS2"`. Assert: только размер и статус; нет элементов с "—"/пустым значением.
### @US1-AS3
`npx jest __tests__/ArtworkSpecs.test.tsx -t "US1-AS3"` (и тест страницы работы). Assert: "Продана", нет цены, есть "Заказать похожую", нет "Узнать цену".
### @US1-BE1
`dotnet test ... --filter "FullyQualifiedName~ArtworkCatalogFieldsTests&FullyQualifiedName~US1_BE1"`. curl: `PUT /api/admin/artworks/$ID` с `heightCm=0`, `widthCm=1001`, `year=1800`, `year=<текущий+1>` - каждый HTTP 400 с ключом поля; `GET` подтверждает неизменность.
### @US1-BE2
`dotnet test ... --filter "FullyQualifiedName~ArtworkCatalogFieldsTests&FullyQualifiedName~US1_BE2"`. Ручное на копии БД: `dotnet ef migrations list --project backend/MomSite.Infrastructure --startup-project backend/MomSite.API` содержит AddArtworkCatalogFields; `SELECT COUNT(*) FROM "Artworks" WHERE "IsForSale" AND "Status"<>0;` - 0 (Available=0, уточнить по enum).
### @US1-BE3
`dotnet test ... --filter "FullyQualifiedName~ArtworkCatalogFieldsTests&FullyQualifiedName~US1_BE3"`. Assert: Available -> IsForSale=true; любой другой статус -> false.
### @US1-BE4
`npx jest __tests__/ArtworkForm.test.tsx __tests__/useArtworkSave.boundary.test.ts -t "US1-BE4"`. Assert: payload содержит status/widthCm/heightCm/year/technique/support; после очистки техники значение пустое. Ручное: админка - заполнить и сохранить, перезагрузить.
### @US1-EC1
`npx jest __tests__/ArtworkSpecs.test.tsx -t "US1-EC1"`. Assert: единственная строка - статус.
### @US1-EC2
`npx jest __tests__/ArtworkSpecs.test.tsx -t "US1-EC2"`. Assert: PrivateCollection - нет цены, есть "Заказать похожую".
### @US1-EC3
`npx jest __tests__/ArtworkSpecs.test.tsx -t "US1-EC3"`. Assert: блок не отрендерен для выставочного фото.
### @US8-AS1
`npx jest __tests__/normalizeTitle.test.ts -t "US8-AS1"`. Assert: `normalizeTitle` для `"Утро"`, `«Утро»`, `'Утро'`, `Утро` = `Утро`; `quotedTitle` = `«Утро»`.
### @US8-AS2
`npx jest __tests__/normalizeTitle.test.ts -t "US8-AS2"`. Assert: `«Дом "у моря"»` -> `Дом "у моря"`; миграции данных нет (`git diff --stat -- backend/**/Migrations` не содержит UPDATE Title).

---
## Slice S2

### @US3-AS1
`npx jest __tests__/ContactsClientPage.test.tsx -t "US3-AS1"`. Assert: fetch вызван с phone, без email; показан успех.
### @US3-AS2
`npx jest __tests__/ContactsClientPage.test.tsx -t "US3-AS2"`. Assert: fetch не вызван, текст "Укажите телефон, мессенджер или email".
### @US3-AS3
`npx jest __tests__/ContactsClientPage.test.tsx -t "US3-AS3"`. Assert: поле темы = "Утро в Коктебеле" (через normalizeTitle).
### @US3-AS4
`npx jest __tests__/ContactsClientPage.test.tsx -t "US3-AS4"`. Assert: кнопка submit содержит класс `bg-primary`.
### @US3-BE1
`dotnet test ... --filter "FullyQualifiedName~ContactMessagePhoneTests&FullyQualifiedName~US3_BE1"`. curl: `POST /api/contact` `{"name":"A","phone":"+7999","message":"hi"}` -> 200; запись имеет Phone.
### @US3-BE2
`dotnet test ... --filter "FullyQualifiedName~ContactMessagePhoneTests&FullyQualifiedName~US3_BE2"`. curl без email/phone -> 400 "Укажите email или телефон"; количество записей не выросло.
### @US3-BE3
`dotnet test ... --filter "FullyQualifiedName~ContactMessagePhoneTests&FullyQualifiedName~US3_BE3"`. Assert: 400 для email "not-an-email" и телефона из 101 символа; для телефона из 100 символов - 200.
### @US3-BE4
`dotnet test ... --filter "FullyQualifiedName~TelegramNotifierTests|FullyQualifiedName~EmailNotifierTests|FullyQualifiedName~ContactNotifiersPhoneTests"`. Assert: текст содержит телефон; null email не вызывает исключения; AdminMessages DTO содержит Phone. Ручное: страница сообщений в админке показывает телефон.
### @US3-EC5
`npx jest __tests__/ContactsClientPage.test.tsx -t "US3-EC5"`. Assert: значение темы длиной не больше лимита, `<script>` в DOM как текст (нет script-элемента, `dangerouslySetInnerHTML` не используется: `grep -n dangerouslySetInnerHTML frontend/app/contacts`).

---
## Slice S3

### @US2-AS1
`npx jest __tests__/contactChannels.test.ts __tests__/ContactChannels.test.tsx -t "US2-AS1"`. Assert: href Telegram содержит encodeURIComponent("Здравствуйте! Интересует картина „Утро в Коктебеле“") и URL страницы.
### @US2-AS2
`npx playwright test e2e/conversion.spec.ts -g "US2-AS2"` (viewport 390x844); jest `MobileContactBar.test.tsx -t "US2-AS2"`. Assert: `fixed bottom-0`, safe-area, у страницы `pb-20`; панель не перекрывает футер после scrollToBottom.
### @US2-AS3
`npx jest __tests__/ContactChannels.test.tsx __tests__/MobileContactBar.test.tsx -t "US2-AS3"`. Assert: `reachGoal` вызван с `(Goals.ContactClick, {channel, artwork})` для каждого канала.
### @US2-AS4
`npx jest __tests__/contactChannels.test.ts -t "US2-AS4"`. Assert: название с пробелами/кавычками корректно закодировано; присутствует нормализованное название и URL.
### @US2-AS5
`npx jest __tests__/MobileContactBar.test.tsx -t "US2-AS5"`. Assert: контейнер имеет класс `md:hidden`; e2e на 1024 px - панель невидима.
### @US2-AS6
`npx jest __tests__/contactChannels.test.ts __tests__/ContactChannels.test.tsx -t "US2-AS6"`. Assert: без контакта MAX кнопки нет; в массиве нет каналов с пустым href.
### @US2-EC3
`npx jest __tests__/ContactChannels.test.tsx __tests__/MobileContactBar.test.tsx -t "US2-EC3"`. Assert: для выставочного фото ничего не рендерится на странице.
### @US2-EC8
`npx jest __tests__/ContactChannels.test.tsx -t "US2-EC8"`. Assert: у веб-ссылок `target="_blank"`, `rel` содержит `noopener`.
### @US2-EC2
`npx jest __tests__/ContactChannels.test.tsx -t "US2-EC2"`. Assert: при Sold кнопки каналов и "Заказать похожую" видны.

---
## Slice S4

### @US4-AS1
`npx jest __tests__/GalleryClientPage.test.tsx -t "US4-AS1"`. Assert: 24 карточки, кнопка "Показать ещё (36)".
### @US4-AS2
`npx jest __tests__/GalleryClientPage.test.tsx -t "US4-AS2"`. Assert: после двух кликов 48, затем 60 карточек, кнопки нет.
### @US4-AS3
`npx jest __tests__/GalleryClientPage.test.tsx -t "US4-AS3"`. Assert: карточка - единый `<a>` на /gallery/<slug>; видны "80 × 70 см", "цена по запросу"; нет текстов "Перейти к описанию", "Узнать цену".
### @US4-AS4
`npx jest __tests__/GalleryClientPage.test.tsx -t "US4-AS4"`. Assert: после смены категории 24 карточки.
### @US4-AS5
`npx jest __tests__/GalleryClientPage.test.tsx -t "US4-AS5"`; e2e `npx playwright test e2e/conversion.spec.ts -g "US4-AS5"`. Assert: первые 4 eager, остальные lazy+async; число элементов карточек галереи в DOM не больше 24 до прокрутки.
### @US4-AS6
`npx jest __tests__/ssr-cache -t "US4-AS6"` либо `curl -s http://localhost:3000/sitemap.xml | grep -c "/gallery/"` равно числу работ в API. Assert: каждая работа в sitemap.
### @US4-EC6
`npx jest __tests__/GalleryClientPage.test.tsx -t "US4-EC6"`. Assert: при 24 работах кнопки нет.
### @US5-AS1
`npx jest __tests__/RelatedWorks.test.tsx -t "US5-AS1"`. Assert: 8 карточек, текущей нет, href "Смотреть все" = /gallery?category=<id>.
### @US5-AS2
`npx playwright test e2e/conversion.spec.ts -g "US5-AS2"`; jest GalleryClientPage.test.tsx -t "US5-AS2". Assert: активна категория из query-параметра.
### @US5-EC7
`npx jest __tests__/RelatedWorks.test.tsx -t "US5-EC7"`. Assert: компонент возвращает null.
### @US6-AS1
`npx playwright test e2e/no-overflow.spec.ts` (viewport 390). Assert: для /, /gallery, первой карточки, /about, /videos, /reviews, /contacts, /blog scrollWidth <= clientWidth; 8 проверок прошли.
### @US7-AS1
`npx jest __tests__/seoMetadata.test.ts -t "US7-AS1"`. Assert: title и openGraph.title = "Купить картины маслом — галерея Анжелы Моисеенко". Ручное: `curl -s localhost:3000/gallery | grep -o "<title>[^<]*"`.
### @US7-AS2
`npx jest __tests__/seoMetadata.test.ts -t "US7-AS2"`. Assert: description содержит "художника-импрессиониста Анжелы Моисеенко".
### @US7-AS3
`npx jest __tests__/seoMetadata.test.ts -t "US7-AS3"` (рендер HomeClientPage). Assert: у hero img непустой alt.
### @US8-AS3
`npx jest -t "US8-AS3"`. Assert: во всех перечисленных местах нет двойных кавычек вокруг названия; `grep -rn "artwork.title" frontend/app frontend/components` - вывод проходит через normalizeTitle/quotedTitle.
### @US2-E2E1
`npx playwright test e2e/conversion.spec.ts -g "US2-E2E1"`. Затем финальные проверки: `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj`, `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` - все exit code 0.
