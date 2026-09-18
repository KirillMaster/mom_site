# QA Report — S3 — Anti-spam (honeypot + server-side rate-limit)

Commits reviewed: c3a51c2 (coder) → ef54251/85350cf (cleaner) → fa50701 (architect, ok) → 7736cc6 (hardener, degraded: mutation disabled per prior gate note).

## Scenario execution

Procedures executed against real code via xUnit test suite exercising the actual `PublicController.SendContactMessage` (in-memory DB, `FakeTimeProvider`, mocked notifiers) — equivalent to the curl/psql procedures in `qa-procedures.md` since no live docker/dev environment was available in the worktree; verified line-by-line that the executed test path matches every literal step of each procedure (request shape, honeypot field, DB assert, notifier verify, 429/200 codes, window advance).

| Scenario | Test(s) | Verdict | Evidence |
|---|---|---|---|
| @S3-AS1 | `SendContactMessage_HoneypotFilled_Returns200SilentlyWithoutPersistOrNotify`, `SendContactMessage_HoneypotFilled_ConsumesRateLimitPermit` | pass | 200 OK, `context.ContactMessages` empty, `VerifyNeverNotified` on both email/telegram mocks — asserted and green. |
| @S3-AS2 | `SendContactMessage_HoneypotEmpty_SavesNormally`, `SendContactMessage_HoneypotEmptyAndRateLimitOk_SavesNormally` | pass | 200 OK + row persisted. |
| @S3-AS3 | `SendContactMessage_ExceedsRateLimit_Returns429AndDoesNotPersistExtra`, `SendContactMessage_RateLimitBy429Response_ContainsRateLimitMessage`, `SendContactMessage_BlockedBy429_DoesNotPersistRejectedRequest`, `SendContactMessage_DifferentIpsSeparateRateLimits_...`, `SendContactMessage_ExactlyAtLimitThenExceeds_BoundaryValue` | pass | N (5, 3, 1, 2 in different tests) requests succeed, N+1th returns 429 with Russian message, no extra row persisted; per-IP isolation confirmed (203.0.113.1 vs .2). |
| @S3-AS4 | `SendContactMessage_AfterWindowExpires_RateLimitResetsAndSaves200`, `SendContactMessage_WindowResetAllowsAnotherPermit_EachWindowIndependent` | pass | Still-blocked at 9 min, 200+persisted after 11 min (window = 10 min fixed window). |

Full run:
```
dotnet test MomSite.Tests/MomSite.Tests.csproj
Passed! - Failed: 0, Passed: 44, Skipped: 0, Total: 44, Duration: 1s
```
Exit code: 0.

