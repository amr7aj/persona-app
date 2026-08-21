# PERSONA — Authentication Integrity Fix

This package preserves the existing PERSONA frontend, backend, Supabase project, database model, Telegram flow, AI/scoring logic, and API contracts.

## Only authentication integrity was changed

1. `server/db.ts`
   - Supabase Auth is the only credential verifier.
   - Registration creates `auth.users` first, then `public.users` with the exact same UUID.
   - Login resolves username/referral/UUID to email, then verifies the password through Supabase Auth.
   - Legacy `public.users` rows can be re-keyed to the matching Supabase Auth UUID through the RPC below.
   - Existing Telegram users are also reconciled with Supabase Auth before a session is created.

2. `supabase/migrations/20260821_auth_integrity.sql`
   - Adds only the `rekey_persona_user(old_id, new_id)` server-side RPC.
   - It updates existing foreign-key references before changing the primary user UUID.
   - It does not create new application tables or replace the existing PERSONA schema.

## Deployment order

1. Backup the production Supabase database.
2. Apply `supabase/migrations/20260821_auth_integrity.sql` in the existing PERSONA Supabase project.
3. Set the same existing `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` on the backend.
4. Set `PERSONA_MIGRATION_SECRET` only if you intend to use the legacy repair endpoint.
5. Deploy the project normally. Do not change the existing frontend API URL or Supabase project.

## Important

- Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend/Vite environment variables.
- Do not delete `auth.users` or `public.users` to solve duplicate-email problems.
- Do not recreate existing users manually before checking which side already owns the email.
- The old `persona_db.json` system must not be used as an authentication source.
