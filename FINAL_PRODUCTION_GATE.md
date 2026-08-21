# PERSONA — Final Production Gate

Date: 2026-08-21

## Verdict

This release is **NOT approved as Production-ready** from this environment. The source was statically audited and several security/integration issues were fixed, but the full dependency install and runtime/integration verification are blocked by the environment's inability to reach the npm registry and by the absence of a live Supabase/Gemini/Telegram/mobile build environment.

## Verification matrix

| Area | Status | Evidence / reason |
|---|---|---|
| TypeScript/TSX parser | VERIFIED | 42 TS/TSX files transpiled with TypeScript 5.8.3; 0 parser diagnostics |
| Local imports | STATIC VERIFIED | Automated relative-import resolution found no missing local modules |
| API route mapping | STATIC VERIFIED | 41 Express routes compared against 31 frontend API calls; no unresolved route contract except dynamic `/api/questions${query}`, which maps to `/api/questions` |
| Dependency declarations | STATIC VERIFIED | External imports compared with package.json; `crypto` and `path` are Node built-ins |
| Lockfile | STATIC VERIFIED | Single `pnpm-lock.yaml`; importer specs match package.json dependency ranges |
| npm ci | BLOCKED | npm requires package-lock; project intentionally uses pnpm lockfile |
| pnpm install --frozen-lockfile | BLOCKED | pnpm is not installed and Corepack cannot download it: registry.npmjs.org DNS EAI_AGAIN |
| Typecheck | BLOCKED | Cannot run against real dependencies because install is blocked |
| Lint | BLOCKED | Script is TypeScript-only and dependencies are unavailable; no separate ESLint configured |
| Build | BLOCKED | Dependencies unavailable |
| Tests | NOT VERIFIED | No executable test suite was available to run and dependencies are unavailable |
| Database schema | STATIC VERIFIED | 19 tables parsed; expected private tables have RLS enabled |
| RLS | NOT VERIFIED | No live Supabase/PostgreSQL instance is available for adversarial execution |
| Auth lifecycle | NOT VERIFIED | No live Supabase Auth credentials/environment available for end-to-end execution |
| Authorization | STATIC VERIFIED | Route ownership middleware plus explicit admin checks audited; self role changes blocked |
| Gemini | NOT VERIFIED | API key/service unavailable; model ID checked against current Google docs |
| Telegram | NOT VERIFIED | No live Telegram WebApp payload or bot environment |
| Capacitor config | STATIC VERIFIED | appId `com.persona.app`, appName `PERSONA`, webDir `dist` |
| Android/iOS build | NOT VERIFIED | Native SDK/build environment not available |
| Production env | STATIC VERIFIED | Server-only secrets are documented; no service-role/Gemini/Telegram secret in Vite client source |

## Fixes made during this gate

- Added explicit owner/admin authorization to profile updates.
- Prevented authenticated users from changing their own role through admin role endpoint.
- Kept role/XP/level/badges out of normal profile-update validation.
- Fixed AuthView to pass required login/register credentials instead of `undefined`.
- Removed deprecated `temperature` parameters from Gemini 3.7 Flash requests. Gemini 2.5 fallback retains its parameter.
- Preserved the existing Supabase/Auth architecture and PERSONA business logic.

## Database/RLS observations

- `auth.users.id` and `public.users.id` are aligned by email registration and Auth-only profile creation paths.
- Legacy UUID repair is implemented as a service-role-only SECURITY DEFINER function.
- The repair function creates the new parent row before repointing child foreign keys.
- Direct client RLS policies are SELECT-only for private user data; no client UPDATE policies are present for role/XP/level/badges.
- RLS has not been adversarially executed against a live database, so it remains NOT VERIFIED.

## Remaining blockers

1. Install dependencies with the project's pnpm lockfile in a network-enabled environment.
2. Run `pnpm install --frozen-lockfile`.
3. Run the project's typecheck/build/lint commands with installed dependencies.
4. Execute Supabase staging tests for cross-user reads/writes, RLS, Auth lifecycle, and legacy re-key migration.
5. Execute live Gemini and Telegram integration tests.
6. Build Android/iOS with the actual native toolchains.

## Commands to run in a network-enabled project environment

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm test
```

The project currently has no dedicated `test` script; adding one should be a separate decision rather than inventing a test runner during the release gate.
