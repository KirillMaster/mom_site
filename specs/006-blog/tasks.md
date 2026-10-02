<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: 006-blog

## `T001` Спайк TipTap на Next 14.0 / React 18 [P] [US3]

Проверить что @tiptap/react + starter-kit + extension-link + extension-image + extension-placeholder собираются и работают через next/dynamic ssr:false

**Context**: Редактор — главный риск фичи; если не заведётся — запасной вариант блочная форма (R7)

- **Depends on**: —
- **Requirements**: FR-006
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Установить пакеты** — cd frontend && npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder (версии 2.x совместимые с React 18)
2. **Собрать проект** — npx tsc --noEmit && npm run build; убедиться что чанки TipTap не попали в публичные страницы (.next/server/app/blog отсутствуют ссылки на tiptap)
3. **Зафиксировать результат** — Дописать в specs/006-blog/research.md строку «Спайк R7: OK/FAIL + версии»

**Technical Notes**:

- `frontend/package.json`: Next 14.0.0 / React 18; jest 30; новые зависимости только MIT

**Acceptance Criteria**:

- [x] `AC-1` npm run build проходит; версии TipTap записаны в research.md

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Пакеты установлены
  - When: npm run build
  - Then: Сборка без ошибок
  - Verification: automated

## `T002` Подключить HtmlSanitizer в Infrastructure [P] [US3]

Добавить пакет HtmlSanitizer (Ganss.Xss) в MomSite.Infrastructure.csproj

**Context**: Текст статьи приходит HTML-ом из редактора; его надо чистить от опасной разметки (R1)

- **Depends on**: —
- **Requirements**: FR-003
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Добавить пакет** — cd backend && dotnet add MomSite.Infrastructure package HtmlSanitizer
2. **Проверить сборку** — dotnet build

**Technical Notes**:

- `backend/MomSite.Infrastructure/MomSite.Infrastructure.csproj`: Сейчас нет ни ClosedXML ни HtmlSanitizer

**Acceptance Criteria**:

- [x] `AC-1` dotnet build зелёный с новым пакетом

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Пакет добавлен
  - When: dotnet build
  - Then: 0 ошибок
  - Verification: automated

## `T003` Общий фильтр видимости работ Visible() [P] [US1]

Если в коде ещё нет IQueryable<Artwork>.Visible() — создать минимальную версию в общем месте; 005 потом расширит её же (без дубля)

**Context**: Блок «Работы по теме» должен показывать только видимые работы; фильтр должен быть один на весь сайт

- **Depends on**: —
- **Requirements**: FR-004
- **Entities**: artwork
- **Contracts**: —

**Steps**:

1. **Проверить наличие** — grep -rn "Visible(" backend --include=*.cs; если есть — задача закрывается без изменений
2. **Создать расширение** — backend/MomSite.Infrastructure/Data/ArtworkQueryExtensions.cs: public static IQueryable<Artwork> Visible(this IQueryable<Artwork> q) => q; с XML-комментарием «005 добавит фильтр IsPublished здесь»
3. **Обновить план 005** — В specs/005-catalog-import/research.md (R по Visible) дописать: «расширение уже создано в 006 — добавить условие, не создавать новое»

**Technical Notes**:

- `backend/MomSite.API/Controllers/PublicController.cs`: Публичные запросы работ сейчас без фильтра публикации; их перевод на Visible() — задача 005

**Acceptance Criteria**:

- [x] `AC-1` В решении ровно одно определение Visible() для Artwork

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Три работы в БД
  - When: context.Artworks.Visible().Count()
  - Then: 3 (пока все видимы)
  - Verification: automated

## `T004` Модели блога и миграция [US3]

BlogPost / BlogCategory / BlogPostArtwork в Core/Models, DbSet и конфигурация в ApplicationDbContext, миграция AddBlog с seed рубрик

**Context**: Без таблиц нечего хранить и показывать

