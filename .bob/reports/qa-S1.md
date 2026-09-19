# QA Report — reviews / Slice S1 (Review entity + EF migration + model config)

Commit under review: `d4647b9` (bob(coder): S1 — add Review entity, EF config, and AddReviewsTable migration)
Worktree: `C:\pet\mom_site\.worktrees\bob-003-S1`, branch `bob/003-reviews/S1`

## Главный риск: расположение миграции

Проверено фактически: **риск не подтвердился**. Единственный каталог миграций в проекте —
`backend/MomSite.Infrastructure/Data/Migrations/` (не `Migrations/` без `Data/`, как было
указано в задании — предположение о несоответствии оказалось неверным). Все 9 миграций проекта,
включая новую `20260919052526_AddReviewsTable`, лежат в этом единственном каталоге, там же —
единственный `ApplicationDbContextModelSnapshot.cs` (дублей нет).

`dotnet ef migrations list --project MomSite.Infrastructure --startup-project MomSite.API`
подхватил миграцию корректно (сборка прошла, миграция перечислена последней в хронологическом
порядке вместе со всеми остальными):
```
20250808130107_InitialCreate
20250808205512_AddVideoPathToVideo
20250810154240_RemoveReviewsTable
20250810174739_AddHomeBiographyAndAuthorPhoto_NewIds
20250811161941_AddFooterContent
20260427114540_AddShowOnHomeToCategory
20260427120500_RemoveSeedData
20260918170134_AddContactMessages
20260919052526_AddReviewsTable
```
(строка "No such host is known" — ожидаемо, нет доступной Postgres БД в среде QA; на подхват
миграции сборкой EF это не влияет.) `Database.Migrate()`/`dotnet ef database update` применят
эту миграцию как обычную последнюю миграцию — двух наборов миграций не образовалось.

**migration_location_ok: true**

## Дополнительные проверки

- Ограничения длины/обязательности заданы дважды и согласованно: Data Annotations на модели
  (`[Required]`, `[MaxLength]`, `[Range(1,5)]` — `backend/MomSite.Core/Models/Review.cs`) и Fluent
  API в `ApplicationDbContext.OnModelCreating` (`IsRequired().HasMaxLength(...)`) — совпадают
  между собой и со сгенерированной миграцией (`character varying(100)`, `varchar(2000)` и т.д.).
- `Rating` — только data-annotation `[Range(1,5)]`, проверяется в тестах, БД не enforces диапазон
  (нет CHECK-constraint) — это ожидаемо для EF Core без явного raw SQL constraint, не является
  дефектом слайса (сценарии описывают валидацию на уровне модели, не БД).
- `ArtworkId` — nullable FK, `OnDelete(DeleteBehavior.SetNull)` и в Fluent API, и в сгенерированной
  миграции (`ReferentialAction.SetNull`) — удаление Artwork не сломает существующие Review, поле
  просто обнулится. Корректно.
- `DbSet<Review> Reviews` зарегистрирован в `ApplicationDbContext` (строка 20).
- `ReviewEntityTests.cs` — 10 тестов, все точно проверяют заявленное (не rubber-stamp): SaveChanges
  с реальным SQLite + `EnsureCreated`, `Validator.TryValidateObject` для аннотаций, отдельная
  проверка присутствия миграции по имени класса в сборке. Каждый тест помечен
  `[Trait("Scenario", "S1-ASx")]`.

## Сценарии

| id | verdict | evidence |
|---|---|---|
| S1-AS1 | pass | `Migrations_Include_OneThatCreatesReviewsTable` + `Review_SavesWithDefaults_OnSchemaCreatedFromCurrentModel` — Id>0, IsPublished=false, CreatedAt в пределах 5с |
| S1-AS2 | pass | `AuthorName_EmptyOrTooLong_FailsValidation` — пустая строка и 101 символ дают ValidationResult на AuthorName |
| S1-AS3 | pass | `Text_EmptyOrTooLong_FailsValidation` — пустая строка и 2001 символ дают ValidationResult на Text |
| S1-AS4 | pass | `Rating_OutsideOneToFive_FailsValidation` (Theory: 0→invalid, 6→invalid, 1→valid, 5→valid) |
| S1-AS5 | pass | `OptionalFields_LeftNull_SavesSuccessfully` — AuthorCity/ArtworkId/PhotoPath остаются null после reload |
| S1-AS6 | pass | `ArtworkRelation_ResolvesThroughNavigationProperty` — Review.Artwork.Id == artwork.Id после `.Include()` |

## Traceability

scenario_ids (feature, слайс S1): S1-AS1, S1-AS2, S1-AS3, S1-AS4, S1-AS5, S1-AS6
traced_ids (Trait("Scenario", ...) в ReviewEntityTests.cs): S1-AS1 (x2), S1-AS2, S1-AS3, S1-AS4, S1-AS5, S1-AS6

Все 6 сценариев слайса имеют минимум один трассированный тест. **traceability: ok**

## Прогон тестов и сборки

- `dotnet build backend/MomSite.API/MomSite.API.csproj` → Build succeeded, 0 Warning(s), 0 Error(s).
- `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj` → **Passed! Failed: 0, Passed: 110, Skipped: 0, Total: 110**.
  - Отдельно `--filter FullyQualifiedName~ReviewEntityTests` → 10/10 passed.
  - Проверена база до слайса (коммит `87da221`, извлечён через `git archive` во временный каталог):
    **100/100 passed**. Итого слайс добавил 10 новых зелёных тестов, регрессий нет.
  - **Замечание по вводным данным задания**: в задании было указано "база до слайса — 110/110",
    фактически база — 100/100 (100 + 10 новых = 110 итого после слайса). Расхождение в исходных
    вводных, не в коде; на вердикт не влияет.

## Вердикт

**ok** — все сценарии слайса S1 проходят, миграция находится в правильном единственном каталоге
и подхватывается EF Core, ограничения заданы согласованно на уровне модели/Fluent API/миграции,
тесты действительно проверяют заявленное поведение и трассируются на сценарии. Регрессий в базовом
наборе тестов нет.
