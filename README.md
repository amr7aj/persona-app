# PERSONA — AI Personality Intelligence Platform

Production-oriented React + TypeScript + Express + Supabase + Capacitor application.

## Architecture

`React/Capacitor → Express API → Supabase Auth + PostgreSQL → Gemini/Telegram integrations`

Supabase Auth is the credential source of truth. For application email accounts, `auth.users.id` and `public.users.id` are kept aligned.

## Requirements

- Node.js 20+
- npm 10+ recommended
- Existing PERSONA Supabase project
- Server-side Supabase Service Role key
- Supabase anon key
- Gemini key if AI generation is enabled
- Telegram bot token if Telegram authentication/bot features are enabled

## Install

```bash
npm ci
```

## Environment

Copy `.env.example` to your server environment and configure the real values. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, or `PERSONA_MIGRATION_SECRET` to Vite/browser variables.

## Development

```bash
npm run dev
```

## Static/type check

```bash
npm run lint
```

## Production build

```bash
npm run build
```

## Production start

```bash
npm start
```

## Supabase

1. Back up the existing database.
2. Keep the existing Supabase project.
3. Apply the existing production schema/migrations only when they match the current database state.
4. Apply `supabase/migrations/20260821_auth_integrity.sql` for legacy UUID reconciliation.
5. Do not delete `auth.users` or `public.users` to fix duplicate-email errors.

## Demo mode

Demo mode is disabled by default. If needed for a staging/demo environment, set both server `PERSONA_DEMO_MODE=true` and frontend `VITE_DEMO_MODE=true`, and configure a dedicated `PERSONA_DEMO_PASSWORD`. Never enable this on a production environment containing real users.