- **Depends on**: —
- **Requirements**: FR-001, FR-004, FR-008
- **Entities**: blog-post, blog-category, blog-post-artwork
- **Contracts**: —

**Steps**:

1. **Создать модели** — backend/MomSite.Core/Models/BlogPost.cs / BlogCategory.cs / BlogPostArtwork.cs — поля и длины по data-model.yaml
2. **Настроить контекст** — ApplicationDbContext: DbSet BlogPosts / BlogCategories / BlogPostArtworks; unique index Slug у обеих; составной PK (BlogPostId / ArtworkId); cascade на обе стороны; Restrict на BlogCategoryId; index PublishedAt
3. **Seed рубрик** — HasData: Новости (DisplayOrder 0, slug novosti) / Крым и Севастополь / Как выбрать картину / Истории картин / Театр и цирк / Мастерская
4. **Сгенерировать миграцию** — cd backend && dotnet ef migrations add AddBlog -p MomSite.Infrastructure -s MomSite.API -o Data/Migrations

**Technical Notes**:

- `backend/MomSite.Infrastructure/Data/ApplicationDbContext.cs`: Существующие DbSet: Artworks / Categories / Videos / PageContents / ContactMessages / Reviews
- `backend/MomSite.Infrastructure/Data/Migrations/`: Каталог миграций

**Acceptance Criteria**:

- [x] `AC-1` Миграция применяется на чистую БД; 6 рубрик созданы

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Чистая БД
  - When: dotnet ef database update
  - Then: Таблицы созданы; Рубрика novosti существует
  - Verification: automated

## `T005` Санитайзер и генератор адреса [P] [US3]

BlogHtmlSanitizer (белый список) и BlogSlug (валидация + уникализация суффиксом -2) в Infrastructure/Blog

**Context**: Чистка HTML и уникальный адрес нужны при каждом сохранении

- **Depends on**: T002
- **Requirements**: FR-003, FR-008
- **Entities**: blog-post
- **Contracts**: blog-service-impl

**Steps**:

1. **Написать тесты** — backend/MomSite.Tests/Blog/BlogHtmlSanitizerTests.cs: script / onerror / iframe / style / javascript: удаляются; p / h2 / h3 / strong / em / ul / ol / li / blockquote / a[href] / img[src alt] сохраняются; ссылки получают rel="noopener nofollow" для внешних
2. **Реализовать санитайзер** — backend/MomSite.Infrastructure/Blog/BlogHtmlSanitizer.cs на Ganss.Xss.HtmlSanitizer; img src только https и хост нашего S3 / сайта
3. **Тесты и реализация адреса** — Tests/Blog/BlogSlugTests.cs + Infrastructure/Blog/BlogSlug.cs: regex ^[a-z0-9-]{1,120}$; MakeUnique(slug / existsFn) → slug / slug-2 / slug-3

**Technical Notes**:

- `frontend/lib/artworkSlug.ts`: slugifyTitle на фронте генерирует адрес из заголовка; backend не транслитерирует, только валидирует

**Acceptance Criteria**:

- [x] `AC-1` Все тесты санитайзера и адреса зелёные

**Test Scenarios**:

- `TS-1` (unit)
  - Given: HTML <p>ok</p><script>x</script><img src=x onerror=a>
  - When: Sanitize
  - Then: <p>ok</p> без script и onerror
  - Verification: automated
- `TS-2` (unit)
  - Given: Адрес vesna занят
  - When: MakeUnique(vesna)
  - Then: vesna-2
  - Verification: automated

## `T006` IBlogService и реализация [US3]

Интерфейс в Core/Interfaces и BlogService в Infrastructure/Blog: публичные выборки и админ CRUD статей и рубрик

**Context**: Вся логика блога в одном сервисе; контроллеры остаются тонкими

- **Depends on**: T003, T004, T005
- **Requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-008
- **Entities**: blog-post, blog-category, blog-post-artwork, artwork
- **Contracts**: blog-service, blog-service-impl

