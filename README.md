# Mythos

Monochrome apparel storefront for Karachi. Next.js (App Router) on Vercel, Supabase for data.

## Stack

- Next.js 16 (App Router, Server Components, Route Handlers)
- TypeScript + Tailwind CSS v4
- Supabase (Postgres, RLS, Auth, RPC) — catalog reads go direct from the browser with the anon key
- Resend (email), Cloudinary (images), PostHog (analytics) — wired in later milestones

## Local development

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

```powershell
npm run lint
npm run typecheck
npm run build
npm start
```

## Environment

Copy `.env.example` to `.env.local` and fill in the values from Supabase:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public and safe in the browser.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`.

## Branching and deployment

Git Flow, deployed by Vercel from GitHub:

- `feat/*`, `fix/*`, `chore/*`, `docs/*` branch off `develop` and merge back into it
- `release/x.y.z` is cut from `develop`, merged into `main`, and tagged
- `main` → production, `develop` → staging preview, every other branch → preview

See [`docs/deployment-workflow.md`](docs/deployment-workflow.md) and
[`docs/architecture.md`](docs/architecture.md).
