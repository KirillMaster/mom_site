<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     This file is rendered from the corresponding .yaml artifact and will be
     overwritten the next time it is regenerated. Edit the .yaml source instead. -->

# Tasks: 005-catalog-import

## `T001` Подключить ClosedXML в Infrastructure [P] [US1]

Добавить пакет ClosedXML (MIT) в MomSite.Infrastructure и создать каталоги модуля

**Context**: Парсер xlsx нужен всем историям импорта; пакета в проекте ещё нет (R1)

- **Depends on**: —
- **Requirements**: FR-001
- **Entities**: —
- **Contracts**: —

**Steps**:

1. **Добавить пакет** — cd backend && dotnet add MomSite.Infrastructure package ClosedXML
2. **Создать каталоги** — backend/MomSite.Infrastructure/Catalog/ и backend/MomSite.Tests/Catalog/
3. **Собрать решение** — cd backend && dotnet build

**Technical Notes**:

- `backend/MomSite.Infrastructure/MomSite.Infrastructure.csproj`: Сейчас нет ClosedXML
- `backend/MomSite.Tests/MomSite.Tests.csproj`: Тесты net9.0; Infrastructure приходит транзитивно

**Acceptance Criteria**:

- [ ] `AC-1` dotnet build зелёный с ClosedXML
- [ ] `AC-2` Версия пакета записана в research.md R1

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Пакет добавлен
  - When: dotnet build
  - Then: 0 ошибок
  - Verification: automated

## `T002` Проверить/добавить поля характеристик Artwork (условная, после merge 008) [US1]

Убедиться, что после merge 008-conversion-quick-wins в Artwork есть Status (ArtworkStatus), WidthCm, HeightCm, Year, Support, Technique и ApplyStatus; если чего-то нет, добавить по data-model 005

**Context**: 008 вводит эти поля по тому же data-model; дублировать модель и миграцию нельзя, но без полей импорту нечего писать

- **Depends on**: —
- **Requirements**: FR-014, FR-002
- **Entities**: artwork
- **Contracts**: —

**Steps**:

1. **Проверить наличие** — grep по backend/MomSite.Core/Models/Artwork.cs и ArtworkStatus.cs на Status, WidthCm, HeightCm, Year, Support, Technique, ApplyStatus; ls backend/MomSite.Infrastructure/Data/Migrations
2. **Если поля есть, сверить типы** — WidthCm/HeightCm в 005 это decimal numeric(6,1) (допускается 50,5); в 008 заявлены целыми. Если в БД int, приведение типа делается в миграции T003 (AlterColumn), не отдельной миграцией
3. **Если полей нет, добавить** — enum ArtworkStatus (Available, Sold, PrivateCollection, Unavailable, NotForSale, NotMine) в Core/Models/ArtworkStatus.cs; в Artwork: Status (default Available), WidthCm/HeightCm decimal?, Year int?, Support/Technique string? (до 100); ApplyStatus(status) выставляет Status и IsForSale = Status == Available
4. **Сконфигурировать в контексте** — ApplicationDbContext: Status HasConversion<int>, WidthCm/HeightCm numeric(6,1), Support/Technique HasMaxLength(100)
5. **Миграция при отсутствии полей** — dotnet ef migrations add AddArtworkCharacteristics -p MomSite.Infrastructure -s MomSite.API -o Data/Migrations; data-migration Status = IsForSale ? Available : NotForSale. Если 008 уже мигрировала, шаг пропустить и отметить в research.md R3

**Technical Notes**:

- `backend/MomSite.Core/Models/Artwork.cs`: Сейчас: Id/Title/Description(1000)/ImagePath/ThumbnailPath/Price/IsForSale/CreatedAt/UpdatedAt/CategoryId/Images
- `backend/MomSite.Infrastructure/Data/ApplicationDbContext.cs`: Блок конфигурации Artwork
- `backend/MomSite.Infrastructure/Data/Migrations/`: Последняя миграция AddBlog
- `specs/008-conversion-quick-wins/data-model.yaml`: Источник полей в 008 (ветка не в main)

**Acceptance Criteria**:

- [ ] `AC-1` В Artwork есть все поля, WidthCm/HeightCm допускают дробь
- [ ] `AC-2` ApplyStatus держит IsForSale == (Status == Available)
- [ ] `AC-3` Нет двух миграций с одинаковыми колонками

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Артворк со Status=Sold
  - When: ApplyStatus(Available), затем ApplyStatus(NotMine)
  - Then: IsForSale true, затем false
  - Verification: automated
- `TS-2` (integration)
  - Given: Чистая БД
  - When: dotnet ef database update
  - Then: Колонки созданы, Status выведен из IsForSale
  - Verification: automated

## `T003` Доп. поля Artwork и миграция AddArtworkCatalogFields [US1]

Добавить ShortDescription, IsFeatured, NeedsReshoot, IsPublished, расширить Description до 5000, при необходимости привести WidthCm/HeightCm к numeric(6,1); единые лимиты ArtworkFieldRules

**Context**: Эти поля есть только в 005; общие лимиты нужны и импорту, и форме админки

- **Depends on**: T002
- **Requirements**: FR-013, FR-002
- **Entities**: artwork
- **Contracts**: —

**Steps**:

1. **Добавить поля** — Artwork: ShortDescription string? [MaxLength(300)], IsFeatured=false, NeedsReshoot=false, IsPublished=true; Description [MaxLength(5000)]
2. **Единые лимиты** — backend/MomSite.Core/Models/ArtworkFieldRules.cs: TitleMax=200, DescriptionMax=5000, ShortDescriptionMax=300, SupportMax=100, TechniqueMax=100, SizeMin=1, SizeMax=1000, YearMin=1950, IsYearValid(int, DateTime now)
3. **Настроить контекст** — ApplicationDbContext: Description HasMaxLength(5000), ShortDescription HasMaxLength(300), IsPublished HasDefaultValue(true); при int-колонках WidthCm/HeightCm AlterColumn до numeric(6,1)
4. **Миграция** — dotnet ef migrations add AddArtworkCatalogFields -p MomSite.Infrastructure -s MomSite.API -o Data/Migrations; существующие работы IsPublished=true
5. **Проверить** — dotnet build && dotnet test

**Technical Notes**:

- `backend/MomSite.Core/Models/Artwork.cs`: Description сейчас [MaxLength(1000)]
- `backend/MomSite.Infrastructure/Data/ApplicationDbContext.cs`: Description HasMaxLength(1000) заменить на 5000
- `backend/MomSite.Core/Models/ArtworkFieldRules.cs`: Новый файл, до 200 строк (P3)

**Acceptance Criteria**:

- [ ] `AC-1` Миграция применяется на БД с данными, текущие работы IsPublished=true
- [ ] `AC-2` Description принимает 5000 символов, ShortDescription 300
- [ ] `AC-3` ArtworkFieldRules единственное место лимитов

**Test Scenarios**:

- `TS-1` (integration)
  - Given: БД с 3 работами
  - When: Применить миграцию
  - Then: Все 3 с IsPublished=true, IsFeatured=false, NeedsReshoot=false
  - Verification: automated
- `TS-2` (unit)
  - Given: Годы 1949, 1950, текущий+1
  - When: IsYearValid
  - Then: false, true, false
  - Verification: automated

## `T004` Единый фильтр видимости Visible() для публичных выборок [US4]