**Steps**:

1. **Тесты сервиса** — Tests/Blog/BlogServiceTests.cs (InMemory/Sqlite как в существующих тестах): черновик и будущая дата не видны публично; рубрика по умолчанию Новости; CoverAlt по умолчанию = Title; смена адреса опубликованной → conflict slug_locked_after_publish; удаление непустой рубрики → conflict category_not_empty; работы по теме через Visible() в порядке SortOrder
2. **Интерфейс** — backend/MomSite.Core/Interfaces/IBlogService.cs — методы по contracts.yaml blog-service; результат как record Result<T> с outcome ok / not_found / validation_failed / conflict
3. **Реализация** — Infrastructure/Blog/BlogService.cs; файлы ≤ 200 строк — выборки в BlogQueries.cs; readingMinutes = слова/180; пагинация 12; UpdatedAt на каждом сохранении
4. **Регистрация DI** — Program.cs: AddScoped<IBlogService, BlogService>(); AddSingleton<BlogHtmlSanitizer>()

**Technical Notes**:

- `backend/MomSite.API/Program.cs`: Рядом с AddScoped<IImageService, ImageService>() (~строка 155)

**Acceptance Criteria**:

- [x] `AC-1` Все кейсы шага 1 зелёные

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Статья с PublishedAt завтра
  - When: GetPublishedBySlug
  - Then: not_found
  - Verification: automated

## `T007` BlogAdminController: статьи / рубрики / фото [US3]

api/admin/blog CRUD, api/admin/blog/categories CRUD, POST api/admin/blog/images; всё под [Authorize]

**Context**: Админка редактора общается с сервером через эти адреса

- **Depends on**: T006
- **Requirements**: FR-006, FR-007
- **Entities**: blog-post, blog-category
- **Contracts**: admin-blog, admin-blog-categories, admin-blog-images

**Steps**:

1. **DTO** — backend/MomSite.API/DTOs/Blog/: BlogPostAdminDto / BlogPostSaveDto (DataAnnotations по длинам) / BlogCategoryDto; статус Draft|Scheduled|Published вычисляется
2. **Контроллер** — backend/MomSite.API/Controllers/BlogAdminController.cs [Route("api/admin/blog")] [Authorize]; маппинг outcome → 200/201/400/404/409; ошибки по-русски
3. **Загрузка фото** — POST images: проверка content-type jpeg/png/webp и ≤ 15 МБ → 400 с понятным текстом; затем BlogImageProcessor.PrepareAsync (null → 400 «не похоже на фото») и _imageService.SaveImageAsync(prepared, "blog"); вернуть {url}; лимит запроса [RequestSizeLimit(16_000_000)]
4. **Интеграционные тесты** — Tests/Blog/BlogAdminControllerTests.cs по образцу AdminMessagesAuthorizationIntegrationTests: 401 без JWT; создание → 201 и итоговый адрес; дубль заголовка → -2; 409 при смене адреса опубликованной; 400 на .gif

**Technical Notes**:

- `backend/MomSite.API/Controllers/AdminController.cs`: Образец [Authorize]; не раздувать его — новый контроллер
- `backend/MomSite.Infrastructure/Services/ImageService.cs`: IImageService.SaveImageAsync(IFormFile / folder) грузит как есть (ресайза нет) — уменьшение делает Infrastructure/Blog/BlogImageProcessor (сделан в T005)
- `nginx`: Проверить client_max_body_size ≥ 16m для /api/admin/blog/images

**Acceptance Criteria**:

- [x] `AC-1` Интеграционные тесты зелёные; 401 без токена на всех методах

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Нет JWT
  - When: POST /api/admin/blog
  - Then: 401
  - Verification: automated
