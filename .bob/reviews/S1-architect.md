# Architect review — S1 (leads not lost)

Verdict: OK — no structural changes required.

Checked:
- Dependency direction: `IFeedbackNotifier` declared in `MomSite.Core/Interfaces`, takes/returns only `ContactMessage` (Core model) — no EF/MailKit/HttpClient/ASP.NET leakage into Core. Implementations (`EmailNotifier`, `TelegramNotifier`) correctly live in `MomSite.Infrastructure/Notifications` and depend on Core, not vice versa.
- Boundary placement: `PublicController.SendContactMessage` only orchestrates (validate -> persist -> best-effort notify loop with per-notifier try/catch); no transport or business-decision logic leaked into the controller beyond sequencing. The "notification failure != request failure" rule lives in one place (the controller's catch-per-notifier loop), not duplicated across layers.
- Consistency: `ContactMessage` EF configuration follows the existing project convention (fluent config in `ApplicationDbContext.OnModelCreating`, mirroring `PageContent`); DataAnnotations on the Core model are plain validation attributes, not EF-specific, consistent with existing Core models.
- Cleanup: old `MomSite.API/Services/EmailService.cs` fully removed; no dangling references or DI registrations found (grep clean). DI registers two `IFeedbackNotifier` implementations via `AddScoped` + `AddHttpClient()`, consumed as `IEnumerable<IFeedbackNotifier>` — no secrets/config leaked into Core, channel config (env vars) stays inside Infrastructure notifiers.

No mechanical fixes applied. Tests: 14/14 passed (`dotnet test backend/MomSite.Tests/MomSite.Tests.csproj`).