Расширить существующий IQueryable<Artwork>.Visible(): IsPublished && Status != NotMine; применить в публичных запросах

**Context**: Скрытые работы не должны попадать в галерею, главную, sitemap и ссылки блога; фильтр один на весь сайт (R7)

- **Depends on**: T003
- **Requirements**: FR-011, FR-008
- **Entities**: artwork
- **Contracts**: public-artworks

**Steps**:

1. **Расширить расширение** — ArtworkQueryExtensions.Visible: .Where(a => a.IsPublished && a.Status != ArtworkStatus.NotMine); убрать комментарий «005 добавит»; второе определение не создавать
2. **Применить в PublicController** — Запрос главной (~строка 42) и GetGalleryData (~строка 137): _context.Artworks.Visible()
3. **Проверить остальные места** — grep Artworks по backend/MomSite.API и Infrastructure: публичные выборки идут через Visible() (BlogQueries уже), админские нет
4. **Тесты** — backend/MomSite.Tests/PublicControllerTests.cs: скрытые работы отсутствуют

**Technical Notes**:

- `backend/MomSite.Infrastructure/Data/ArtworkQueryExtensions.cs`: Сейчас Visible() => query (создан в 006)
- `backend/MomSite.API/Controllers/PublicController.cs`: Home и gallery читают _context.Artworks без фильтра
- `backend/MomSite.Infrastructure/Blog/BlogQueries.cs`: Уже использует Visible(), менять не нужно

**Acceptance Criteria**:

- [ ] `AC-1` В решении одно определение Visible() для Artwork
- [ ] `AC-2` /api/public/gallery и главная не возвращают IsPublished=false и NotMine
- [ ] `AC-3` Админский список видит все работы

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Работы: опубликованная, черновик, NotMine
  - When: GET /api/public/gallery
  - Then: Только опубликованная
  - Verification: automated
- `TS-2` (integration)
  - Given: Те же работы
  - When: GET /api/admin/artworks
  - Then: Все три
  - Verification: automated

## `T005` Журнал импорта и контракт сервиса в Core [US1]

CatalogImportLog, ICatalogImportService, типы отчёта ImportReport/RowReport/ImportSummary, миграция AddCatalogImportLog

**Context**: Сервису, контроллеру и откату нужны общие типы отчёта и журнал снимков

- **Depends on**: T003
- **Requirements**: FR-005, FR-006
- **Entities**: catalog-import-log, import-report
- **Contracts**: catalog-import-service

**Steps**:

1. **Модель журнала** — backend/MomSite.Core/Models/CatalogImportLog.cs: Id, CreatedAt (UTC), UserName, FileName, FileSha256, Summary (jsonb), Snapshot (jsonb [{artworkId, field, oldValue}]), CreatedIds (jsonb int[]), RolledBackAt?
2. **Типы отчёта** — backend/MomSite.Core/Models/Catalog/ImportReport.cs (records): ImportSummary, RowReport{Row,Sheet,Id,Title,Changes[{Field,Old,New}],Issues[{Level,Column,Message}],Comment}, ImportReport{Summary,Rows,LogId}, FileError enum (not_xlsx, file_unreadable, sheet_missing, required_header_missing, too_many_rows)
3. **Интерфейс** — backend/MomSite.Core/Interfaces/ICatalogImportService.cs: ImportAsync(Stream file, string fileName, bool dryRun, string userName, CancellationToken) и RollbackLastAsync(CancellationToken); результат Report | FileInvalid(error) | Busy
4. **DbSet и конфигурация** — ApplicationDbContext: DbSet<CatalogImportLog>; jsonb для Snapshot/CreatedIds/Summary с конвертером, совместимым с тестовыми провайдерами; индекс CreatedAt
5. **Миграция** — dotnet ef migrations add AddCatalogImportLog -p MomSite.Infrastructure -s MomSite.API -o Data/Migrations

**Technical Notes**:

- `backend/MomSite.Core/Interfaces/`: Рядом IBlogService.cs, стиль интерфейсов
- `backend/MomSite.Infrastructure/Data/ApplicationDbContext.cs`: Тесты на InMemory/Sqlite, jsonb делать совместимо

**Acceptance Criteria**:

- [ ] `AC-1` Таблица CatalogImportLog создаётся миграцией
- [ ] `AC-2` Типы Core не зависят от ClosedXML/EF
- [ ] `AC-3` Каждый файл до 200 строк

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Чистая БД
  - When: dotnet ef database update
  - Then: Таблица CatalogImportLog существует
  - Verification: automated
- `TS-2` (integration)
  - Given: Лог со Snapshot из 2 элементов
  - When: Сохранить и прочитать
  - Then: Snapshot и CreatedIds восстановлены
  - Verification: automated

## `T006` HeaderMap: нормализация заголовков и поиск колонок [P] [US1]

Чистая функция поиска колонок по заголовку строки 1: trim, регистр, ё/е, схлопывание пробелов; обязательные ID и Название

**Context**: Порядок колонок в таблице не гарантирован, лишние колонки допустимы

- **Depends on**: T001
- **Requirements**: FR-001
- **Entities**: import-report
- **Contracts**: catalog-import-service-impl

**Steps**:

1. **Создать класс** — backend/MomSite.Infrastructure/Catalog/HeaderMap.cs: Build(IEnumerable<string?> headers) -> HeaderMap{TryGet(CatalogColumn), Missing}
2. **Описать колонки** — enum CatalogColumn (Id, Title, Price, Status, WidthCm, HeightCm, Year, Support, Technique, ShortDescription, Description, IsFeatured, NeedsReshoot, Comment, Keep, WhereWhen) и словарь нормализованных заголовков из design-notes («Цена, ₽», «⭐ Сильная работа» и т.д.)
3. **Тесты** — backend/MomSite.Tests/Catalog/HeaderMapTests.cs: регистр, ё/е, пробелы, перестановка, лишние колонки, нет ID, нет Название

**Technical Notes**:

- `scripts/catalog/build_catalog.py`: Источник точных заголовков генератора
- `specs/005-catalog-import/design-notes.md`: Таблица колонок v1

**Acceptance Criteria**:

- [ ] `AC-1` Колонки находятся независимо от порядка и регистра
- [ ] `AC-2` Нет ID или Название даёт required_header_missing
- [ ] `AC-3` Нет побочных эффектов

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Заголовки «ЦЕНА, ₽ », «название», «id» в другом порядке
  - When: HeaderMap.Build
  - Then: Все три колонки найдены
  - Verification: automated
- `TS-2` (unit)
  - Given: Нет колонки ID
  - When: HeaderMap.Build
  - Then: Missing содержит Id
  - Verification: automated

## `T007` ValueParsers: цена, размеры, год, статус, флаги, очистка [P] [US1]

Чистые функции разбора значений ячеек по контракту v1 с результатом Set(value) | Keep | Clear | Warn(msg)

**Context**: Мама пишет «150 000 ₽», «2017г.», «50,5», «продана»; мусор не должен ронять импорт

- **Depends on**: T003
- **Requirements**: FR-002, FR-003, FR-004
- **Entities**: artwork
- **Contracts**: catalog-import-service-impl

**Steps**:

1. **Создать парсеры** — backend/MomSite.Infrastructure/Catalog/ValueParsers.cs (до 200 строк, при необходимости разделить): ParsePrice, ParseSize, ParseYear, ParseStatus, ParseFlag, ParseText(maxLen)
2. **Правила** — Пусто Keep; «-» Clear; цена: пробелы/nbsp, ₽, запятая, «по запросу» null; размер: запятая в точку, диапазон ArtworkFieldRules; год: «2017г.» 2017, диапазон 1950..текущий; статус: без регистра, 6 русских значений; флаг: да/+/1/true и нет/-/0/false; текст сверх лимита Warn без обрезки
3. **Тесты** — backend/MomSite.Tests/Catalog/ValueParsersTests.cs: Theory, границы 1/1000/1949/1950, мусор Warn, «-» Clear

**Technical Notes**:

- `backend/MomSite.Core/Models/ArtworkFieldRules.cs`: Лимиты отсюда (T003)
- `specs/005-catalog-import/design-notes.md`: Таблица парсинга

**Acceptance Criteria**:

- [ ] `AC-1` «150 000 ₽», «150000», «150 000,00» дают 150000; «по запросу» даёт null
- [ ] `AC-2` «2017г.» даёт 2017; «50,5» даёт 50.5; «продана» даёт Sold
- [ ] `AC-3` Мусор даёт Warn без исключения
- [ ] `AC-4` «-» Clear, пустая ячейка Keep

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Цены: «150 000 ₽», «по запросу», «abc»
  - When: ParsePrice
  - Then: 150000; null; Warn
  - Verification: automated
- `TS-2` (unit)
  - Given: «-» в Технике
  - When: ParseText
  - Then: Clear
  - Verification: automated
- `TS-3` (unit)
  - Given: Короткое описание 301 символ
  - When: ParseText(300)
  - Then: Warn, значение не изменено
  - Verification: automated

## `T008` RowValidator: проверка строк листов и RowResult [US1]

Валидатор строки: ID, дубли ID в файле, новая работа, название, предупреждения; лист «Фото с выставок»

**Context**: Каждая строка даёт изменения и замечания, плохая строка не останавливает остальные

- **Depends on**: T006, T007
- **Requirements**: FR-003, FR-007, FR-008
- **Entities**: artwork, import-report
- **Contracts**: catalog-import-service-impl

**Steps**:

1. **Создать валидатор** — backend/MomSite.Infrastructure/Catalog/RowValidator.cs и RowResult.cs: вход значения строки по HeaderMap, существующие ID, встреченные ID, существующие названия; выход RowResult{Row,Sheet,Id?,Title,DesiredChanges,Issues}
2. **Лист «Каталог»** — ID не int>0 или неизвестный error (строка пропущена); повтор ID error «дубль ID»; пустой ID новая работа: Title обязателен, совпадение названия без регистра warning; полностью пустые строки пропускаются; «Комментарий» только в отчёт
3. **Лист «Фото с выставок»** — ID + «Оставить на сайте?»: нет IsPublished=false; «Где и когда» непусто в Description
4. **Статус NotMine** — Желаемое изменение Status=NotMine (скрытие через Visible), не удаление
5. **Тесты** — backend/MomSite.Tests/Catalog/RowValidatorTests.cs по EC-2, EC-3, EC-5, EC-6, EC-7

**Technical Notes**:

- `specs/005-catalog-import/design-notes.md`: Правила листов и ошибок
- `scripts/catalog/build_catalog.py`: Хвост из пустых заготовленных строк (EC-7)

**Acceptance Criteria**:

- [ ] `AC-1` Неизвестный и повторный ID дают error, остальные строки обрабатываются
- [ ] `AC-2` Пустая строка не попадает в отчёт
- [ ] `AC-3` Новая работа без названия error; с дублем названия warning

**Test Scenarios**:

- `TS-1` (unit)
  - Given: ID 999 (нет в БД) и валидная строка
  - When: RowValidator для обеих
  - Then: Первая error, вторая без issues
  - Verification: automated
- `TS-2` (unit)
  - Given: Два раза ID 5
  - When: RowValidator
  - Then: Вторая error «дубль ID»
  - Verification: automated

## `T009` ChangePlanner: diff с текущими работами [US1]

Сравнить желаемые значения с текущими Artwork и построить план только изменённых полей (было, стало)

**Context**: Предпросмотр и применение строятся одним планом, чтобы отчёт совпадал с результатом

- **Depends on**: T008
- **Requirements**: FR-005, FR-006
- **Entities**: artwork, import-report
- **Contracts**: catalog-import-service-impl

**Steps**:

1. **Создать планировщик** — backend/MomSite.Infrastructure/Catalog/ChangePlanner.cs: Plan(IEnumerable<RowResult>, IReadOnlyDictionary<int,Artwork> current) -> ChangePlan{RowReport[], UpdateOps, CreateOps}
2. **Правила diff** — Поле в плане только если отличается; Clear на пустом поле не изменение; Status через ApplyStatus (в diff только Status); строки без изменений и issues считаются skipped
3. **Сводка** — Заполнить ImportSummary: updated/created/skipped/warnings/errors
4. **Тесты** — backend/MomSite.Tests/Catalog/ChangePlannerTests.cs: повтор тех же значений даёт 0 изменений

**Technical Notes**:

- `backend/MomSite.Core/Models/Artwork.cs`: ApplyStatus и поля для сравнения
- `backend/MomSite.Core/Models/Catalog/ImportReport.cs`: Типы отчёта (T005)

**Acceptance Criteria**:

- [ ] `AC-1` В RowReport.Changes только реально изменённые поля
- [ ] `AC-2` Повторный прогон того же входа даёт 0 updated и 0 created
- [ ] `AC-3` Файл до 200 строк

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Работа с Price=100
  - When: Plan с Price=100
  - Then: Changes пуст, строка skipped
  - Verification: automated
- `TS-2` (unit)
  - Given: Работа Status=Available
  - When: Plan со Status=Продана
  - Then: Changes=[Status Available в Sold]
  - Verification: automated

## `T010` Чтение xlsx и проверка файла целиком [US1]

WorkbookReader: чтение потока ClosedXML, поиск листов по имени, лимиты, версия шаблона; проверки расширения и ZIP-сигнатуры

**Context**: Любой плохой файл даёт понятную ошибку, а не 500

- **Depends on**: T001, T006
- **Requirements**: FR-001, FR-009
- **Entities**: import-report
- **Contracts**: catalog-import-service-impl, catalog-import-service

**Steps**:

1. **Создать читатель** — backend/MomSite.Infrastructure/Catalog/WorkbookReader.cs: Open(Stream) -> Workbook | FileError; XLWorkbook из Stream, значения через CachedValue (формулы не вычисляются, =IMAGE игнорируются), без сохранения файла
2. **Проверки файла** — расширение .xlsx и ZIP-сигнатура PK\x03\x04 иначе not_xlsx; любое исключение ClosedXML file_unreadable; нет листа «Каталог» sheet_missing; нет ID/Название required_header_missing; более 2000 непустых строк too_many_rows (до валидации)
3. **Версия шаблона** — На листе «Как заполнять» искать ячейку колонки A, начинающуюся с «format:» (генератор пишет «format: v1 (не удаляй эту строку)»), не привязываться к жёсткому A20; не v1 или нет: summary.TemplateVersionMismatch=true и warning (EC-4)
4. **Тесты** — backend/MomSite.Tests/Catalog/WorkbookReaderTests.cs: книги в памяти через ClosedXML и байты csv/мусор/обрезанный zip

