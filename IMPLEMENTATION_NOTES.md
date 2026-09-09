# Implementation notes — GitHub Pages edition

## Why the stack changed

The first starter used Next.js + SSR-oriented Supabase helpers and assumed Vercel. Travel Archive v1 does not require a private application server: all current UI logic can run in the browser and database access is protected by Supabase RLS. The project is therefore now React + Vite + `@supabase/supabase-js`, published as static files on GitHub Pages.

## Routing

GitHub Pages cannot rewrite arbitrary paths like `/timeline` to `index.html`. To avoid 404s without adding a custom 404 redirect hack, v1 uses hash navigation:

- `#/` — Map
- `#/timeline` — Timeline
- `#/trip/new` — Add trip

This also keeps Supabase PKCE auth codes in the query string separate from application routing in the hash.

## Authentication

The browser client uses:

- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: true`
- `flowType: 'pkce'`

Magic Link uses the GitHub Pages root as `emailRedirectTo`. Add that exact URL to Supabase's allowed redirect list.

## Demo mode

If the two `VITE_SUPABASE_*` variables are missing, the app deliberately loads mock data. This allows design development and GitHub Pages preview before the database is configured.

## RLS

All persistent trip data carries the authenticated `user_id`, and RLS policies restrict access to that user. Location child rows are allowed only when the parent trip is owned by `auth.uid()`.

## Date precision

Never normalize fuzzy values to January 1 or the first of a month. Precision is explicit (`year`, `month`, `day`) and date components that are not known remain NULL.

## Static hosting caveats

- Any `VITE_*` variable used by the build is embedded in the public JavaScript bundle. Only the Supabase publishable key belongs there.
- No service-role key, SMTP credential, or other server secret may be added to GitHub Pages.
- Tasks that truly require a secret server environment should later move to Supabase Edge Functions or a server platform; they are not needed for v1.
