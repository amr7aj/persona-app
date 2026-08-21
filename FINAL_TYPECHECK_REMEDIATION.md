# Final TypeScript Remediation

## Verified by source inspection

### `server.ts`
- `getSupabaseAuth()` was called at the logout endpoint without being imported.
- Fixed the root cause by importing the existing `getSupabaseAuth` export from `./server/supabase`.
- No new Auth helper or duplicate implementation was introduced.

### `src/context/AppContext.tsx`
- Registration state was typed with optional `email` and `password` even though `Api.registerUser()` requires both.
- The registration handler now requires both fields at the type level and performs runtime validation before calling the API.
- The handler normalizes email/first name/optional name fields before sending the request.
- The existing `AuthView` validation remains in place; the context now provides a second invariant boundary so callers cannot bypass the required Auth contract through TypeScript.

### `package.json`
- Added an explicit `typecheck` script: `tsc --noEmit`.
- `lint` intentionally maps to the same TypeScript check because the project does not currently contain an ESLint configuration or ESLint dependency. No fake test runner or fake lint command was added.
- `build` now runs `pnpm typecheck` before Vite/esbuild, so a typecheck failure blocks a production build.

## Verification status in this environment

- Source-level inspection of the reported failures: VERIFIED.
- `pnpm install --frozen-lockfile`: BLOCKED in this environment because `pnpm` is not installed here.
- `pnpm typecheck`: BLOCKED for the same reason.
- `pnpm lint`: BLOCKED for the same reason.
- `pnpm build`: BLOCKED for the same reason.

The prior real-environment evidence supplied by the project owner showed `pnpm install --frozen-lockfile` and `pnpm build` succeeding, while `pnpm lint` exposed the two TypeScript errors fixed here. This environment cannot independently reproduce those commands because its package manager is unavailable and dependency installation cannot complete.