**Technical Notes**:

- `scripts/catalog/build_catalog.py`: Строка версии на листе «Как заполнять»
- `backend/MomSite.Tests/Fixtures/catalog/`: Каталог фикстур (T13)

**Acceptance Criteria**:

- [ ] `AC-1` Ошибка чтения не превращается в исключение наружу
- [ ] `AC-2` Лимит строк считается по непустым строкам
- [ ] `AC-3` Нет листа или заголовка даёт соответствующий код ошибки

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Файл .csv
  - When: Open
  - Then: not_xlsx
  - Verification: automated
- `TS-2` (unit)
  - Given: Обрезанный zip
  - When: Open
  - Then: file_unreadable
  - Verification: automated
- `TS-3` (unit)
  - Given: Лист «Каталог» с 2001 заполненной строкой
  - When: Open
  - Then: too_many_rows
  - Verification: automated

## `T011` CatalogImportService: режим предпросмотра и регистрация в DI [US1]

Склеить Reader, Validator, Planner в CatalogImportService (dryRun=true), семафор одного импорта, регистрация в Program.cs

**Context**: Один сервис за интерфейсом нужен контроллеру; предпросмотр не меняет данные

- **Depends on**: T005, T009, T010
- **Requirements**: FR-005, FR-009
- **Entities**: artwork, import-report, catalog-import-log
- **Contracts**: catalog-import-service, catalog-import-service-impl

**Steps**:

1. **Создать сервис** — backend/MomSite.Infrastructure/Catalog/CatalogImportService.cs : ICatalogImportService; dryRun=true читает Artworks AsNoTracking, строит план, возвращает ImportReport без SaveChanges
2. **Блокировка** — статический SemaphoreSlim(1,1); WaitAsync(0) неуспешно даёт Busy
3. **Регистрация** — Program.cs: AddScoped<ICatalogImportService, CatalogImportService>() рядом с IBlogService
4. **Тесты** — backend/MomSite.Tests/Catalog/CatalogImportServicePreviewTests.cs: после предпросмотра БД не изменилась

**Technical Notes**:

- `backend/MomSite.API/Program.cs`: Регистрации сервисов в строках ~155-189
- `backend/MomSite.Infrastructure/Catalog/`: Файлы до 200 строк (P3)

**Acceptance Criteria**:

- [ ] `AC-1` Предпросмотр не вызывает SaveChanges
- [ ] `AC-2` Параллельный запрос получает Busy
- [ ] `AC-3` Сервис зарегистрирован в DI

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Заполненный xlsx и БД с 3 работами
  - When: ImportAsync(dryRun=true)
  - Then: Отчёт со сводкой; БД до и после совпадает
  - Verification: automated
- `TS-2` (integration)
  - Given: Импорт уже выполняется
  - When: Второй ImportAsync
  - Then: Busy
  - Verification: automated

## `T012` CatalogImportController: POST /api/admin/catalog/import (предпросмотр) [US1]

Эндпоинт multipart с [Authorize], RequestSizeLimit 5 МБ, коды 200/400/401/409/413

**Context**: Админка общается с сервисом только через этот эндпоинт

- **Depends on**: T011
- **Requirements**: FR-005, FR-009
- **Entities**: import-report
- **Contracts**: admin-catalog-import

**Steps**:

1. **Создать контроллер** — backend/MomSite.API/Controllers/CatalogImportController.cs: [ApiController][Route("api/admin/catalog")][Authorize]; POST import ([FromForm] IFormFile file, [FromQuery] bool dryRun = true); [RequestSizeLimit(5*1024*1024)]
2. **Маппинг ответов** — report 200 {summary, rows, logId?}; FileInvalid 400 {error, message по-русски}; Busy 409; превышение размера 413 (лимит атрибутом на action, глобальный MaxRequestBodySize 100 МБ не снижать)
3. **userName** — User.Identity?.Name ?? "admin"
4. **Тесты** — backend/MomSite.Tests/Catalog/CatalogImportControllerTests.cs по образцу Blog/BlogAdminControllerTests.cs (WebApplicationFactory, 401 без токена)

**Technical Notes**:

- `backend/MomSite.API/Controllers/BlogAdminController.cs`: Образец [Authorize]-контроллера
- `backend/MomSite.Tests/Blog/BlogAdminControllerTests.cs`: Образец тестов с коллекцией AdminEnvIntegration
- `backend/MomSite.API/Program.cs`: Kestrel MaxRequestBodySize 100 МБ

**Acceptance Criteria**:

- [ ] `AC-1` Запрос без JWT даёт 401
- [ ] `AC-2` Файл 6 МБ даёт 413, .csv даёт 400 с понятным текстом
- [ ] `AC-3` Нет 500 на наборе испорченных файлов

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Нет токена
  - When: POST /api/admin/catalog/import
  - Then: 401
  - Verification: automated
- `TS-2` (integration)
  - Given: Валидный xlsx, dryRun=true
  - When: POST
  - Then: 200 с summary и rows
  - Verification: automated
- `TS-3` (integration)
  - Given: Файл 6 МБ
  - When: POST
  - Then: 413
  - Verification: automated

## `T013` Фикстуры xlsx и интеграционные тесты предпросмотра [US1]

Фикстуры (выгрузка build_catalog.py v1, версия Google Sheets, 10 испорченных файлов) и прогон предпросмотра

**Context**: SC-002: 0 ошибок сервера на 10 испорченных файлах; экспорт Google не должен ломать заголовки

- **Depends on**: T012
- **Requirements**: FR-001, FR-002, FR-009
- **Entities**: import-report
- **Contracts**: admin-catalog-import

**Steps**:

1. **Фикстура v1** — python scripts/catalog/build_catalog.py, результат в backend/MomSite.Tests/Fixtures/catalog/catalog_v1.xlsx; CopyToOutputDirectory в MomSite.Tests.csproj
2. **Фикстура Google Sheets** — backend/MomSite.Tests/Fixtures/catalog/catalog_gsheets.xlsx: экспорт того же файла из Google Sheets (нужен ручной шаг пользователя; до этого тест Skip с причиной)
3. **Испорченные файлы** — В тесте в памяти: csv, пустой файл, обрезанный zip, нет листа, нет ID, 2001 строка, формулы =IMAGE, дубли ID, мусор в ячейках, unicode/emoji
4. **Тесты** — backend/MomSite.Tests/Catalog/CatalogImportFixturesTests.cs: ни один не даёт 500; AS-2 (150 000 ₽, 2017г., 50,5)

**Technical Notes**:

- `backend/MomSite.Tests/MomSite.Tests.csproj`: ItemGroup для Fixtures/catalog/*.xlsx
- `scripts/catalog/build_catalog.py`: Генератор шаблона

**Acceptance Criteria**:

- [ ] `AC-1` 10 испорченных файлов дают 400/200, не 500
- [ ] `AC-2` Фикстура v1 разбирается, распознаваемые значения без warnings
- [ ] `AC-3` Фикстура Google Sheets добавлена либо тест явно Skip

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Фикстура v1, частично заполненная
  - When: Предпросмотр
  - Then: Сводка корректна, данные не изменены
  - Verification: automated
- `TS-2` (integration)
  - Given: 10 испорченных файлов
  - When: Предпросмотр каждого
  - Then: Нет 500
  - Verification: automated

## `T014` Типы и API-клиент каталога во фронтенде [P] [US1]

types/catalog.ts и lib/catalogApi.ts: preview/apply/rollback

**Context**: UI-странице нужен типизированный клиент, общий для US1-US3

- **Depends on**: —
- **Requirements**: FR-005
- **Entities**: import-report
- **Contracts**: admin-catalog-import

**Steps**:

1. **Типы** — frontend/types/catalog.ts: ImportSummary, RowReport, FieldChange, ImportIssue, ImportReport, RollbackResult по data-model import-report
2. **Клиент** — frontend/lib/catalogApi.ts: adminCatalog.preview(file), apply(file), rollback(); FormData multipart, токен как в lib/blogApi.ts; catalogErrorMessage(e) показывает message из 400
3. **Тесты** — frontend/lib/catalogApi.test.ts по образцу lib/blogApi.test.ts, если такой есть, иначе с моком fetch

**Technical Notes**:

- `frontend/lib/blogApi.ts`: Образец admin-клиента с токеном
- `frontend/types/blog.ts`: Образец типов

**Acceptance Criteria**:

- [ ] `AC-1` Клиент возвращает типизированный отчёт
- [ ] `AC-2` Текст ошибки 400 доходит до UI
- [ ] `AC-3` tsc --noEmit без ошибок

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Мок fetch 200 с summary
  - When: adminCatalog.preview(file)
  - Then: Возвращён объект отчёта
  - Verification: automated
- `TS-2` (unit)
  - Given: Мок 400
  - When: preview
  - Then: Ошибка с message
  - Verification: automated

## `T015` Страница /admin/catalog: загрузка и предпросмотр [US1]

Страница с выбором файла, кнопкой «Предпросмотр», сводкой, таблицей diff (только изменённые поля), фильтром «только с ошибками», плиткой на дашборде

**Context**: Админ видит результат до применения, не заглядывая в файл

- **Depends on**: T012, T014
- **Requirements**: FR-005
- **Entities**: import-report
- **Contracts**: admin-catalog-import

**Steps**:

1. **Создать страницу** — frontend/app/admin/catalog/page.tsx ('use client', AdminAuthGuard как в frontend/app/admin/blog/page.tsx); таблица в frontend/components/admin/CatalogDiffTable.tsx (до 200 строк)
2. **Состояния** — загрузка, ошибка (catalogErrorMessage), отчёт; сводка: обновится, создастся, пропущено, предупреждений, ошибок; предупреждение о версии шаблона; строки error/warning выделены, чекбокс «только с ошибками»; Комментарий в строке
3. **Плитка** — frontend/app/admin/page.tsx: карточка «Каталог (импорт)» со ссылкой на /admin/catalog рядом с плиткой блога
4. **Тесты** — frontend/app/admin/catalog/page.test.tsx: рендер отчёта, фильтр, ошибка файла

**Technical Notes**:

- `frontend/app/admin/blog/page.tsx`: Образец админ-страницы с AdminAuthGuard
- `frontend/app/admin/page.tsx`: Плитки дашборда (~строка 331)

**Acceptance Criteria**:

- [ ] `AC-1` После загрузки видны сводка и diff только изменённых полей
- [ ] `AC-2` Фильтр «только с ошибками» оставляет строки с error
- [ ] `AC-3` Плитка ведёт на /admin/catalog

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Мок отчёта: 2 строки, одна с error
  - When: Включить фильтр
  - Then: Видна одна строка
  - Verification: automated
- `TS-2` (unit)
  - Given: Мок 400 not_xlsx
  - When: Загрузить файл
  - Then: Понятный текст ошибки
  - Verification: automated

## `T016` ImportApplier: применение плана в транзакции со снимком [US2]

Применить ChangePlan одной транзакцией: обновления, черновики, скрытие; записать CatalogImportLog со снимком старых значений

**Context**: Данные переносятся атомарно и с возможностью отката

- **Depends on**: T011
- **Requirements**: FR-004, FR-006, FR-007, FR-008
- **Entities**: artwork, category, catalog-import-log
- **Contracts**: catalog-import-service-impl

**Steps**:

1. **Создать применитель** — backend/MomSite.Infrastructure/Catalog/ImportApplier.cs: Apply(ChangePlan, userName, fileName, sha256) внутри db.Database.BeginTransactionAsync; строки с error пропущены
2. **Снимок** — До изменений собрать Snapshot [{artworkId, field, oldValue}] только изменяемых полей; CreatedIds для созданных; лог пишется только если изменений больше 0
3. **Правила записи** — Status через artwork.ApplyStatus (IsForSale производная, прямая запись игнорируется); Clear даёт null/false; UpdatedAt = UtcNow только у изменённых
4. **Новые работы** — IsPublished=false, CategoryId = первая Category по DisplayOrder, ImagePath/ThumbnailPath = пустая строка (Required допускает пустую; проверять только у опубликованных), CreatedAt=UtcNow
5. **Подключить в сервис** — CatalogImportService при dryRun=false вызывает Apply, возвращает LogId, считает SHA-256 потока

**Technical Notes**:

- `backend/MomSite.Core/Models/Artwork.cs`: ImagePath/ThumbnailPath [Required]: черновик без фото хранит пустую строку
- `backend/MomSite.Infrastructure/Data/ApplicationDbContext.cs`: Конфигурация обязательных путей

**Acceptance Criteria**:

- [ ] `AC-1` Ошибка в середине применения откатывает всю транзакцию
- [ ] `AC-2` Повторный импорт того же файла даёт 0 изменений и не создаёт лог
- [ ] `AC-3` Новая работа создаётся скрытым черновиком в категории по умолчанию
- [ ] `AC-4` Статус «Не моя работа» скрывает работу, не удаляя

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Файл с 3 валидными и 1 error-строкой
  - When: Apply
  - Then: 3 применены, error-строка пропущена, лог создан
  - Verification: automated
- `TS-2` (integration)
  - Given: Тот же файл повторно
  - When: Apply
  - Then: 0 изменений, логов по-прежнему 1
  - Verification: automated
- `TS-3` (integration)
  - Given: Исключение на 2-й записи
  - When: Apply
  - Then: Ни одна работа не изменена
  - Verification: automated

## `T017` Эндпоинт применения dryRun=false и 409 при конкуренции [US2]

Включить применение в контроллере: logId в ответе, 409 при параллельном импорте

**Context**: Админ применяет тот же файл одним действием после предпросмотра

- **Depends on**: T016, T012
- **Requirements**: FR-006
- **Entities**: catalog-import-log
- **Contracts**: admin-catalog-import

**Steps**:

1. **Ветка dryRun=false** — CatalogImportController.Import передаёт dryRun в ImportAsync; logId только при изменениях больше 0
2. **Конкуренция** — Busy даёт 409 {error:'import_in_progress'}; семафор освобождается в finally
3. **Кэш** — После применения сбросить кэш галереи через ICacheInvalidator, как в ArtworksController, если там есть такой вызов
4. **Тесты** — CatalogImportControllerTests: apply, 409 при двух параллельных, 401

**Technical Notes**:

- `backend/MomSite.API/Controllers/ArtworksController.cs`: Как инвалидируется кэш
- `backend/MomSite.Core/Interfaces/ICacheInvalidator.cs`: Интерфейс сброса кэша

**Acceptance Criteria**:

- [ ] `AC-1` Применение возвращает 200 с logId
- [ ] `AC-2` Второй одновременный запрос получает 409
- [ ] `AC-3` Галерея сайта обновляется (кэш сброшен)

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Валидный xlsx
  - When: POST ?dryRun=false
  - Then: 200 и logId, данные в БД обновлены
  - Verification: automated
- `TS-2` (integration)
  - Given: Два одновременных POST ?dryRun=false
  - When: Отправить оба
  - Then: Один 200, второй 409
  - Verification: automated

## `T018` Кнопка «Применить» и итог применения в админке [US2]

После предпросмотра админ нажимает «Применить» (с подтверждением), видит итог и logId

**Context**: Без этого предпросмотр нельзя довести до результата

- **Depends on**: T015, T017
- **Requirements**: FR-006, FR-007
- **Entities**: import-report
- **Contracts**: admin-catalog-import

**Steps**:

1. **Кнопка** — frontend/app/admin/catalog/page.tsx: «Применить» активна после успешного предпросмотра без file-level ошибки; window.confirm с числом изменений; повторно отправляет тот же File
2. **Итог** — Итоговая сводка, logId, список созданных черновиков с подсказкой «добавьте фото» (ссылка на /admin/artworks)
3. **Защита** — Кнопка disabled во время запроса; 409 даёт «Импорт уже выполняется»; сброс состояния при выборе другого файла
4. **Тесты** — page.test.tsx: apply вызывает adminCatalog.apply с тем же файлом; 409

**Technical Notes**:

- `frontend/app/admin/catalog/page.tsx`: Создана в T015
- `frontend/app/admin/artworks/page.tsx`: Список работ для добавления фото

**Acceptance Criteria**:

- [ ] `AC-1` Применить недоступно до предпросмотра
- [ ] `AC-2` После применения показан итог и подсказка про фото
- [ ] `AC-3` 409 показывает понятное сообщение

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Предпросмотр выполнен
  - When: Нажать «Применить» и подтвердить
  - Then: Вызван apply, показан итог
  - Verification: automated
- `TS-2` (unit)
  - Given: Мок 409
  - When: Применить
  - Then: Сообщение «Импорт уже выполняется»
  - Verification: automated

## `T019` Интеграционные тесты применения: идемпотентность и черновики [US2]

Автотесты применения: статусы, очистка «-», новые работы, дубль названия, скрытие NotMine

**Context**: Подтверждение, что применение не ломает данные и совпадает с предпросмотром

- **Depends on**: T017
- **Requirements**: FR-004, FR-006, FR-007, FR-008
- **Entities**: artwork, catalog-import-log
- **Contracts**: admin-catalog-import

**Steps**:

1. **Тесты применения** — backend/MomSite.Tests/Catalog/CatalogImportApplyTests.cs: предпросмотр и применение дают один набор Changes; «-» очищает Technique; пустая ячейка не трогает поле
2. **Черновики** — Строка без ID создаёт IsPublished=false, пустые пути фото, первую категорию; работа не видна в /api/public/gallery
3. **Скрытие** — NotMine и «нет» в «Фото с выставок» скрывают работу, запись остаётся
4. **Идемпотентность** — Повторное применение: Updated=0, Created=0, LogId=null

**Technical Notes**:

- `backend/MomSite.Tests/Catalog/`: Новые тесты модуля

**Acceptance Criteria**:

- [ ] `AC-1` Отчёт предпросмотра совпадает с фактическими изменениями
- [ ] `AC-2` Черновик не виден публично
- [ ] `AC-3` Идемпотентность подтверждена тестом

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Фикстура v1 и БД из 5 работ
  - When: Предпросмотр, затем применение
  - Then: Changes идентичны; в БД ровно эти изменения
  - Verification: automated
- `TS-2` (integration)
  - Given: Применённый файл
  - When: Применить повторно
  - Then: 0 изменений, лог не создан
  - Verification: automated

## `T020` Откат последнего импорта: сервис и POST /import/rollback [US3]

RollbackLastAsync и эндпоинт: восстановление полей из Snapshot, удаление черновиков без фото, список работ, правленных после импорта

**Context**: Если импорт ошибочен, админ возвращает данные одним действием

- **Depends on**: T017
- **Requirements**: FR-006
- **Entities**: catalog-import-log, artwork
- **Contracts**: admin-catalog-rollback, catalog-import-service

**Steps**:

1. **Логика отката** — backend/MomSite.Infrastructure/Catalog/ImportRollback.cs: последний лог с RolledBackAt=null; в транзакции восстановить поля из Snapshot (Status через ApplyStatus); черновики из CreatedIds без Images удалить, с фото IsPublished=false и warning; работы с UpdatedAt > log.CreatedAt перечислить в editedAfterImport (поле всё равно восстановить); RolledBackAt=UtcNow
2. **Сервис** — CatalogImportService.RollbackLastAsync делегирует; под тем же семафором (занято: Busy)
3. **Контроллер** — POST api/admin/catalog/import/rollback: 200 {restoredFields, deletedDrafts, editedAfterImport}; нет лога 404; Busy 409; [Authorize]
4. **Тесты** — backend/MomSite.Tests/Catalog/ImportRollbackTests.cs и CatalogImportControllerTests: 401/404/409/200

**Technical Notes**:

- `backend/MomSite.Core/Models/ArtworkImage.cs`: Фото черновика через Artwork.Images
- `backend/MomSite.API/Controllers/CatalogImportController.cs`: Добавить action рядом с Import

**Acceptance Criteria**:

- [ ] `AC-1` Откат возвращает значения полей и удаляет черновики без фото
- [ ] `AC-2` Повторный откат возвращает 404
- [ ] `AC-3` Работы, правленные после импорта, перечислены в ответе

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Применённый импорт с 1 новой работой
  - When: POST /rollback
  - Then: Поля восстановлены, черновик удалён
  - Verification: automated
- `TS-2` (integration)
  - Given: Откат уже выполнен
  - When: POST /rollback
  - Then: 404
  - Verification: automated
- `TS-3` (integration)
  - Given: Работа правилась в админке после импорта
  - When: POST /rollback
  - Then: Id в editedAfterImport
  - Verification: automated

## `T021` Кнопка «Откатить последний импорт» в админке [US3]

Кнопка с подтверждением и показом результата отката

**Context**: Откат доступен там же, где применение

- **Depends on**: T018, T020
- **Requirements**: FR-006
- **Entities**: catalog-import-log
- **Contracts**: admin-catalog-rollback

**Steps**:

1. **Кнопка** — frontend/app/admin/catalog/page.tsx: «Откатить последний импорт» с window.confirm; adminCatalog.rollback()
2. **Результат** — restoredFields, deletedDrafts и список editedAfterImport со ссылками; 404 даёт «Откатывать нечего»
3. **Тесты** — page.test.tsx: успешный откат, 404

**Technical Notes**:

- `frontend/lib/catalogApi.ts`: Метод rollback (T014)

**Acceptance Criteria**:

- [ ] `AC-1` После отката показан результат
- [ ] `AC-2` 404 показывает «Откатывать нечего»

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Мок 200
  - When: Откатить
  - Then: Числа и список правленных работ
  - Verification: automated
- `TS-2` (unit)
  - Given: Мок 404
  - When: Откатить
  - Then: Сообщение «Откатывать нечего»
  - Verification: automated

## `T022` Публичный DTO и фронтовые типы с новыми полями [US4]

Добавить в ArtworkDto/ArtworkAdminDto поля характеристик; цена публично только при Available; NeedsReshoot только в админском DTO

**Context**: Карточке и галерее нужны размеры, год, техника и статус из публичного API

- **Depends on**: T004
- **Requirements**: FR-010, FR-014
- **Entities**: artwork
- **Contracts**: public-artworks, admin-artworks

**Steps**:

1. **Бэкенд DTO** — backend/MomSite.API/DTOs/ArtworkDto.cs: Status, WidthCm, HeightCm, Year, Support, Technique, ShortDescription, IsFeatured; ArtworkAdminDto.cs: те же + NeedsReshoot, IsPublished
2. **Маппинг** — DTOs/MappingExtensions.cs ToDto: Price = Status == Available ? Price : null; IsForSale оставить для старых клиентов; админский маппинг в ArtworksController (~строка 48) дополнить
3. **Фронтовые типы** — frontend/lib/api.ts: Artwork и ArtworkDto получают status, widthCm, heightCm, year, support, technique, shortDescription, isFeatured; админский needsReshoot, isPublished
4. **Тесты** — backend/MomSite.Tests/PublicControllerTests.cs: у проданной работы price отсутствует, needsReshoot нет в JSON

**Technical Notes**:

- `backend/MomSite.API/DTOs/MappingExtensions.cs`: ToDto для Artwork (~строка 7)
- `frontend/lib/api.ts`: interface Artwork (~45) и ArtworkDto (~113)

**Acceptance Criteria**:

- [ ] `AC-1` Публичный JSON содержит новые поля и не содержит needsReshoot
- [ ] `AC-2` price отдаётся только при Status=Available
- [ ] `AC-3` IsForSale в ответах сохранён

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Работа Sold с Price=1000
  - When: GET /api/public/gallery
  - Then: price отсутствует, status=Sold
  - Verification: automated
- `TS-2` (integration)
  - Given: Работа Available с Price=1000
  - When: GET /api/public/gallery
  - Then: price=1000
  - Verification: automated

## `T023` Карточка /gallery/[slug]: характеристики, статус, цена по правилу [US4]

Вывести Ш × В см, технику, основу, год, статус-бейдж, цену только при Available, короткое описание как подзаголовок

**Context**: Посетитель видит полные данные о работе перед обращением

- **Depends on**: T022
- **Requirements**: FR-010, FR-014
- **Entities**: artwork
- **Contracts**: public-artworks

**Steps**:

1. **Блок характеристик** — frontend/app/gallery/[slug]/page.tsx: «Ш × В см» (если оба заданы), техника, основа, год; пустые пропускать
2. **Статус и цена** — Available: цена или «по запросу» + AskPriceButton (как сейчас); иначе бейдж статуса без цены; опираться на artwork.status, не только isForSale
3. **Описание** — shortDescription подзаголовком под названием; полное Description ниже
4. **SEO-описание** — frontend/app/gallery/[slug]/artworkSeo.ts buildSeoDescription: shortDescription, иначе первые 160 символов Description
5. **Тесты** — frontend/app/gallery/[slug]/page.test.tsx и frontend/__tests__/artworkSeo.boundary.test.ts

**Technical Notes**:

- `frontend/app/gallery/[slug]/page.tsx`: Сейчас showPriceCta/priceLabel по isForSale (~113)
- `frontend/app/gallery/[slug]/artworkSeo.ts`: buildSeoDescription

**Acceptance Criteria**:

- [ ] `AC-1` У «В наличии» видны размер, техника, основа, год и цена; у «Продана» бейдж вместо цены
- [ ] `AC-2` Пустые поля не рендерят пустых подписей
- [ ] `AC-3` meta description берёт shortDescription или 160 символов Description

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Работа Sold с размерами
  - When: Рендер карточки
  - Then: Бейдж «Продана», цены нет, размер есть
  - Verification: automated
- `TS-2` (unit)
  - Given: shortDescription пуст, Description 500 символов
  - When: buildSeoDescription
  - Then: Первые 160 символов
  - Verification: automated

## `T024` StructuredData: VisualArtwork и Offer [P] [US4]

Дополнить JSON-LD карточки artMedium, artworkSurface, width, height, dateCreated и offers только при цене и статусе Available/Sold

**Context**: Невалидная разметка вредит выдаче (SC-004)

- **Depends on**: T022
- **Requirements**: FR-012
- **Entities**: artwork
- **Contracts**: public-artworks

**Steps**:

1. **Схема работы** — frontend/app/gallery/[slug]/artworkSeo.ts buildArtworkSchema: @type VisualArtwork; artMedium=technique, artworkSurface=support, width/height QuantitativeValue (unitCode CMT), dateCreated=year; поля только если заданы
2. **Offer** — offers {Offer, price, priceCurrency RUB, availability InStock|SoldOut} только при цене и Status Available (InStock) или Sold (SoldOut); иначе offers нет
3. **Тесты** — frontend/__tests__/ArtworkJsonLd.test.tsx и artworkSeo.boundary.test.ts: Available с ценой, Sold, без цены, без размеров

**Technical Notes**:

- `frontend/app/gallery/[slug]/artworkSeo.ts`: buildArtworkSchema
- `frontend/__tests__/ArtworkJsonLd.test.tsx`: Существующие тесты JSON-LD

**Acceptance Criteria**:

- [ ] `AC-1` Available с ценой даёт Offer InStock; Sold SoldOut
- [ ] `AC-2` Без цены или со статусом NotForSale offers нет
- [ ] `AC-3` Нет полей undefined/null в JSON-LD

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Available, price 1000, техника, размеры
  - When: buildArtworkSchema
  - Then: offers InStock, artMedium, width, height
  - Verification: automated
- `TS-2` (unit)
  - Given: Status NotForSale
  - When: buildArtworkSchema
  - Then: Нет offers
  - Verification: automated

## `T025` Галерея и sitemap: статусы и скрытые работы [P] [US4]

GalleryClientPage показывает статус вместо цены у недоступных; sitemap и связанные работы опираются на статус и серверный фильтр

**Context**: Скрытые работы исключены сервером; клиентские места не должны полагаться только на isForSale

- **Depends on**: T022
- **Requirements**: FR-011, FR-014
- **Entities**: artwork
- **Contracts**: public-artworks

**Steps**:

1. **Галерея** — frontend/app/gallery/GalleryClientPage.tsx: бейдж статуса у не-Available, цена только у Available
2. **Sitemap** — frontend/app/sitemap.ts: источник getGalleryData() уже без скрытых (T004); убедиться, что artworksForSale (lib/gallery.ts) не возвращает скрытых; обновить frontend/app/sitemap.test.ts
3. **Связанные работы** — frontend/app/gallery/[slug]/page.tsx (~129 candidate.isForSale) и RelatedWorks.tsx: перейти на status === 'Available' с fallback на isForSale
4. **Тесты** — тесты галереи и sitemap.test.ts

**Technical Notes**:

- `frontend/app/sitemap.ts`: artworksForSale (~65)
- `frontend/lib/gallery.ts`: artworksForSale фильтрует фото выставок

**Acceptance Criteria**:

- [ ] `AC-1` В галерее у проданной работы бейдж вместо цены
- [ ] `AC-2` Скрытая работа отсутствует в sitemap
- [ ] `AC-3` Нет регрессий текущих тестов галереи

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Галерея с Sold и Available
  - When: Рендер GalleryClientPage
  - Then: Цена только у Available, бейдж у Sold
  - Verification: automated
- `TS-2` (unit)
  - Given: gallery data без скрытых
  - When: sitemap()
  - Then: Нет их URL
  - Verification: automated

## `T026` e2e: карточка с полями и скрытая работа дают 404 [US4]

Playwright-сценарии карточки (Available/Sold) и 404 для скрытой работы с моками API

**Context**: Закрыть AS карточки на уровне браузера

- **Depends on**: T023, T024, T025
- **Requirements**: FR-010, FR-011
- **Entities**: artwork
- **Contracts**: public-artworks

**Steps**:

1. **Спека** — frontend/e2e/catalog.spec.ts (по образцу e2e/blog.spec.ts): карточка Available показывает размер/технику/год/цену и ld+json VisualArtwork+Offer; Sold показывает бейдж без цены
2. **Скрытая работа** — Прямой URL работы, которой нет в gallery data, даёт 404; галерея её не содержит
3. **Запуск** — cd frontend && npx playwright test e2e/catalog.spec.ts

**Technical Notes**:

- `frontend/e2e/`: Существующие spec-файлы и способ мокирования API

**Acceptance Criteria**:

- [ ] `AC-1` Оба сценария карточки проходят
- [ ] `AC-2` Скрытая работа даёт 404

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Мок gallery с Available и Sold
  - When: Открыть карточки
  - Then: Данные и разметка по правилам
  - Verification: automated

## `T027` ArtworksController: новые поля в create/update с общей валидацией [US5]

Принять status и поля характеристик в CreateArtworkDto/UpdateArtworkDto; IsForSale из запроса не источник правды; валидация по ArtworkFieldRules

**Context**: Админ правит поля вручную с теми же правилами, что и импорт

- **Depends on**: T003, T022
- **Requirements**: FR-013, FR-014
- **Entities**: artwork
- **Contracts**: admin-artworks

**Steps**:

1. **DTO запросов** — backend/MomSite.API/Controllers/ArtworksController.cs (~168 CreateArtworkDto, ~178 UpdateArtworkDto): Status, WidthCm, HeightCm, Year, Support, Technique, ShortDescription, IsFeatured, NeedsReshoot, IsPublished
2. **Валидация** — Проверки через ArtworkFieldRules: диапазоны размеров и года, длины; нарушение даёт 400 с понятным текстом
3. **Присвоение** — artwork.ApplyStatus(dto.Status); IsForSale из dto не пишется напрямую (старый клиент без Status: IsForSale превращается в Available/NotForSale)
4. **Тесты** — backend/MomSite.Tests/Catalog/ArtworksControllerCatalogFieldsTests.cs: сохранение полей, 400 на год 1900, IsForSale следует за статусом

**Technical Notes**:

- `backend/MomSite.API/Controllers/ArtworksController.cs`: Create/Update присваивают IsForSale = dto.IsForSale
- `backend/MomSite.Core/Models/ArtworkFieldRules.cs`: Единые лимиты (T003)

**Acceptance Criteria**:

- [ ] `AC-1` Новые поля сохраняются и возвращаются
- [ ] `AC-2` Год вне диапазона даёт 400
- [ ] `AC-3` IsForSale всегда равен Status == Available

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Admin JWT
  - When: PUT работы со Status=Sold, year=2017
  - Then: 200, IsForSale=false
  - Verification: automated
- `TS-2` (integration)
  - Given: Admin JWT
  - When: PUT с year=1900
  - Then: 400
  - Verification: automated

## `T028` Форма работы в админке: новые поля [US5]

ArtworkFormFields/ArtworkForm/useArtworkSave: статус, размеры, год, основа, техника, короткое описание, «сильная», «переснять», «опубликована»

**Context**: Админ правит характеристики без таблицы

- **Depends on**: T027
- **Requirements**: FR-013
- **Entities**: artwork
- **Contracts**: admin-artworks

**Steps**:

1. **Поля формы** — frontend/components/admin/ArtworkFormFields.tsx: select статуса (6 значений, русские подписи), числовые Ш/В см, год, основа, техника, textarea короткого описания (счётчик 300), чекбоксы isFeatured/needsReshoot/isPublished; чекбокс «в продаже» заменить статусом
2. **Сохранение** — frontend/components/admin/useArtworkSave.ts и ArtworkForm.tsx: добавить поля в FormData; клиентская валидация по тем же лимитам (frontend/lib/catalogLimits.ts)
3. **Список** — frontend/app/admin/artworks/page.tsx: бейдж статуса и пометки «черновик»/«переснять»
4. **Тесты** — frontend/__tests__/ArtworkForm.test.tsx, useArtworkSave.boundary.test.ts

**Technical Notes**:

- `frontend/components/admin/ArtworkFormFields.tsx`: Сейчас поле isForSale
- `frontend/__tests__/ArtworkForm.test.tsx`: Существующие тесты формы

**Acceptance Criteria**:

- [ ] `AC-1` Новые поля сохраняются из формы
- [ ] `AC-2` Невалидный год/размер блокирует отправку с сообщением
- [ ] `AC-3` Список работ показывает статус и пометки

**Test Scenarios**:

- `TS-1` (unit)
  - Given: Открыта форма работы
  - When: Выбрать «Продана», год 2017, сохранить
  - Then: В запросе status=Sold, year=2017
  - Verification: automated
- `TS-2` (unit)
  - Given: Год 1900
  - When: Сохранить
  - Then: Ошибка валидации, запрос не отправлен
  - Verification: automated

## `T029` Полный прогон по quickstart и проверка размеров файлов [US2]

Прогнать тесты backend/frontend, tsc, Playwright, проверить до 200 строк на новых файлах, пройти сценарии quickstart

**Context**: Закрытие фичи: подтвердить, что сценарии 1-12 из quickstart проходят

- **Depends on**: T013, T019, T021, T026, T028
- **Requirements**: FR-006, FR-011
- **Entities**: artwork, catalog-import-log
- **Contracts**: admin-catalog-import

**Steps**:

1. **Backend** — cd backend && dotnet test
2. **Frontend** — cd frontend && npm test && npx tsc --noEmit && npx playwright test e2e/catalog.spec.ts
3. **P3** — wc -l по новым .cs/.tsx в Infrastructure/Catalog и app/admin/catalog: ни один не больше 200
4. **Quickstart** — Пройти сценарии 1-12 из specs/005-catalog-import/quickstart.md, зафиксировать отклонения
5. **Прод** — Не применять каталог мамы на проде без согласия пользователя: только предпросмотр и показ diff

**Technical Notes**:

- `specs/005-catalog-import/quickstart.md`: Список сценариев и команды

**Acceptance Criteria**:

- [ ] `AC-1` Все автотесты зелёные
- [ ] `AC-2` Новые файлы до 200 строк
- [ ] `AC-3` Сценарии quickstart 1-12 подтверждены

**Test Scenarios**:

- `TS-1` (integration)
  - Given: Все задачи выполнены
  - When: Запустить команды из quickstart
  - Then: Зелёные backend, frontend, e2e
  - Verification: automated