- `TS-2` (integration)
  - Given: JWT; файл photo.jpg 8 МБ
  - When: POST /api/admin/blog/images
  - Then: 200 {url} на S3 в папке blog
  - Verification: automated

## `T008` Типы и API-клиент блога на фронте [P] [US3]

frontend/types/blog.ts и frontend/lib/blogApi.ts (публичные и админ вызовы через существующий axios api)

**Context**: Один источник типов для админки и публичных страниц

- **Depends on**: T007
- **Requirements**: FR-006
- **Entities**: blog-post, blog-category
- **Contracts**: admin-blog, admin-blog-categories, admin-blog-images, public-blog-list, public-blog-post, public-blog-categories

**Steps**:

1. **Типы** — frontend/types/blog.ts: BlogPostListItem / BlogPost / BlogCategory / BlogPostSave / BlogStatus
2. **Клиент** — frontend/lib/blogApi.ts: getBlogList / getBlogPost / getBlogCategories (fetch с next.revalidate 300 для SSR) + admin* через api из lib/api.ts; uploadBlogImage(file / onProgress)
3. **Тест** — frontend/lib/blogApi.test.ts — мок axios/fetch; правильные URL и параметры

**Technical Notes**:

- `frontend/lib/api.ts`: api = axios.create + auth; API_BASE_URL различается на сервере/клиенте

**Acceptance Criteria**:

- [x] `AC-1` tsc --noEmit и jest blogApi зелёные

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Мок axios
  - When: uploadBlogImage(file)
  - Then: POST /api/admin/blog/images multipart
  - Verification: automated

## `T009` Простой редактор текста (7 кнопок) [US3]

components/blog/admin/RichTextEditor.tsx на TipTap в простом режиме: Жирный / Курсив / Подзаголовок / Список / Ссылка / Фото / Отменить

**Context**: Мама не программист: нужен маленький редактор как в Word без HTML (A-8)

- **Depends on**: T001, T008
- **Requirements**: FR-006, FR-007
- **Entities**: blog-post
- **Contracts**: admin-blog-images

**Steps**:

1. **Настроить расширения** — StarterKit.configure({heading:{levels:[2]} / codeBlock:false / code:false / horizontalRule:false / strike:false / blockquote:false}) + Link({openOnClick:false}) + Image + Placeholder("Начните писать новость…")
2. **Панель кнопок** — components/blog/admin/EditorToolbar.tsx: крупные кнопки ≥ 44px с иконкой и русской подписью; активное состояние; на ширине 360px переносятся в 2 ряда; «Ссылка» — простой prompt с адресом
3. **Фото в тексте** — Кнопка «Фото» → <input type=file accept="image/*">; плюс drop и paste файлов (editorProps.handleDrop/handlePaste); во время загрузки — заглушка «Загружаем фото…», потом setImage({src:url / alt:заголовок}); ошибка → понятное сообщение
4. **Чистка вставки** — editorProps.transformPastedHTML: убрать style / class / font / span / mso-*; base64-картинки не вставлять
5. **Тесты** — components/blog/admin/RichTextEditor.test.tsx: 7 кнопок с подписями; вставка HTML из Word очищается; выбор файла вызывает uploadBlogImage и вставляет img с url

**Technical Notes**:

- `frontend/components/blog/admin/`: Каждый файл ≤ 200 строк (P3)

**Acceptance Criteria**:

- [x] `AC-1` Только 7 кнопок; HTML-режима нет; фото загружается в хранилище, не base64

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Редактор открыт
  - When: Вставить <span style="mso-x">Текст</span>
  - Then: В документе <p>Текст</p> без style
  - Verification: automated

## `T010` Форма новости и страницы админки [US3]

app/admin/blog (список со статусами) и app/admin/blog/[id] (форма): видимы заголовок / обложка / текст; «Дополнительно» свёрнуто; кнопки Сохранить черновик / Предпросмотр / Опубликовать

**Context**: Стандартный формат новости: мама заполняет только заголовок и текст, остальное само

