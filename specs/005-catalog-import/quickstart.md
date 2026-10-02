# Quickstart: проверка 005-catalog-import

Контракты — `contracts.yaml` (id), сущности — `data-model.yaml` (id). Старт реализации — после merge 004.

## Предусловия
- Локальная БД (docker compose dev) с миграцией `AddArtworkCatalogFields` (`artwork`, `catalog-import-log`).
- Фикстуры в `backend/MomSite.Tests/Fixtures/catalog/`: выгрузка `scripts/catalog/build_catalog.py` (format: v1) и тот же файл, экспортированный из Google Sheets. Рабочий каталог мамы в репозиторий не коммитится.
- Админ залогинен в `/admin`.

## Автотесты
```bash
cd backend && dotnet test --filter "FullyQualifiedName~Catalog|FullyQualifiedName~PublicController|FullyQualifiedName~Artworks"
cd frontend && npm test -- catalog gallery && npx tsc --noEmit && npx playwright test e2e/catalog.spec.ts e2e/gallery.spec.ts
```

## Сценарии

| # | Шаги | Ожидаемо | Контракт |
|---|---|---|---|
| 1 | `/admin/catalog` → загрузить фикстуру, «Предпросмотр» | Таблица diff только изменённых полей, summary; в БД ничего не изменилось | `admin-catalog-import` |
| 2 | Загрузить `.csv`, битый xlsx, файл без листа «Каталог», без колонки `ID`, 6 МБ, 2001 строка | 400 с понятным текстом / 413; никаких 500 | `admin-catalog-import` |
| 3 | Строки с `150 000 ₽`, `по запросу`, `2017г.`, `60,5`, статус `продана`, `-` в «Технике» | Распознано; `-` очищает поле; мусор → warning, поле не тронуто | `catalog-import-service` |
| 4 | «Применить» | Изменения в БД, `logId` в ответе; строки с error пропущены | `admin-catalog-import`, `catalog-import-log` |
| 5 | Повторно применить тот же файл | 0 изменений, новый лог не создан | `catalog-import-service` |
| 6 | Два «Применить» одновременно | Второй — 409 | `admin-catalog-import` |
| 7 | Строка с пустым ID | Черновик `IsPublished=false`, в отчёте «добавьте фото»; на сайте не виден | `artwork` |
| 8 | «Откатить последний» | Поля восстановлены, черновики без фото удалены; повторный откат → 404 | `admin-catalog-rollback` |
| 9 | Открыть `/gallery/<slug>` работы со статусом «В наличии» и с «Продана» | Ш × В см, техника, основа, год; цена только у «В наличии», у проданной — бейдж; ld+json VisualArtwork + Offer | `public-artworks` |
| 10 | Работа `NotMine` или `IsPublished=false`: прямой URL, галерея, `/sitemap.xml` | 404; в галерее и sitemap отсутствует | `public-artworks` |
| 11 | Форма работы в `/admin/artworks` (после 004) | Новые поля сохраняются; `IsForSale` следует за статусом | `admin-artworks` |
| 12 | Запросы без JWT | 401 | `admin-catalog-import`, `admin-catalog-rollback` |

## Прод (после merge и деплоя)
1. Миграция применяется при старте api; проверить, что все текущие работы видны (`IsPublished=true`, статус из `IsForSale`).
2. Предпросмотр маминого каталога → согласовать diff с пользователем → «Применить».
3. Закрытие задачи — после «добро» пользователя (P5).
