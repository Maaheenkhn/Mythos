# Mythos — Scaffold & Deploy Plan

> **Status:** executable plan. Follow the steps in order. Milestone 1 ends with a public Vercel URL
> that renders the Mythos landing screen; later milestones turn the scaffold into the store described
> in [`architecture.md`](./architecture.md).

## Goal of Milestone 1

A deployed, production-quality **single-screen landing page** at a Vercel URL:

- `Mythos` wordmark as the hero, in a strictly black-and-white monochrome palette
- Low-contrast background illustrations (line art, grain, vignette) that blend into the background
- No client-side JavaScript beyond what Next.js needs, no external assets, no analytics yet
- The repo scaffolded to match the target architecture: Next.js App Router, TypeScript, Tailwind,
  Supabase client modules, environment contract, health endpoint
- Vercel connected to GitHub, preview deployments working, `main` and `develop` protected
- Local, preview and production all verified on a throttled mobile connection

**Out of scope for Milestone 1:** catalog, cart, checkout, payments, webhooks, email, image uploads,
authentication, analytics. Those are separate branches in the roadmap below.

## Decisions locked

| Decision | Choice | Why |
|---|---|---|
| Host | **Vercel** | Native Next.js support, zero build config, instant rollback |
| Plan | Hobby for scaffold → **Pro before selling** | Hobby is non-commercial and its cron is daily-only |
| Framework | **Next.js App Router + TypeScript** | Matches architecture; Server Components/Actions available |
| Styling | **Tailwind CSS** | Fast, consistent monochrome tokens, no runtime cost |
| Package manager | **npm** | Matches `deployment-workflow.md`, no extra tooling |
| Database | **Supabase**, region **Mumbai (`ap-south-1`)** | Closest viable region to Pakistan for direct browser reads |
| Reservation expiry | **Supabase `pg_cron`** | Minute-level; Vercel Hobby cron is once per day |
| Checkout | Hosted payment page (later milestone) | No card data in the app |

## Branch map

The repo runs **Git Flow**. `main` (production) and `develop` (integration) are permanent. Every task
branches off `develop` and merges back into it; only a `release/x.y.z` branch promotes work to
production.

| Stage | Branch | Scope | Merges into |
|---|---|---|---|
| Docs | `docs/deployment-workflow`, `docs/architecture`, `docs/scaffold-plan` | Already pushed | `develop` |
| **M1** | **`feat/landing-scaffold`** | Scaffold, design system, landing screen | `develop` |
| **Release 0.1** | **`release/0.1.0`** | Promote M1 to production; first Vercel deploy | `main` (tag `v0.1.0`), back-merge `develop` |
| M2 | `feat/data-model` | Schema, RLS, RPCs, `pg_cron`, seed | `develop` |
| M3 | `feat/catalog` | Product listing/detail, cart shell | `develop` |
| M4 | `feat/checkout` | `/api/checkout`, payment provider interface | `develop` |
| M5 | `feat/payment-webhook` | Signature verification, idempotent state machine | `develop` |
| M6 | `feat/reservations` | Expiry job, lazy availability, concurrency tests | `develop` |
| M7 | `feat/notifications-media` | Resend, Cloudinary, PostHog proxy | `develop` |
| M8 | `chore/hardening` | Rate limits, error tracking, backups, Pro upgrade | `develop` |

Cut a release whenever a group of milestones is stable on `develop` — typically after M1, after
M3/M4, and before launch.

## Milestone 1 — step by step

### Step 0 — Preflight

- [ ] Node 22.x and npm 11.x installed (verified on this machine: Node `22.19.0`, npm `11.6.0`)
- [ ] GitHub account with push access to `Maaheenkhn/Mythos`
- [ ] Vercel account created **with GitHub login** (makes the import one click)
- [ ] Supabase account created
- [ ] Cloudflare account (only when you attach the domain)
- [ ] A password manager entry for the Supabase database password
- [ ] Start payment-gateway merchant onboarding **in parallel** — KYC takes days and is not a coding
      task

> **One-time exception to the preview rule:** the very first deploy has to come from `main`, because
> a Vercel project cannot build a branch before the project exists. For this bootstrap only, promote
> the scaffold through `develop` → `release/0.1.0` → `main`, then import Vercel. Every later change
> gets a preview URL before merge.

### Step 1 — Branch

```powershell
git switch develop
git pull
git switch -c feat/landing-scaffold
```

### Step 2 — Scaffold Next.js in place

