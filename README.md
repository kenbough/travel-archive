# Travel Archive

A map-first personal travel archive. **Record only the date precision you actually remember** and see your journeys on WORLD / JAPAN maps from both desktop and mobile.

## Architecture

```text
GitHub repository
  └─ GitHub Actions → GitHub Pages → React/Vite app
                                      │
                                      └─ Supabase
                                         ├─ Auth
                                         └─ PostgreSQL + RLS
```

No Vercel or application server is required for v1.

## What is implemented

- React 19 + TypeScript + Vite static SPA
- GitHub Pages deployment workflow
- Hash routes (`#/`, `#/timeline`, `#/trip/new`) so Pages never needs server-side rewrites
- WORLD map via `world-atlas` / Natural Earth
- JAPAN prefecture map prototype
- Category filters
- Year slider
- Country / prefecture history drawer
- Timeline
- Add Trip form
- Fuzzy dates: exact day / month only / year only
- Browser-only Supabase client
- Supabase Magic Link sign-in using PKCE
- Supabase trip reads + creation
- PostgreSQL schema and Row Level Security
- Demo data mode when Supabase environment variables are not configured

## Fuzzy date model

The database never turns an uncertain memory into a fake date.

| You remember | Stored | Display |
|---|---|---|
| 2010 only | `precision=year`, `start_year=2010` | `2010` |
| August 2010 | `precision=month`, `start_year=2010`, `start_month=8` | `2010.08` |
| Aug 1–8, 2026 | `precision=day` + exact parts | `2026.08.01—08` |

Only day-precision records contribute to `Known days`. A single exact day counts as one day. Fuzzy records still count as trips and still paint the map.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Without `.env.local`, the app starts in **DEMO DATA** mode and does not require Supabase.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor.
3. Copy `.env.example` to `.env.local` and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

4. In Supabase → Authentication → URL Configuration, add your local and GitHub Pages URLs. Use the exact production Pages URL for production.
5. Restart `npm run dev`.

The publishable key is intended for browser use. Never put a Supabase secret/service-role key in Vite environment variables or GitHub Pages.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to `main`.
2. GitHub → **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. GitHub → **Settings → Secrets and variables → Actions** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Push to `main`, or run **Actions → Deploy Travel Archive to GitHub Pages → Run workflow**.
5. Add the resulting Pages URL to Supabase Auth's allowed Redirect URLs and set it as the Site URL.

Vite builds into `dist/`; the included workflow uploads that directory to Pages.

## Map data

### WORLD

`world-atlas` provides Natural Earth country geometry as TopoJSON. Country records are matched to ISO 3166-1 alpha-3 codes and rendered on a draggable, zoomable orthographic globe.

### JAPAN

The simplified prefecture TopoJSON from `jpn-atlas@1.0.2` is vendored in `public/data/`, so the map renders without a cross-origin runtime dependency. See `public/data/README.md` and the included license.

## Current form conventions

- Country: comma-separated English country names or ISO alpha-3 codes (`South Korea, THA`)
- Prefecture: comma-separated Japanese names, English names, or prefecture codes (`長野県, Tokyo, 47`)
- Places: free text, comma-separated

A proper searchable location picker is the next UI improvement.

## Next milestones

1. Searchable country/prefecture picker
2. Edit/delete trips
3. Category settings and custom colors
4. JSON/CSV export
5. Vendor Japan map data locally
6. PWA/offline draft support
7. Optional shared couple/family maps