- **Depends on**: T009
- **Requirements**: FR-006, FR-008
- **Entities**: blog-post, blog-category, blog-post-artwork
- **Contracts**: admin-blog, admin-blog-categories

**Steps**:

1. **Список** — frontend/app/admin/blog/page.tsx в AdminPageShell + AdminAuthGuard: кнопка «Написать новость», таблица/карточки: заголовок / статус Черновик|Запланировано|Опубликовано / дата
2. **Форма** — frontend/app/admin/blog/[id]/page.tsx (id=new для новой) + components/blog/admin/PostEditor.tsx; RichTextEditor через next/dynamic ssr:false; CoverUpload.tsx (кнопка «Выбрать обложку»)
3. **Блок «Дополнительно»** — components/blog/admin/AdvancedFields.tsx (details/summary): рубрика (по умолчанию Новости) / адрес (slugifyTitle из заголовка; заблокирован после публикации) / анонс / SEO с счётчиками / дата публикации / ArtworkPicker.tsx
4. **Публикация** — PublishBar.tsx — sticky внизу на мобильном; «Опубликовать» показывает мягкий чек-лист (нет обложки/анонса) с кнопкой «Опубликовать всё равно»; «Предпросмотр» — открыть /blog/preview в новой вкладке или модалку с ArticleBody
5. **Автосохранение** — hooks/useDraftAutosave.ts: localStorage blog-draft:{id|new} каждые 5 с (try/catch); при открытии — «Восстановить несохранённый текст?»
6. **Пункт меню админки** — frontend/app/admin/page.tsx — добавить «Блог / Новости» рядом с отзывами
7. **Тесты** — PostEditor.test.tsx: без рубрики уходит default; чек-лист показывается; адрес заблокирован у опубликованной; восстановление черновика

**Technical Notes**:

- `frontend/components/AdminPageShell.tsx`: Общая оболочка админки
- `frontend/lib/artworkSlug.ts`: slugifyTitle для адреса

**Acceptance Criteria**:

- [x] `AC-1` Новость публикуется только с заголовком и текстом; на 360px кнопки видны; восстановление черновика работает

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Новая новость: заголовок и текст
  - When: Нажать «Опубликовать» → «Опубликовать всё равно»
  - Then: Статус Опубликовано; Рубрика Новости
  - Verification: automated

## `T011` BlogPublicController [P] [US1]

GET api/public/blog / api/public/blog/{slug} / api/public/blog/categories

**Context**: Публичные страницы блога получают данные отсюда

- **Depends on**: T006
- **Requirements**: FR-001, FR-002, FR-004, FR-005
- **Entities**: blog-post, blog-category, blog-post-artwork, artwork
- **Contracts**: public-blog-list, public-blog-post, public-blog-categories

**Steps**:

1. **Контроллер** — backend/MomSite.API/Controllers/BlogPublicController.cs [Route("api/public/blog")]; DTO в DTOs/Blog/BlogPublicDtos.cs; 404 для черновика / будущей / неизвестной / пустой рубрики
2. **Тесты** — Tests/Blog/BlogPublicControllerTests.cs: 404 черновика; список 12/стр; фильтр рубрики; категории только непустые

**Technical Notes**:

- `backend/MomSite.API/Controllers/PublicController.cs`: Маршрут api/Public/...; новый контроллер на api/public/blog не конфликтует — проверить тестом

**Acceptance Criteria**:

- [x] `AC-1` Тесты зелёные

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Черновик с адресом test
  - When: GET /api/public/blog/test
  - Then: 404
  - Verification: automated

## `T012` Страница статьи /blog/[slug] [US1]

SSR + ISR 300 с: обложка (priority) / заголовок / дата / рубрика / время чтения / тело / «Работы по теме» / кнопка связи

**Context**: Главная ценность для посетителя и поисковиков

