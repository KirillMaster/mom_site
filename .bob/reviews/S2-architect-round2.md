# S2 — Architect review (post send-back delta)

Reviewed only the delta after QA send-back e2a4651: coder 0a84734, cleaner ee9a9ba.

## Checked

1. backend/MomSite.API/Program.cs — added `IsEnvironment("Testing")` branch
   (EnsureCreated vs Migrate) and `public partial class Program {}`.
   Program.cs already branches on `IsDevelopment()` in 6 other places for
   composition-root wiring (Swagger, error pages, static files). The new
   branch follows the same established idiom, is commented with the concrete
   reason (Npgsql-specific migration column types don't replay on Sqlite),
   and is confined to environment selection, not business logic. No new
   dependency direction issue: this is still the composition root, not
   domain code, deciding how to wire the persistence detail.

2. backend/MomSite.Tests/AdminMessagesAuthorizationIntegrationTests.cs —
   uses WebApplicationFactory<Program> + Sqlite in-memory + env-var override
   for JWT secret/admin password. Test-only file, does not leak into
   production code. Env vars are process-global (noted), but this is the
   only class currently using this factory and it cleans up in Dispose;
   no cross-test contamination observed under a full run. This is a test
   isolation quality concern for Hardener/QA to weigh, not a structural
   boundary violation — not sending back for it.

3. frontend/components/AdminAuthGuard.tsx — depends on `@/lib/api` (auth
   token) and `next/navigation`, correct direction (UI component -> shared
   client lib). Does not duplicate app/admin/page.tsx's login-form logic:
   that page owns the login screen; AdminAuthGuard is the gate for admin
   sub-pages and is wired into app/admin/messages/page.tsx only, per this
   slice's scope. No parallel structure invented.

No structural or dependency-direction erosion found in the delta. No
mechanical fixes required.

## Tests

- dotnet test backend/MomSite.Tests/MomSite.Tests.csproj: 54/54 passed
- npx jest --ci --testPathIgnorePatterns=e2e/: 17/17 passed
- npx tsc --noEmit: clean
