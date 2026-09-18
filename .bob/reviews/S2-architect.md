# Architect review — S2 (admin messages)

Verdict: ok — no structural changes required.

Checked:
- AdminController message endpoints (`GetMessages`, `GetUnreadMessagesCount`, `GetMessage`, `ArchiveMessage`) sit under class-level `[Authorize]`; only `Login` carries `[AllowAnonymous]`. No accidental exposure of PII.
- `ContactMessageAdminDto` / `MappingExtensions.ToAdminDto()` keep the domain `ContactMessage` entity from leaking past the API layer — consistent with (and stricter than) the project's existing convention of returning domain models directly from some endpoints.
- New->Read and ->Archived status transitions live in the controller (`FindMessageOrNotFoundAsync` + inline mutation), matching the project's established fat-controller convention (no service/domain layer exists elsewhere in AdminController either). Not a new erosion.
- `AdminPageShell` (Cleaner extraction) preserves the existing DOM/overlay structure (fade-in motion.div + sibling overlay), used correctly by the one call site (`app/admin/messages/page.tsx`); abstraction does not leak.
- Four new `useApi.ts` hooks (`useContactMessages`, `useUnreadMessagesCount`, `useOpenContactMessage`, `useArchiveContactMessage`) follow the exact same useQuery/useMutation + queryClient.invalidateQueries pattern as all pre-existing hooks in the file — no second API style introduced.

No mechanical fixes applied.

Tests: backend 38/38 passed, frontend tsc clean, jest 8/8 passed.
