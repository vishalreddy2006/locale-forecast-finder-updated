# Copilot instructions for this repo

This is a Vite + React + TypeScript app using Tailwind CSS and shadcn/ui. The single-page app renders at `src/pages/Index.tsx` and composes presentational cards from `src/components/**`.

## Architecture and data flow
- Entry: `src/main.tsx` mounts `App` which sets up React Query, tooltips, toasts, and React Router. Routes: `/` -> `src/pages/Index.tsx`.
- Index orchestrates state (temperature units, settings toggles, theme) and passes props into components:
  - `WeatherCard` shows current conditions
  - `ForecastCard` shows daily forecast tiles
  - `SearchBar` triggers searches; we extend it to support a “Use my location” action
  - `SettingsPanel` controls toggles (AI Tips, AI Analyzer, Auto-Refresh, Theme)
  - `AITipsCard` and `AIAnalyzerCard` are informational cards controlled by the toggles
- Styling: Tailwind + shadcn/ui. Prefer composing via existing UI primitives under `src/components/ui/*`.
- Imports use the `@/` alias (see `tsconfig.json` + `vite.config.ts`). Use `@/components/...` and `@/lib/...` rather than relative paths.

## Weather and geolocation
- Weather data is fetched from Open‑Meteo (no API key). Keep API access in `src/lib/weather.ts` which re‑exports provider functions from `src/lib/providers/openMeteo.ts`.
  - getCurrentWeather(lat, lon)
  - getSevenDayForecastWithMeta(lat, lon)
  - forwardGeocode(query) via Open‑Meteo Geocoding API
  - reverseGeocode(lat, lon) via OSM Nominatim with BigDataCloud fallback
- For “Use my location”, prefer `navigator.geolocation.getCurrentPosition` and then fetch weather + forecast; if denied/unavailable, fall back to IP‑based coords via `ipapi.co`.

## Conventions and patterns
- State lives in `Index.tsx` and is passed to dumb components. Avoid fetches in presentational components; keep side-effects in `Index.tsx` or a hook/service in `src/lib/`.
- Derive AI Tips / Analyzer text from current weather and forecast (no external AI calls). Keep this as pure functions next to the page or the weather service.
- Auto-Refresh is a 5-minute interval that reuses the last known coordinates or re-invokes geolocation if none are set.

## Developer workflows
- Install and run:
  - npm run dev – start Vite dev server
  - npm run build – production build
  - npm run preview – preview the production build
  - npm run lint – lint TypeScript/React
- No API key required for default data sources. If you later add OpenWeather as a secondary provider, keep keys in `.env` and never hardcode.

## Files to know
- `src/pages/Index.tsx` – main page; owns state and handlers, wires UI
- `src/components/SearchBar.tsx` – search input; add “Use my location” button via a new `onUseMyLocation` prop
- `src/components/SettingsPanel.tsx` – toggles for AI Tips, AI Analyzer, Auto-Refresh, Theme
- `src/components/WeatherCard.tsx` and `src/components/ForecastCard.tsx` – pure display components
- `src/lib/weather.ts` – weather and geocoding helpers (new)

## Example: adding a feature
1) Put network logic into `src/lib/weather.ts` (typed functions returning minimal DTOs).
2) In `Index.tsx`, call the service, update local state, and pass values to cards.
3) Add a prop to a presentational component instead of coupling it to fetch logic.

## Guardrails
- Handle network/API errors by showing a toast and keep the UI responsive; use sample data only for demos/tests if needed.
- Keep UI responsive: set loading state while fetching; catch errors and toast.
- Maintain TypeScript types for weather DTOs and component props.
