# Runtime CORS / API Routing Fix

## Root cause

The local Vite/Express development server runs the frontend and `/api/*` backend on the same origin (`http://localhost:3000`). The frontend API client previously had a hardcoded Railway fallback, so local browser requests were sent to the deployed Railway API. That made the browser perform a cross-origin request and exposed Railway's production CORS configuration to a local development origin.

## Fix

- Local Vite development now always uses same-origin API requests (`/api/*`).
- `VITE_API_BASE_URL` is used for production/Capacitor builds where the API is separately deployed.
- The Railway URL is no longer hardcoded in frontend source.
- Backend CORS continues to use an explicit allowlist; `*` is not used.
- `CORS_ORIGIN` may contain a comma-separated list of explicit origins.
- OPTIONS preflight remains handled before API routes and returns 204 for allowed origins.
- Added a real favicon and explicit `/favicon.ico` handling.
- Telegram haptics are guarded by `isVersionAtLeast("6.1")` and method checks, matching Telegram's documented HapticFeedback availability.

## Runtime configuration

### Local

- Browser: `http://localhost:3000`
- API: same origin, `/api/*`
- `VITE_API_BASE_URL` should be empty/unset.

### Production with same server serving the frontend

- Browser and API can remain same-origin.
- `VITE_API_BASE_URL` may remain empty.

### Production with a separately hosted frontend

- Set `VITE_API_BASE_URL` to the deployed HTTPS API origin.
- Set backend `APP_URL` or `CORS_ORIGIN` to the real frontend origin(s).
- Do not use `*`.

## Verification status

Static source review completed for the changed CORS/API routing and haptic/favicons paths. Full runtime verification of Railway CORS requires the deployed Railway service to receive the new backend code/configuration; this local source change does not redeploy Railway automatically.
