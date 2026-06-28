# RBN — Rajput Business Network

A full-featured business membership platform connecting Rajput entrepreneurs and professionals across India — with a member directory, leads system, news, admin tools, and PWA support.

## Run & Operate

- The frontend runs automatically via the `artifacts/rbn-app: web` workflow
- `pnpm run typecheck` — full typecheck across all packages
- Required secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS v3 + shadcn/ui
- Backend: Self-hosted Supabase (auth, database, storage, realtime)
- PWA: vite-plugin-pwa with service worker
- Routing: react-router-dom v6

## Where things live

- `artifacts/rbn-app/src/` — all frontend source code
- `artifacts/rbn-app/src/integrations/supabase/client.ts` — Supabase client (reads env vars)
- `artifacts/rbn-app/src/pages/` — all page components
- `artifacts/rbn-app/src/hooks/` — data hooks (Supabase queries + realtime subscriptions)
- `artifacts/rbn-app/src/context/AuthContext.tsx` — auth context
- `artifacts/rbn-app/tailwind.config.ts` — Tailwind theme

## Architecture decisions

- Kept Supabase as the backend (user's own self-hosted instance at supabase.thinknlink.in) rather than replacing with Replit DB — the app has 20+ migrations, RPCs, realtime, and storage that would be a full rebuild.
- Tailwind v3 (not v4) — app was built with v3 syntax (`@tailwind base/components/utilities`). Using postcss plugin path in vite.config.ts instead of `@tailwindcss/vite`.
- No api-server routes needed for this app — all data goes directly to Supabase from the frontend.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set as secrets for the app to connect.

## Product

- Public: homepage, member directory, news/stories, about page
- Auth: login, signup (membership application), forgot/reset password
- Member dashboard: profile, directory, news, leads, asks, notifications
- Admin: member applications, manage members, roles, categories, leads, notice board, newsletter, announcements
- PWA: installable, push notifications, offline support

## User preferences

- Keep Supabase as the backend — no migration to Replit DB requested.

## Gotchas

- Tailwind v3: do NOT switch to `@tailwindcss/vite` plugin — use postcss config instead.
- The `lovable-tagger` and `vite-plugin-pwa` Vite plugins are dropped in the Replit build (PWA still works via the postcss/build path).
- All Supabase calls are made directly from the frontend — there is no Express API server doing data access.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Supabase migrations are in `.migration-backup/supabase/migrations/` for reference