- **Depends on**: T008, T011
- **Requirements**: FR-001, FR-004, FR-012
- **Entities**: blog-post, artwork
- **Contracts**: public-blog-post

**Steps**:

1. **Страница** — frontend/app/blog/[slug]/page.tsx (export const revalidate = 300; notFound() на 404)
2. **Компоненты** — components/blog/ArticleBody.tsx (типографика, img loading=lazy, без dangerouslySet для непроверенного — HTML уже очищен сервером) / RelatedArtworks.tsx (проданные — без призыва купить, ссылки через buildArtworkSlug) / BlogCta.tsx → /contacts + reachGoal(Goals.…)
3. **Тесты** — components/blog/*.test.tsx: проданная работа без CTA; клик CTA вызывает reachGoal

**Technical Notes**:

- `frontend/lib/analytics.ts`: reachGoal / Goals — добавить цель blog_cta

**Acceptance Criteria**:

- [x] `AC-1` Статья открывается; один H1; блок работ и CTA на месте

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Статья с 3 работами, одна продана
  - When: Рендер RelatedArtworks
  - Then: 3 карточки; у проданной нет «Купить»
  - Verification: automated

## `T013` Список /blog и рубрики /blog/category/[slug] + меню [P] [US2]

Карточки по 12 с пагинацией ?page=; страница рубрики с описанием; ссылка «Блог» в Navigation и Footer

**Context**: Посетитель должен найти статьи из меню

- **Depends on**: T008, T011
- **Requirements**: FR-005
- **Entities**: blog-post, blog-category
- **Contracts**: public-blog-list, public-blog-categories

**Steps**:

1. **Страницы** — frontend/app/blog/page.tsx и app/blog/category/[slug]/page.tsx; components/blog/PostCard.tsx / Pagination.tsx / CategoryTabs.tsx
2. **Меню** — components/Navigation.tsx и Footer.tsx — пункт «Блог»; обновить Navigation.test.tsx / Footer.test.tsx

**Technical Notes**:

- `frontend/components/Navigation.tsx`: Существующие тесты меню надо обновить, не удалять

**Acceptance Criteria**:

- [x] `AC-1` Пагинация и фильтр работают; ссылка «Блог» в меню и футере

**Test Scenarios**:

- `TS-1` (unit)
  - Given: 15 статей
  - When: Открыть /blog?page=2
  - Then: 3 карточки
  - Verification: automated

## `T014` Метаданные и разметка статьи [P] [US4]

generateMetadata (title / description / canonical / OG article) и BlogPostJsonLd (BlogPosting + BreadcrumbList); Person в StructuredData получает @id

**Context**: Чтобы Яндекс и соцсети правильно показывали статьи

- **Depends on**: T012
- **Requirements**: FR-009
- **Entities**: blog-post
- **Contracts**: public-blog-post

**Steps**:

1. **Метаданные** — generateMetadata в app/blog/[slug]/page.tsx и страницах списка; SeoTitle ?? Title; SeoDescription ?? Excerpt
2. **JSON-LD** — components/blog/BlogPostJsonLd.tsx; author {"@id":"https://angelamoiseenko.ru/#artist"}; в components/StructuredData.tsx добавить только @id у Person
3. **Тест** — BlogPostJsonLd.test.tsx — валидный JSON и нужные поля

**Technical Notes**:

- `frontend/components/StructuredData.tsx`: Менять только @id

**Acceptance Criteria**:

- [x] `AC-1` В исходнике статьи canonical / og:type article / ld+json BlogPosting

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Статья без SeoTitle
  - When: generateMetadata
  - Then: title = Title
  - Verification: automated

## `T015` Sitemap и RSS [P] [US4]

Статьи и непустые рубрики в app/sitemap.ts с lastModified = UpdatedAt; app/blog/rss.xml/route.ts

**Context**: Быстрая индексация и раздача в Дзен

- **Depends on**: T008, T011
- **Requirements**: FR-010
- **Entities**: blog-post, blog-category
- **Contracts**: blog-rss, public-blog-list

**Steps**:

1. **Sitemap** — frontend/app/sitemap.ts — /blog + статьи + рубрики; ошибка API не ломает sitemap (try/catch); обновить app/sitemap.test.ts
2. **RSS** — frontend/app/blog/rss.xml/route.ts: 50 последних, CDATA для content:encoded, enclosure обложки, revalidate 300; тест route.test.ts

**Technical Notes**:

- `frontend/app/sitemap.ts`: Уже собирает галерею через hooks/useApi

**Acceptance Criteria**:

- [x] `AC-1` sitemap.test и rss тест зелёные; черновиков нет

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Опубликованная статья и черновик
  - When: GET /blog/rss.xml
  - Then: Один item
  - Verification: automated

## `T016` IndexNow [P] [US4]

IIndexNowClient + реализация; вызов после публикации/правки в фоне; ключ-файл app/indexnow-key.txt/route.ts из env

**Context**: Яндекс узнаёт о новой статье сразу; сбой не мешает маме публиковать

- **Depends on**: T007
- **Requirements**: FR-011
- **Entities**: blog-post
- **Contracts**: indexnow-client

**Steps**:

1. **Клиент** — Core/Interfaces/IIndexNowClient.cs; Infrastructure/Blog/IndexNowClient.cs (AddHttpClient("IndexNow")); INDEXNOW_KEY пуст → no-op; исключения → ILogger.Warning
2. **Вызов** — BlogAdminController после успешного сохранения опубликованной: _ = Task.Run с новым scope; URL статьи / рубрики / /blog
3. **Ключ-файл и env** — frontend/app/indexnow-key.txt/route.ts отдаёт process.env.INDEXNOW_KEY (404 если нет); INDEXNOW_KEY добавить в docker-compose.prod.yml как ${INDEXNOW_KEY} (значение — только в секретах)
4. **Тесты** — Tests/Blog/IndexNowClientTests.cs: без ключа HTTP не вызывается; 500 от сервиса — исключения нет

**Technical Notes**:

- `docker-compose.prod.yml`: Ключ не хардкодить

**Acceptance Criteria**:

- [x] `AC-1` Тесты зелёные; публикация успешна при недоступном IndexNow

**Test Scenarios**:

- `TS-1` (unit)
  - Given: INDEXNOW_KEY не задан
  - When: NotifyAsync
  - Then: disabled_no_key; HTTP-запросов нет
  - Verification: automated

## `T017` E2E и финальная проверка [US3]

frontend/e2e/blog.spec.ts: войти → написать новость с фото → опубликовать → увидеть; черновик → 404; мобильная ширина 360

**Context**: Подтверждение что мама справится без подсказок и всё связано

- **Depends on**: T010, T012, T013, T014, T015, T016
- **Requirements**: FR-001, FR-002, FR-006
- **Entities**: blog-post
- **Contracts**: admin-blog, public-blog-post

**Steps**:

1. **E2E** — e2e/blog.spec.ts по образцу e2e/admin.spec.ts; viewport 360x740 для редактора
2. **Полный прогон** — dotnet test; npm test; npx tsc --noEmit; npm run build; проверить что TipTap нет в публичных чанках
3. **Quickstart** — Пройти сценарии specs/006-blog/quickstart.md 1–16; 17 (юзабилити с мамой) — после деплоя с «добро» пользователя

**Technical Notes**:

- `frontend/e2e/admin.spec.ts`: Образец логина в админку

**Acceptance Criteria**:

- [ ] `AC-1` Все тесты и сборка зелёные; quickstart 1–16 пройден

**Test Scenarios**:

- `TS-1` (e2e)
  - Given: Админ на телефоне 360px
  - When: Пишет новость с фото и публикует
  - Then: Новость на /blog/<адрес> с фото
  - Verification: automated