`create-next-app` refuses a non-empty folder unless it only contains `.git`, `README.md`, `.gitignore`
and similar. Since `docs/` will exist after the docs branches merge into `develop`, move it aside for
the scaffold and restore it immediately after.

```powershell
Move-Item docs ..\Mythos-docs-temp
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
Move-Item ..\Mythos-docs-temp docs
```

If the CLI asks anything the flags did not cover, accept the defaults **except** React Compiler
(choose **No** — keep the scaffold boring). If it overwrites `README.md`, restore the original
project description.

Verify:

```powershell
npm run dev
```

Open http://localhost:3000. The default Next.js page must render before you change anything.

Confirm `.gitignore` contains at least:

```
node_modules/
.next/
.env
.env*.local
.vercel
```

### Step 3 — Dependencies

```powershell
npm install @supabase/supabase-js @supabase/ssr server-only zod
```

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Cookie-aware browser/server clients for the App Router |
| `server-only` | Build-time guard so privileged modules cannot be imported into client code |
| `zod` | Validate environment variables once, fail loudly at startup |

Add a Node pin so local and Vercel agree:

```json
"engines": { "node": ">=22 <23" }
```

### Step 4 — Environment contract

Create `.env.example` (committed, no secrets):

```dotenv
# Public — safe in the browser, protected by RLS
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server only — NEVER prefix with NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=

# Filled in later milestones
PAYMENT_PROVIDER=
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
RESEND_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_SITE_URL=
```

Create `.env.local` (ignored) with the real values from Step 5 for the two public variables and the
service-role key. Supabase's dashboard now labels these **publishable** and **secret** keys; they map
to the anon/service-role values used by `supabase-js`.

`src/lib/env.ts` validates them with zod:

- public schema parsed eagerly in browser/server modules that need it
- server schema parsed lazily inside a `server-only` module, so the landing page builds even if
  server secrets are absent
- no secret ever read from a module imported by a client component

### Step 5 — Create the Supabase project now

1. dashboard.supabase.com → **New project**
2. Name: `mythos`; region: **Mumbai (`ap-south-1`)**; generate and store a strong DB password
3. Project Settings → API → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable / anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Secret / service-role key → `SUPABASE_SERVICE_ROLE_KEY` (server only)
4. Do **not** create tables yet — that is M2
5. Note the free-tier pause: a project with no activity for about a week is paused and the app goes
   offline. Add an uptime ping later or upgrade before launch

### Step 6 — Add the Supabase module skeleton

```
src/lib/supabase/
  browser.ts   # createBrowserClient(...)  — for direct catalog reads later
  server.ts    # createServerClient(...)   — RLS-scoped, cookie-aware
  admin.ts     # createClient(service role) — import "server-only"
```

Rules to encode in the files:

- `admin.ts` starts with `import "server-only"` and sets `auth: { persistSession: false }`
- `browser.ts` uses only `NEXT_PUBLIC_*` variables
- the landing page imports **none** of these, so it stays static and fast

`src/app/api/health/route.ts` (a deploy smoke test, no database dependency):

```ts
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "mythos",
    timestamp: new Date().toISOString(),
  });
}
```

### Step 7 — Design tokens (monochrome only)

`src/app/globals.css` — Tailwind v4 syntax plus theme tokens:

```css
@import "tailwindcss";

@theme {
  --color-ink: #0a0a0a;
  --color-graphite: #171717;
  --color-slate: #404040;
  --color-ash: #737373;
  --color-silver: #a3a3a3;
  --color-mist: #d4d4d4;
  --color-paper: #f5f5f5;
}
```

| Token | Hex | Use |
|---|---|---|
| Ink | `#0A0A0A` | Page background |
| Graphite | `#171717` | Raised surfaces |
| Slate | `#404040` | Hairlines, dividers |
| Ash | `#737373` | Secondary text (large only) |
| Silver | `#A3A3A3` | Body/secondary text |
| Mist | `#D4D4D4` | Emphasis text |
| Paper | `#F5F5F5` | Wordmark, primary text |

- **No accent colour.** Hierarchy comes from size, weight, opacity and letter-spacing.
- Fonts: `Instrument Serif` for the wordmark, `Geist Sans` for everything else, loaded with
  `next/font` (self-hosted at build, no layout shift). Fall back to the scaffold's Geist if the
  network blocks font downloads during build.

### Step 8 — Build the landing screen

Visual target (desktop; collapses gracefully on mobile):

