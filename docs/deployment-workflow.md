# Mythos — Setup & Deployment Workflow

The complete, ordered path from empty folder to a live Vercel deployment, triggered by GitHub pushes.

> **Golden rule:** order matters more than tools. A few steps are painful to reverse — committing secrets, connecting an empty repo, importing before the first commit. Do them in the sequence below.

---

## Current status of this repo

| Item | State |
|---|---|
| Local folder | `C:\Users\maahe\OneDrive\Desktop\Maaheen-Data\Projects\Mythos` |
| GitHub repo | https://github.com/Maaheenkhn/Mythos (public, already created) |
| Cloned locally | Yes — permanent branches `main` and `develop` |
| Application code | None yet |
| Vercel | Not connected |
| Branching model | Git Flow — `main` (production) + `develop` (integration) |
| **Next step** | Phase 1 → scaffold the app on a branch off `develop` |

---

## Phase 0 — Prerequisites

| Tool | Install (Windows PowerShell) | Verify |
|---|---|---|
| Node.js LTS | `winget install OpenJS.NodeJS.LTS` | `node -v` |
| Git | `winget install Git.Git` | `git --version` |
| VS Code | `winget install Microsoft.VisualStudioCode` | — |

Also required: a **GitHub** account and a **Vercel** account (sign in with GitHub — it makes Phase 3 a one-click import).

Set your Git identity once per machine (required before your first commit):

```powershell
git config --global user.name "Maaheen"
git config --global user.email "you@example.com"
```

---

## Phase 1 — Choose the stack and scaffold

**Default choice: Next.js.** It is Vercel's own framework, so there is zero build configuration — Vercel auto-detects the preset, build command, and output directory.

Alternatives that also deploy with no config: Vite + React (static SPA), Astro, SvelteKit, plain HTML/CSS/JS.

Scaffold **inside the existing repo folder** (the folder already contains `.git/` and `README.md`, which `create-next-app` explicitly allows):

```powershell
cd "C:\Users\maahe\OneDrive\Desktop\Maaheen-Data\Projects\Mythos"
npx create-next-app@latest .
npm run dev
```

Open http://localhost:3000 and confirm the app runs.

> **Do not debug a deploy problem and a code problem at the same time.** The app must work locally before it goes anywhere near Vercel.

---

## Phase 2 — Git baseline (do this before your first commit)

Confirm `.gitignore` exists and ignores at least:

```
node_modules/
.next/
.env
.env*.local
.vercel
```

This must happen **before** the first commit. A secret pushed to GitHub is effectively public forever — fixing it means rewriting history *and* rotating the key.

```powershell
git status                  # review what will be committed
git add .
git commit -m "Scaffold Next.js app"
```

---

## Phase 3 — Push to GitHub

The repo already exists with commits, so skip `git init` and `git remote add`:

```powershell
git push
```

If you ever start from scratch instead, the order is:

```powershell
git init
git add .
git commit -m "Initial commit"
# create an EMPTY repo on github.com here (no README, no .gitignore)
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

> Creating the GitHub repo **with** a README and then pushing an existing history causes a `rejected — fetch first` conflict on the very first push. Always create it empty.

---

## Phase 4 — Import into Vercel (this is the first deploy)

1. Vercel dashboard → **Add New → Project**
2. **Import Git Repository** → authorize GitHub if prompted → select `Mythos`
3. Framework Preset: leave **auto-detected**
4. Build Command / Output Directory: leave defaults
5. **Environment Variables: add them now**, before the first build, or it fails
6. Click **Deploy**

That import **is** the production deploy. It builds `main` and gives you `mythos.vercel.app`.
Because production only ever receives releases, `main` must already contain the first promoted
release (`release/0.1.0`) before you import.

> Do not also run the `vercel` CLI. Two competing deploy sources cause confusing, duplicated deployments. Pick the GitHub integration.

---

## Phase 5 — The development loop (from now on)

```
edit code → commit → push to a branch → PR into develop → verify preview → merge
```

- Feature / fix branch → **Preview deployment** with its own URL
- `develop` → **Preview on a stable staging alias** (optionally `staging.` domain)
- `release/*` → **Preview** for the QA window
- Merge to **`main`** → **Production deployment** on your real domain

No manual deploy step exists in this workflow. Vercel builds on every push automatically.

---

## Phase 6 — Branching strategy (Git Flow)

Two permanent branches plus three kinds of temporary branches. A branch **is** an environment
selector in Vercel: `main` → production, `develop` and everything else → preview.

### The model

```
main        ●──────────────────●───────────────●──▶  production + tags (v0.1.0)
             \                / \             /
release/0.1   ●──●──●──●──────●   \           /      QA, fixes only
               \          \        \         /
develop         ●──●──●──●───●───●───●───●───●        integration / staging
                 \  \   \  /
              feat/* feat/* fix/*

hotfix/* (from main) ──▶ main ──back-merge──▶ develop
```

| Branch | Role | Cut from | Merges into | Vercel |
|---|---|---|---|---|
| `main` | Production, always shippable | — | — | Production |
| `develop` | Integration, always green | `main` (created once) | — | Preview alias, optionally a `staging.` domain |
| `feat/*`, `fix/*`, `chore/*`, `docs/*` | One task | `develop` | `develop` (squash) | Preview |
| `release/x.y.z` | Release candidate / QA | `develop` | `main` (merge commit) and back into `develop` | Preview |
| `hotfix/*` | Urgent production fix | `main` | `main` (merge commit) and back into `develop` | Preview |

### Rules

1. **Never commit directly to `main` or `develop`.** Both are protected; every change arrives through a PR.
2. **Branch every task off `develop`.** One task per branch, merged within a day or two.
3. **Features merge into `develop` with a squash merge.** Every PR gets a preview URL — verify on it before merging.
4. **`develop` must always be green and demo-able.** It is the integration environment, not a scratch pad.
5. **Cut `release/x.y.z` from `develop` when the version's scope is complete.** From that point the
   release branch takes **fixes only** — no new features. Bugs found in QA get `fix/*` branches cut
   from the release branch and merged back into it.
6. **Promote with a merge commit:** PR `release/x.y.z` → `main`, merge (not squash), then tag
   `vX.Y.Z` on `main`.
7. **Back-merge after every promotion:** merge `main` into `develop` immediately, so release-only
   fixes are not lost.
8. **Hotfixes branch off `main`,** merge to `main`, get a patch tag, then back-merge into `develop`
   (and the active release branch, if any).
9. **Keep `develop` in sync:** after a promotion or hotfix, `git merge main` into `develop`.
   Feature branches that fall behind should merge `develop` in before opening their PR.
10. **One release at a time.** Release windows should be hours, not weeks.
11. **Protect `main`, `develop` and `release/*`** with rulesets that require a PR and the Vercel
    status check.
12. **Naming:** lowercase, prefixed — `feat/…`, `fix/…`, `chore/…`, `docs/…`, `release/x.y.z`,
    `hotfix/…`.

> **Trade-off:** this model buys a stable staging environment and a frozen QA window at the cost of
> back-merges and more branches. Keep releases short and `develop` green, or it degrades into
> long-lived-branch merge pain.

### What Vercel does per branch

| Branch / event | Result |
|---|---|
| `main` | Production deploy → your real domain |
| `develop` | Preview on a stable branch alias — your staging URL |
| `release/*` | Preview for the QA window |
| any other branch | Preview deploy → `mythos-git-<branch>-<team>.vercel.app` |
| PR opened / updated | New preview + bot comment with URL, updated on every push |
| PR closed or merged | Preview deployment stays (optionally auto-deleted) |

### Day-to-day commands

```powershell
# start a task
git switch develop
git pull
git switch -c feat/add-login       # branch off up-to-date develop
# ...edit...
git add .
git commit -m "Add login form"
git push -u origin feat/add-login  # → PR into develop, Vercel builds a preview

# open the PR, check the preview, then Squash and merge into develop

git switch develop
git pull
git branch -d feat/add-login       # local cleanup
```

### Cutting a release

```powershell
git switch develop
git pull
git switch -c release/0.1.0
git push -u origin release/0.1.0   # QA on the preview URL; fixes only

# PR release/0.1.0 → main, merge with a merge commit

git switch main
git pull
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0

# back-merge so develop keeps the release fixes
git switch develop
git merge --no-ff main
git push
```

### Hotfix

```powershell
git switch main
git pull
git switch -c hotfix/payment-webhook
# fix, commit, push
# PR → main, merge, tag v0.1.1, then back-merge main into develop
```

---

## Phase 7 — Environment variables

Scope every variable to one or more of:

| Scope | Used by |
|---|---|
| **Production** | `main` only |
| **Preview** | `develop`, `release/*`, all feature branches and PRs |
| **Development** | `vercel dev` / local pull via `vercel env pull` |

Rules:

- Add variables **at import time** or builds fail with a confusing error.
- A variable that exists only in Production will break every preview build — and every `develop` and
  `release/*` build.
- Local secrets live in `.env.local` — never committed.
- Preview deploys must **not** write to the production database. `develop` and `release/*` are the
  riskiest because they run close to real data.

---

## Phase 8 — Hardening (do this early, not "later")

| Task | Where | Why |
|---|---|---|
| Protect `main` and `develop` | GitHub → Settings → Rules / Branches | Require a PR + passing Vercel status check on both. Add a `release/*` ruleset too. Even solo — it forces the preview step. |
| Auto-delete head branches | GitHub → Settings → General | Keeps the branch list clean after merges. |
| Deployment Protection | Vercel → Settings → Deployment Protection | By default, preview URLs are publicly reachable by anyone with the link. |
| Branch-specific database | Neon or Supabase branching | Preview deploys hitting the production DB is the classic accident. Do this before real user data exists. |
| Custom domain | Vercel → Settings → Domains | Point your domain at the project; production only. |

---

## Common failure modes

| Mistake | Consequence | Fix |
|---|---|---|
| Committed `.env` before adding `.gitignore` | Secret leaked publicly | Rewrite history **and** rotate the key |
| Created GitHub repo with a README, then pushed | `rejected — fetch first` on first push | Create repos empty, or `git pull --rebase` |
| Imported Vercel before any commit existed | Nothing to build | Push a commit first |
| Added env vars after the first deploy | Failed build with unclear error | Re-add vars, then Redeploy |
| Monorepo: imported repo root, app is in a subfolder | Builds the wrong directory | Set **Root Directory** in project settings |
| Ran `vercel` CLI *and* connected GitHub | Duplicate / competing deployments | Use one source of truth — the GitHub integration |
| Branch alive for 3+ weeks | Painful merge conflicts | Merge `develop` in weekly (or daily), or close it |
| Feature merged straight into `main` | Bypasses staging and the release QA | Protect `main`; features target `develop` only |
| Release merged but not back-merged into `develop` | The next release silently reverts the fix | Make `git merge main` into `develop` part of the promotion checklist |
| Pushed straight to `main` "just this once" | Untested code in production | Protect the branch — it's the only real enforcement |

---

## Condensed checklist

```powershell
# ── Phase 1: scaffold ──────────────────────────────
git switch develop
git pull
git switch -c feat/landing-scaffold
npx create-next-app@latest .
npm run dev                       # verify http://localhost:3000

# ── Phase 2: git baseline ──────────────────────────
# confirm .gitignore covers node_modules, .next, .env*, .vercel
git add .
git commit -m "Scaffold Next.js app"

# ── Phase 3: integrate ─────────────────────────────
git push -u origin feat/landing-scaffold   # PR → develop, squash merge

# ── Phase 4: release & Vercel ──────────────────────
git switch develop
git pull
git switch -c release/0.1.0
git push -u origin release/0.1.0           # PR → main, merge, tag v0.1.0
# then import Vercel (production branch: main)

# ── Phase 5+: loop ─────────────────────────────────
git switch develop
git pull
git switch -c feat/my-feature
# edit → commit → push → PR into develop → check preview → squash merge
```

- [ ] App runs locally
- [ ] `.gitignore` verified **before** first commit
- [ ] `develop` exists and is protected
- [ ] Feature branch merged into `develop` (never straight to `main`)
- [ ] `release/0.1.0` promoted to `main` and tagged
- [ ] Vercel project imported, env vars set at import
- [ ] First production deploy green
- [ ] `main` protected in GitHub
- [ ] Branch naming convention agreed (`feat/…`, `fix/…`, `release/…`)
- [ ] Preview database isolation (before real user data)
