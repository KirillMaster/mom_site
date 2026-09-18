# S3 — Architect review

Verdict: ok. No structural changes required.

## Checked

- `MomSite.Core/Interfaces/IContactRateLimiter.cs`: pure `bool TryAcquire(string clientKey)`
  contract, no ASP.NET/HTTP types leaked into Core. Correct direction: Core defines the
  port, Infrastructure implements it.
- `MomSite.Infrastructure/Services/FixedWindowContactRateLimiter.cs`: implements the Core
  interface, depends only on `System` (`TimeProvider`, `ConcurrentDictionary`). No upward
  dependency on API or Core internals beyond the interface.
- `MomSite.Core/Models/ContactMessageDto.cs`: `Website` honeypot field added alongside the
  existing `[JsonPropertyName]`/`[StringLength]`-annotated fields. The DTO already mixes
  transport concerns (JSON property names, validation attributes) with the Core layer as an
  established project convention (predates S3, see Name/Email/Subject/Message/Utm* fields);
  adding `Website` here is consistent with that existing shape, not a new deviation.
- `MomSite.API/Controllers/PublicController.cs`: `SendContactMessage` composes
  rate-limit -> honeypot -> `ModelState` validation -> persist -> notify via private
  helpers (`IsHoneypotTripped`, `BuildContactMessageEntity`, `TryPersistContactMessageAsync`,
  `NotifyContactMessageAsync`). Direct `DbContext` use in the controller matches every other
  action in this controller and the pattern already accepted in S1's architect review
  (c407b25/8c31b30) — a pre-existing project convention, not introduced or worsened by S3.
  No business logic beyond simple ordering/branching leaked past the controller; the actual
  rate-limit policy and window logic live in Infrastructure behind the Core interface.
- `Program.cs`: `TimeProvider.System`, `ContactRateLimiterOptions`, and
  `IContactRateLimiter` -> `FixedWindowContactRateLimiter` registrations sit in the
  composition root alongside other DI wiring; `UseForwardedHeaders()` placed in the
  middleware pipeline section. Correct layer.

## Notes for the report (non-blocking)

- `FixedWindowContactRateLimiter` state is in-memory (`ConcurrentDictionary` on a singleton).
  With a single API container in production today this is fine, but the limit is
  per-instance: horizontally scaling the API later will let the effective per-IP limit
  multiply by instance count. Flag this if/when the deployment moves to multiple replicas
  (would need a shared store, e.g. Redis-backed limiter, behind the same `IContactRateLimiter`
  interface — no controller/Core change needed then).

## Mechanical fixes

None required.

## Tests

- Backend: `dotnet test backend/MomSite.Tests/MomSite.Tests.csproj` — 37/37 passed.
- Frontend: `npx tsc --noEmit` clean; `npx jest --ci --testPathIgnorePatterns=e2e/` — 8/8 passed.