```
┌──────────────────────────────────────────────────────┐
│              faint constellation dots                │
│        ╭──── faint contour lines ────╮              │
│                                                      │
│                     Mythos                           │
│            APPAREL, IN MONOCHROME                    │
│                                                      │
│        ╰──── faint arches / grain ────╯              │
│                                                      │
│  Karachi · Est. 2026                                 │
└──────────────────────────────────────────────────────┘
```

Files:

```
src/app/layout.tsx            metadata, fonts, body colours
src/app/page.tsx              hero composition (Server Component)
src/app/opengraph-image.tsx   1200×630 black OG card with the wordmark
src/app/icon.svg              monochrome "M" favicon
src/components/landing/
  Wordmark.tsx                h1 "Mythos"
  Backdrop.tsx                all background layers, aria-hidden
  Footer.tsx                  location + year
```

Layout and typography:

- `min-h-dvh`, `grid`, `place-items-center`; generous negative space, no cards or borders
- Wordmark: serif, `clamp(3.5rem, 14vw, 10rem)`, `tracking-[-0.03em]`, `text-paper`
- Tagline: uppercase, `tracking-[0.35em]`, `text-xs`, `text-silver`
- Footer: absolute bottom, `text-[11px]`, `text-ash`, safe-area padding on iOS
- Entrance: one CSS fade/rise animation, 700 ms, `prefers-reduced-motion: reduce` disables it
- No hamburger, no nav, no buttons in M1

Background illustrations (`Backdrop.tsx`, pure SVG/CSS, no images, no JS):

1. **Vignette** — radial gradient, centre `#1A1A1A` fading to `#050505` at the edges
2. **Topographic contours** — hand-authored `<path>` curves, 1 px white strokes at **4–6 % opacity**,
   positioned bottom-left, oversized so they bleed off-screen
3. **Architectural arches** — three concentric arch line drawings, 5 % opacity, right side, mirrored
   on mobile
4. **Constellation dots** — small circles + hairlines, 6 % opacity, top area
5. **Grain** — inline SVG `feTurbulence` data URI, **3–4 % opacity**, no animation (keeps paint cheap)
6. **Drift** — optional 60 s translate/rotate loop on layers 2–4, disabled under reduced motion

All layers: `pointer-events-none`, `aria-hidden="true"`, `fixed inset-0`, `-z-10`, and a radial mask
so edges fade into the background rather than ending abruptly. **The illustrations must never compete
with the wordmark** — if in doubt, lower opacity.

Performance guardrails:

- 100 % Server Components; zero client bundle for the landing page (check the build output)
- no external fonts/images/scripts; total page transfer target **< 150 KB**
- LCP element is the wordmark text, so there is nothing heavy to load

Metadata:

- `title: "Mythos"`, description, `metadataBase` from `NEXT_PUBLIC_SITE_URL` or
  `VERCEL_PROJECT_PRODUCTION_URL`
- Open Graph + Twitter card using `opengraph-image.tsx`, theme colour `#0A0A0A`
- `robots.ts` allowing the page, `lang="en"`

### Step 9 — Base security headers

`next.config.ts`:

- `poweredByHeader: false`
- headers for all routes: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- add a strict CSP in M7, once third-party scripts exist — a CSP now would only be noise

### Step 10 — Verify locally

```powershell
npm run lint
npx tsc --noEmit
npm run build
npm start
```

Checklist:

- [ ] `npm run build` shows the landing route as static
- [ ] `npm start` → wordmark, tagline, illustrations render
- [ ] 320 px, 375 px, 768 px, 1440 px: no horizontal scroll, no clipped wordmark
- [ ] Tab key: visible focus ring; only the skip link (if added) is focusable
- [ ] OS "reduce motion" disables the drift and entrance animation
- [ ] Lighthouse mobile (throttled): Performance ≥ 95, Accessibility 100, LCP < 2.5 s
- [ ] DevTools network: no third-party requests; JS footprint matches the build output
- [ ] `/api/health` returns `200` with `{ ok: true }`
- [ ] Console clean

### Step 11 — Commit, push, open the PR

```powershell
git add .
git commit -m "Scaffold Next.js app and add the Mythos landing screen"
git push -u origin feat/landing-scaffold
```

Open the PR **against `develop`** (not `main`) from the link GitHub prints. The description should
include:

- what the screen looks like (screenshot)
- the architecture decisions this scaffold encodes
- local verification results (Lighthouse numbers)
- "No Vercel project exists yet; the first preview happens after the release is imported"