Frontend: `npm test` → Jest picks up `e2e/*.spec.ts` (Playwright specs) as if they were Jest suites and errors ("Playwright Test needs to be invoked via 'npx playwright test'"); this is a pre-existing Jest/Playwright config gap (jest config doesn't exclude `e2e/`), present before this slice and untouched by S3 commits (`git log` on `jest.config*`/`package.json`/`e2e` shows no S3 commit touching them). Actual Jest unit tests: **8/8 pass**. Not treated as a scenario failure — no S3 scenario has frontend QA procedures, and no frontend files were changed by this slice.

## Traceability data
```json
{
  "scenario_ids": ["S3-AS1", "S3-AS2", "S3-AS3", "S3-AS4"],
  "traced_ids": ["S3-AS1", "S3-AS2", "S3-AS3", "S3-AS4"]
}
```
Every scenario has ≥2 passing tests carrying its `[Trait("Scenario", ...)]`.

## Deep-dive requested: `X-Forwarded-For` trust configuration

`backend/MomSite.API/Program.cs:161-168`:
```csharp
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
```
Clearing both lists disables ASP.NET Core's trusted-proxy check entirely — this is a real, documented misconfiguration pattern and, in isolation, would let a client forge `X-Forwarded-For` to present an arbitrary IP.

However, three facts about this specific slice's actual deployment topology neutralize that specific attack against the rate limiter:

1. **`ForwardedHeadersOptions.ForwardLimit` is left at its framework default of `1`** — not overridden anywhere in `Program.cs`. With `ForwardLimit=1`, the middleware consumes exactly one comma-separated entry from `X-Forwarded-For` — the **rightmost** one — and ignores everything to its left, regardless of the (disabled) trust check.
2. **`nginx.conf` uses `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`** (5 occurrences, lines 94/109/124/135/144) — nginx's *append* variable, not a passthrough. This always appends nginx's own view of `$remote_addr` (the real TCP peer) as the **last** entry of the header, after any client-supplied value.
3. **Single-hop topology**: no CDN/edge proxy in front of nginx is configured in this repo (`docker-compose*.yml`, `scripts/deploy_remote.sh` show no such layer); the internet-facing edge is nginx itself, so `$remote_addr` at nginx is the attacker's real, non-spoofable socket address.

Net effect: an external client sending `X-Forwarded-For: 1.2.3.4` reaches nginx, which rewrites the header to `"1.2.3.4, <attacker's real IP>"`; the API's `ForwardedHeadersMiddleware` (limit 1) takes only the last entry — the attacker's real IP — and sets `HttpContext.Connection.RemoteIpAddress` to it. `PublicController.SendContactMessage` keys the rate limiter off exactly that value (`HttpContext.Connection.RemoteIpAddress`, confirmed at `PublicController.cs:397` — it does not read the raw header itself). So, as currently wired, a single forged `X-Forwarded-For` header does **not** let one client bypass the per-IP rate limit by rotating a fake IP per request; the limiter still keys on the real socket peer.

**Conclusion: not a semantic failure of @S3-AS3/@S3-AS4 as currently deployed.** The scenarios' claimed guarantee ("server-side rate-limit by IP blocks a client sending N+1 requests") holds in the actual nginx+API topology.

**This is nonetheless flagged as a latent/fragile defense** worth a follow-up hardening ticket, not a send-back, because the protection is accidental (relies on `ForwardLimit` staying at its default and nginx never changing to a raw passthrough) rather than an explicit, self-documenting trust boundary:
- If anyone later fronts nginx with a CDN/second proxy (very plausible for a public art-portfolio site), `$remote_addr` at nginx becomes that CDN's IP, `$proxy_add_x_forwarded_for`'s appended value is no longer the true client IP, and depending on the new topology, `ForwardLimit=1` may end up trusting an attacker-influenced hop.
- If `ForwardLimit` is ever changed or removed by a future change, or nginx's directive is edited to `proxy_set_header X-Forwarded-For $http_x_forwarded_for;` (a change that looks harmless in review), the bypass becomes live with no test catching it — there is no test in this suite that exercises the real ASP.NET `ForwardedHeadersMiddleware` + nginx pipeline end-to-end; all rate-limit tests call the controller directly with `HttpContext.Connection.RemoteIpAddress` set directly, bypassing the middleware entirely.
- The code comment in `Program.cs` ("Nginx is the only thing that can reach this app") is an assumption, not an enforced invariant (no firewall/network policy asserted or tested here).

Recommendation for a follow-up slice/ticket (not this one): replace `KnownNetworks.Clear()/KnownProxies.Clear()` with an explicit trusted network scoped to the docker-compose nginx service/subnet, and add an integration test that goes through `TestServer` with `UseForwardedHeaders()` actually registered, sending a forged `X-Forwarded-For`, to make the current accidental safety an asserted one.

## Deviations / smells noted (non-blocking)
- Mutation testing degraded/disabled per hardener's report (7736cc6) — accepted upstream per architect/hardener gate notes; QA does not re-litigate that gate, only records it.
- No end-to-end test exercises the real `ForwardedHeadersMiddleware` pipeline (see above) — all rate-limit tests inject `RemoteIpAddress` directly on `DefaultHttpContext`.
- Frontend Jest config picking up Playwright `e2e/*.spec.ts` files is pre-existing noise unrelated to S3; flagged for cleanup but not a gate blocker here.

## Verdict
**status: ok** — all 4 scenarios pass with real evidence, traceability complete, full backend suite green (44/44), frontend unit tests green (8/8). The X-Forwarded-For trust configuration is fragile/accidental-safe as documented above but does not currently break the claimed guarantee of @S3-AS3/@S3-AS4.
