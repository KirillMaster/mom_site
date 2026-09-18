# bob run 001 — leads-not-lost

**Outcome:** `completed` — all 3 slices merged into `main`.
**Mode:** night (`--night`), auto-approval of Gherkin scenarios.
**Feature:** contact form submissions must never be lost: persist to the DB
before attempting any notification, make notification failure non-fatal, add an
admin inbox, add anti-spam.

## Why this run existed

Production was returning 500 on every contact submission and losing the lead
entirely. Confirmed in the live production log, not inferred:

```
[16:48:16 ERR] Failed to send contact message from kirill.su@tenengroup.com
MailKit.Security.AuthenticationException: 535: 5.7.8 Username and Password not accepted
  at MomSite.API.Services.EmailService.SendContactMessageAsync … EmailService.cs:line 69
```

Gmail rejects a plain password where an App Password is required; the exception
escaped the controller, so nothing was written anywhere. Every lead since that
configuration was set has been lost. Slice S1 is the fix.

## Slices

| Slice | Scope | Scenarios | Merge |
|---|---|---|---|
| S1 | Persist-before-notify; notification failure non-fatal; UTM capture | S1-AS1..AS7 | merged |
| S2 | Admin inbox `/admin/messages`: list, read, archive, unread badge | S2-AS1..AS5 | merged |
| S3 | Anti-spam: honeypot field + per-IP rate limit | S3-AS1..AS4 | merged |

### S2 role chain

| Role | Commit | Gates (computed by `compute_gates.py`) |
|---|---|---|
| coder | `027a1b2` | tests-green ✅ |
| cleaner | `0e8a4a9`, `99b0264`, `ee9a9ba` | tests-green ✅, complexity 39/39 ✅, duplication 3.71/3.84 ✅ |
| architect | `8384abb`, `bacfc04` | tests-green ✅, verdict `ok` |
| hardener | `fc9cdca`, `206a4af` | tests-green ✅ |
| cleaner (2nd) | `7fcbc57` | duplication 4.17 → 3.69 |
| qa | `441973f` | tests-green ✅, gherkin-traceability ✅ |

One send-back was used (`e2a4651`, qa → coder, `return_count` 1 of 3): the
`@S2-AS1` authorization check was reflection-only — it asserted that
`[Authorize]` was present rather than that an unauthenticated request is
actually refused, and no frontend login redirect existed at all. The coder
replaced it with a real integration test through the configured JWT pipeline
plus an `AdminAuthGuard` component (`0a84734`).

## QA verification of S2 against a live stack

Not only tests: a real API process was run against a real PostgreSQL 16
container and the approved QA procedures were executed end to end.

| Scenario | Result |
|---|---|
| AS1 unauthenticated access | 401 on all four protected endpoints |
| AS2 ordering + badge | newest-first by `CreatedAt`, badge = 2 for two `New` |
| AS3 viewing marks read | DB `Status` New → Read, badge 2 → 1 |
| AS4 archive | → `Archived`, gone from active list, present under `?status=archived`, excluded from badge |
| AS5 empty inbox | HTTP 200, `{"items":[],"totalCount":0,"unreadCount":0}` |

This is what found the two false-green assertions below; the in-memory factory
alone would not have.

## Findings

**Two token-rejection tests passed for the wrong reason** (fixed in `441973f`).
The test factory built tokens with audience `mom-site-client` while the app is
configured for `mom-site`, so every generated token was rejected on audience
alone. The `WrongIssuer`, `SignedWithWrongKey` and `Expired` cases therefore
proved nothing — turning off issuer, signature or lifetime validation would not
have failed them.

**Expired-token test rested on clock tolerance, not lifetime validation.** With
the audience corrected, the `Expired` case failed: a token 10 seconds past
expiry is accepted. That is correct JwtBearer behaviour — `Program.cs` does not
override the default 5-minute `ClockSkew`. Verified live: `exp-10s` → 200,
`exp-10min` → 401. The test now uses −10 minutes.

**Follow-up (not a defect, deliberate):** consider setting `ClockSkew` explicitly
in `Program.cs` rather than relying on the 5-minute default, so the accepted
window is a stated decision.

**Follow-up from S3** (`cffa835`): the `X-Forwarded-For` trust boundary is
implicit. Assessed as non-exploitable in this deployment (`ForwardLimit=1` plus
nginx's append pattern), but trusted proxies should be named explicitly and
covered by an integration test through the real `ForwardedHeadersMiddleware`.

**Pre-existing, outside this run's scope:** `npm test` in `frontend/` always
fails, because bare `jest` picks up the Playwright specs in `e2e/`. CI works
around it with `--testPathIgnorePatterns='e2e/'`; the local script does not.
Left alone deliberately — unrelated to these slices.

## Deviations from the protocol

These are failures of process discipline, recorded because the run's numbers
cannot be read honestly without them.

1. **Night-mode auto-approval.** No human approved the Gherkin scenarios; all
   were marked `auto-approved-night`.
2. **Mutation testing disabled.** Stryker is not operational, so the hardener
   ran heuristically instead of against a mutation score. Its `tests-green`
   gate was computed normally, but the role ran degraded.
3. **Eight subagent failures with ECONNRESET.** Infrastructure instability, not
   agent error. The final QA agent returned an empty result.
4. **The orchestrator did role work by hand.** After repeated agent failures the
   orchestrator completed the coder's, the cleaner's and finally the whole QA
   role itself. The pipeline's separation of roles was not maintained; the gate
   numbers are still script-computed, but the work behind them was not produced
   the way the protocol specifies.
5. **The hardener can raise duplication past an already-scored gate.** Its gate
   set is `tests-green` only, and there is no cleaner stage after it. It pushed
   duplication 3.71 → 4.17, over the 3.84 baseline, and nothing in the pipeline
   noticed. Cleaned up out of order in `7fcbc57`. This is a hole in the role
   configuration, not a one-off.
6. **Stale baseline in the S2 worktree.** S2 branched from `654434d` and carried
   a baseline of 3.69 describing the tree before S1; the correction on main
   (`4a802e3`) never reached it. Rather than copy the number across, the base
   commit was checked out into a scratch worktree and measured: 3.84 exactly.
   The baseline was corrected from measurement.
7. **Duplication measurement methodology changed mid-run** (jscpd invocation and
   ignore patterns), so figures before and after are not strictly comparable.
8. **Baseline refresh was skipped after S1** and corrected retroactively in
   `4a802e3`.

## Metrics

| | start of run | after S3 | after S2 (main) |
|---|---|---|---|
| max CCN | 39 | 39 | 39 |
| duplicated lines | 3.84% | 3.84% | **3.36%** |
| backend tests | 54 | 78 | **89** |
| frontend tests (jest) | 17 | 20 | **24** |

Baseline on `main` refreshed to `{"complexity": 39, "duplication": 3.36}`.

## Not done in this run

Deploying to production, applying the `AddContactMessages` migration, and
re-submitting a real lead to confirm 200 plus a DB row. Until that happens the
production 500 is still losing every lead — the code fixing it is merged, but
not running.
