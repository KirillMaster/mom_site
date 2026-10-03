# Quickstart — 011

## Локально
- `cd backend && dotnet test` — WatermarkGeometry, WatermarkPairing, DescriptionCleaner, PublicController (how-to-buy, home, about).
- `cd frontend && npx jest` — AvailableGrid, TrustStrip, ReviewsPreview, OrderForm, HowToBuy, ScaleDiagram, gallery filters.

## После деплоя
1. Миграция `AddArtworkImageOriginalPath` применяется при старте API.
2. `POST /api/admin/images/rewatermark` (dryRun по умолчанию) → отчёт `rewatermark-report`: matched ≈ число работ, skipped/failed — разобрать.
3. `POST /api/admin/images/rewatermark?dryRun=false&take=50` повторять, пока `remaining` = 0.
4. `GET /api/public/how-to-buy` → 200; `GET /api/public/home` содержит `availableArtworks`.
5. e2e: `PLAYWRIGHT_BASE_URL=https://angelamoiseenko.ru npx playwright test e2e/catalog-trust.spec.ts e2e/design-system.spec.ts --project=chromium`.

Контракты: `contracts.yaml` (how-to-buy-endpoint, rewatermark-endpoint, home-endpoint, about-endpoint, order-form).
