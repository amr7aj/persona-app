# PERSONA — Final Auth-Safe Release

## Scope
This release follows the rule: **fix errors only; do not change PERSONA business logic or replace the existing Supabase architecture.**

### Changed files
1. `src/context/AppContext.tsx`
   - Removed `persona_active_user_id` as a local authentication source.
   - Session restoration now relies on the backend `/api/auth/me` using the Supabase access token.
   - No UI/business feature logic was changed.

2. `supabase/migrations/20260821_auth_integrity.sql`
   - Added safe UUID reconciliation for legacy `public.users` rows.
   - Added handling for self-referencing `users.referred_by_id`.
   - Does not replace the existing schema.

3. Existing Auth fixes already present in the supplied project were retained:
   - `server/supabase.ts`: anon Auth client vs service-role admin client separation.
   - `server/db.ts`: Supabase Auth credential verification, duplicate prevention, legacy UUID reconciliation, Auth-only profile recovery.
   - `server.ts`: `/api/auth/me`, refresh, protected API middleware.

## Authentication invariant
`auth.users.id` MUST equal `public.users.id` for an email account.

Passwords are managed only by Supabase Auth. The application `users` table does not store password hashes.

## Verification status
- Static source review: completed.
- Local dependency installation/build: **not completed in this environment** because `npm ci` exceeded the available execution window.
- Therefore this package is not falsely labelled "runtime-verified 100%".

## Deployment
1. Keep the existing Supabase project.
2. Run only `supabase/migrations/20260821_auth_integrity.sql` against the matching production schema.
3. Keep `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` configured on the server.
4. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
5. Build with the project's existing `npm run build`.
