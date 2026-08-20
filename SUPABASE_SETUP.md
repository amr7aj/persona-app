# PERSONA — Supabase Production Setup

1. Run the complete `supabase_schema.sql` in the target Supabase project.
2. Set the server variables from `.env.example`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `SUPABASE_ANON_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `GEMINI_API_KEY`
   - `ADMIN_SECRET`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL`
3. Never put `SUPABASE_SERVICE_ROLE_KEY` in the APK or Vite environment.
4. Start the server with `npm run dev` or build with `npm run build` and run `npm start`.
5. For the APK, `VITE_API_BASE_URL` must point to the deployed HTTPS API server, not localhost.
6. Telegram Mini App authentication requires `TELEGRAM_BOT_TOKEN`; the server verifies Telegram `initData` before issuing the Supabase JWT session.

The server no longer reads or writes `data/persona_db.json`. Email/password authentication is handled by Supabase Auth, and all persistent application data is stored in Supabase PostgreSQL.