> This is the **only** time work is promoted without a preview deploy. From M2 onward, every branch
> gets a preview URL before merge.

### Step 12 — Merge into `develop`

Squash and merge the PR into `develop`, then update locally:

```powershell
git switch develop
git pull
git branch -d feat/landing-scaffold
```

### Step 12b — Promote through `release/0.1.0`

M1 reaches production exactly the way every later release will:

```powershell
git switch develop
git pull
git switch -c release/0.1.0
git push -u origin release/0.1.0

# open PR release/0.1.0 → main, merge with a merge commit
# (no new features on this branch — QA fixes only, if any)

git switch main
git pull
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0

# back-merge so develop stays in sync
git switch develop
git merge --no-ff main
git push
```

`main` now contains the landing screen. Nothing is deployed yet.

### Step 13 — Import into Vercel

1. vercel.com → **Add New → Project**
2. **Import Git Repository** → authorize GitHub if prompted → select `Mythos`
3. Framework Preset: **Next.js** (auto-detected)
4. Root Directory: `./`
5. Build / Output / Install commands: leave defaults
6. Node.js Version: **22.x**
7. **Environment Variables** — add before the first build, for **Production, Preview and
   Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — mark **Sensitive**
   - `NEXT_PUBLIC_SITE_URL` — the production URL once known; add it now with the Vercel domain and
     update later
8. **Deploy**

That import builds `main` (now containing `v0.1.0`) and **is** the first production deploy. Expected
result: `https://mythos-<hash>.vercel.app` opens the landing screen.

> Do not also run `vercel --prod` from a laptop. One deploy source: the GitHub integration.

### Step 14 — Verify the production deployment

- [ ] Production URL renders the screen on desktop and a real phone
- [ ] `https://<domain>/api/health` returns `{ ok: true }`
- [ ] HTTPS certificate valid; HTTP redirects to HTTPS
- [ ] `curl -I` shows the security headers and no `X-Powered-By`
- [ ] OG card preview renders in Slack/WhatsApp/X
- [ ] Vercel → Deployments shows the build as **Ready**, build log free of warnings
- [ ] Throttled 3G test: wordmark paints immediately (`font-display: swap` via `next/font`)

### Step 15 — Prove the preview loop works

Before hardening, confirm branching behaves as designed:

```powershell
git switch develop
git pull
git switch -c chore/verify-preview
# make a trivial README tweak
git commit -am "Verify Vercel preview deployments"
git push -u origin chore/verify-preview
```

- [ ] Vercel builds a **Preview** deployment for the branch
- [ ] The preview URL is reachable
- [ ] A PR against `develop` shows the bot comment with the preview link
- [ ] Squash merge into `develop`; production is untouched
- [ ] Delete the branch

### Step 16 — Harden the workflow

| Task | Where | Setting |
|---|---|---|
| Protect `main` | GitHub → Settings → Rules | Require a pull request; require the Vercel status check; no force pushes |
| Protect `develop` | GitHub → Settings → Rules | Same requirement — it is the integration trunk |
| Protect `release/*` | GitHub → Settings → Rules | Branch pattern ruleset: PR + Vercel check, fixes only |
| Staging alias | Vercel → Settings → Domains | Optionally point `staging.<domain>` at `develop` |
| Auto-delete branches | GitHub → Settings → General | Enable "Automatically delete head branches" |
| Preview protection | Vercel → Settings → Deployment Protection | Decide whether previews should require login |
| Production branch | Vercel → Settings → Git | `main` |
| Ignored build step | Vercel → Settings → Git | Leave default (builds every push) |
| Rollback rehearsal | Vercel → Deployments | Promote the previous deployment, then restore the latest |

Status-check name: GitHub shows it as `Vercel` or `Vercel – <project>`; select whichever appears
after the first deployment.

### Step 17 — Domain (optional for M1)

1. Vercel → Settings → Domains → add apex + `www`
2. In Cloudflare DNS:
   - apex `A` → `76.76.21.21` (confirm the current value shown by Vercel)
   - `www` `CNAME` → `cname.vercel-dns.com`
   - proxy **off** (DNS only) initially — avoid a double CDN while debugging
3. Wait for the certificate, verify `https://` and the `www` → apex redirect
4. Set `NEXT_PUBLIC_SITE_URL` to the final URL in Vercel and redeploy so metadata/OG are absolute

### Definition of done (M1)

- [ ] `develop` contains the scaffold and the landing screen
- [ ] `release/0.1.0` merged into `main` and tagged `v0.1.0`
- [ ] Vercel production URL opens the Mythos screen over HTTPS
- [ ] Preview deployments work for any branch and comment on PRs into `develop`
- [ ] `.gitignore` verified before the first commit; no secret in the repo or client bundle
- [ ] `/api/health` green in production
- [ ] Lighthouse mobile ≥ 95 performance, 100 accessibility
- [ ] `main` and `develop` protected; branch naming convention followed
- [ ] Docs branches merged into `develop` and linked from `README.md`
- [ ] `README.md` explains `npm run dev`, env setup and the Git Flow deploy path

## Milestones after M1

Every milestone branches off `develop` and merges back into it. A release is cut only when the
accumulated work on `develop` is stable.

| # | Branch | Deliverables | Exit criteria |
|---|---|---|---|
| M2 | `feat/data-model` | Migrations for `products`, `variants`, `orders`, `order_items`, `reservations`, `payments`, `webhook_events`, `order_events`; RLS default-deny; `place_order()`; `expire_reservations()`; `pg_cron` schedule; seed data; generated TS types | Fresh DB migrates from zero; a concurrency test proves no oversell |
| M3 | `feat/catalog` | Product list/detail via direct Supabase reads; cart state; Cloudinary image delivery; empty/loading/error states | Catalog works on a throttled phone; no product/price data trusted from the client |
| M4 | `feat/checkout` | `/api/checkout`, `PaymentProvider` interface, gateway sandbox, idempotency key, order confirmation page | Sandbox payment returns a checkout URL; duplicate submits create one order |
| M5 | `feat/payment-webhook` | `/api/webhooks/payment`, raw-body signature verification, `webhook_events` idempotency, legal state transitions, replay test suite | Replayed and out-of-order webhooks never double-pay or regress state |
| M6 | `feat/reservations` | Expiry job wired to `pg_cron`; availability treats expired holds as unavailable; release-on-payment | Expired reservations restore stock; a failed cron cannot oversell |
| M7 | `feat/notifications-media` | Resend receipts after webhook via `after()`; signed Cloudinary uploads for admin; PostHog via first-party `/ingest` proxy with consent | Emails arrive once per paid order; no unsigned uploads possible |
| M8 | `chore/hardening` | Rate limiting, error tracking (Sentry), CSP, backups/export routine, uptime ping, Vercel Pro + Supabase upgrade decision | Incident runbook written; rollback rehearsed |

## Failure modes specific to this plan

| Symptom | Cause | Fix |
|---|---|---|
| `create-next-app` refuses the folder | `docs/` present | Move `docs/` aside (Step 2) and restore it |
| First Vercel build fails: "No Next.js version detected" | Project imported before the app existed on `main` | Promote the release to `main` first (Step 12b), then import |
| Build fails fetching fonts | `next/font/google` needs network | Keep the scaffold's bundled Geist, or vendor the font files locally |
| 404 on production but works locally | Wrong Root Directory or branch | Root `./`; production branch `main` |
| Preview builds fail but production works | Env var scoped to Production only | Add the same variables for Preview |
| Fonts flash / layout shift | Custom font without `next/font` | Use `next/font` only |
| Background looks muddy or too loud | Opacity too high | Keep line art at 4–6 %, grain at 3–4 % |
| Preview URL publicly reachable | Vercel default | Enable Deployment Protection if previews must be private |

## Rollback

- **Bad deploy:** Vercel → Deployments → previous deployment → **Promote to Production** (instant,
  no rebuild)
- **Bad merge on `main`:** `git revert <sha>` on `main` → push → Vercel redeploys → back-merge
  `main` into `develop`
- **Bad release:** keep the tag, cut `hotfix/<issue>` from `main`, merge to `main`, tag a patch, then
  back-merge into `develop`
- **Broken env:** fix in Vercel → **Redeploy** (env changes require a new build)

## Commands you will reuse

```powershell
# local
npm run dev
npm run lint
npx tsc --noEmit
npm run build

# feature loop (develop is the base and the merge target)
git switch develop
git pull
git switch -c feat/<task>
# edit → verify → commit
git push -u origin feat/<task>
# open PR → develop → preview → squash merge

# cleanup
git switch develop
git pull
git branch -d feat/<task>

# release
git switch develop
git pull
git switch -c release/x.y.z
git push -u origin release/x.y.z
# PR → main, merge commit, tag vX.Y.Z, then back-merge main into develop
```
