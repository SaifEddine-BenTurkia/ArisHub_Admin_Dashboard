# Admin Dashboard Cloudflare Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the standalone ArisHub administrator dashboard at `https://admin.arishub.site` through Cloudflare Pages, protect it with an exact-email Cloudflare Access policy, and keep the NestJS administrator login as the authoritative application-level control.

**Architecture:** GitHub stores the private React/Vite source and runs validation CI. Cloudflare Pages builds the immutable static application from `main`, serves it on `admin.arishub.site`, and redirects SPA routes to `index.html`. Cloudflare Access authenticates the operator before the dashboard loads; the browser then authenticates independently against `https://api.arishub.site`. The existing Docker/Nginx build remains a tested rollback path and is not the primary deployment.

**Tech Stack:** React 19, TypeScript, Vite 8, React Router, ESLint, GitHub Actions, Cloudflare Pages, Cloudflare Zero Trust Access, NestJS API, Docker/Nginx rollback image.

**Spec:** `docs/superpowers/specs/2026-08-31-admin-cloudflare-pages-deployment-design.md`

## Global Constraints

- Work only in `C:\ARISHUB\Dev\aris\ArisHub\ArisHub_Admin_Dashboard`; do not modify the Flutter or backend repositories while preparing this repository.
- Never commit `.env`, credentials, API keys, Cloudflare tokens, GitHub tokens, administrator passwords, or VPS SSH material.
- Treat every `VITE_*` value as public browser configuration. Only `VITE_API_BASE_URL` is required.
- Do not weaken backend administrator authentication because Cloudflare Access exists. Both controls must remain active.
- Do not create a Cloudflare Access `Everyone`, all-valid-email, or whole-domain Allow rule. Allow only the operator's exact administrator email address.
- Cloudflare Git integration performs deployment; GitHub Actions validates only and therefore needs no Cloudflare deployment token.
- Request operator authorization immediately before the first external `git push` or any Cloudflare/VPS mutation.
- Preserve the Docker/Nginx files and verify that they still build after Pages preparation.
- Baseline on 31 August 2026: typecheck and production build pass; lint exits successfully with two `react-refresh/only-export-components` warnings.

---

## Task 1: Make the standalone repository safe to publish

**Files:**

- Modify: `.gitignore`
- Verify: `.env.example`
- Verify: `.dockerignore`
- Remove generated untracked files: `tsconfig.app.tsbuildinfo`, `tsconfig.node.tsbuildinfo`, `vite.config.js`, `vite.config.d.ts`

- [ ] **Step 1: Confirm repository identity and boundaries**

Run:

```powershell
git rev-parse --show-toplevel
git remote -v
git status --short
```

Expected: the top level is exactly `ArisHub_Admin_Dashboard`, branch is `main`, and `origin` is `git@github.com:SaifEddine-BenTurkia/ArisHub_Admin_Dashboard.git`.

- [ ] **Step 2: Replace `.gitignore` with explicit launch-safe rules**

Use exactly:

```gitignore
node_modules/
dist/
coverage/
.wrangler/

.env
.env.*
!.env.example

*.log
*.tsbuildinfo
vite.config.js
vite.config.d.ts
.DS_Store
```

- [ ] **Step 3: Verify generated files are ignored before removing them**

Run:

```powershell
git check-ignore -v tsconfig.app.tsbuildinfo tsconfig.node.tsbuildinfo vite.config.js vite.config.d.ts
```

Expected: all four paths match `.gitignore`.

- [ ] **Step 4: Remove only the four verified generated files**

Run:

```powershell
Remove-Item -LiteralPath 'tsconfig.app.tsbuildinfo','tsconfig.node.tsbuildinfo','vite.config.js','vite.config.d.ts'
```

Expected: source `vite.config.ts` remains present.

- [ ] **Step 5: Confirm environment files cannot be staged accidentally**

Run:

```powershell
git check-ignore -v .env .env.local .env.production
git check-ignore .env.example
```

Expected: the first command reports ignore matches. The second returns no output and a non-zero status because `.env.example` is intentionally committable.

- [ ] **Step 6: Stage the existing application source without generated artifacts**

Run:

```powershell
git add .dockerignore .env.example .gitignore Dockerfile README.md eslint.config.js index.html nginx.conf package-lock.json package.json src tsconfig.app.json tsconfig.json tsconfig.node.json vite.config.ts
git status --short
```

Expected: application source is staged; no `.env`, `dist`, `node_modules`, `*.tsbuildinfo`, `vite.config.js`, or `vite.config.d.ts` appears.

- [ ] **Step 7: Run the clean baseline gates**

Run:

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0. Record the two known Fast Refresh warnings but do not expand this deployment task into a component refactor.

- [ ] **Step 8: Commit the standalone application baseline**

Run:

```powershell
git commit -m "feat: add standalone admin dashboard"
```

Expected: the source is committed independently from deployment configuration.

---

## Task 2: Add Cloudflare Pages routing and response headers

**Files:**

- Create: `public/_redirects`
- Create: `public/_headers`
- Modify: `.env.example`
- Verify: `dist/_redirects`
- Verify: `dist/_headers`

- [ ] **Step 1: Write a failing artifact check before adding Pages files**

Run:

```powershell
npm run build
Test-Path dist/_redirects
Test-Path dist/_headers
```

Expected before implementation: both checks print `False`.

- [ ] **Step 2: Add the SPA fallback**

Create `public/_redirects` with exactly:

```text
/* /index.html 200
```

This allows direct loads of `/providers`, `/clients/:id`, `/jobs/:id`, and other React Router routes.

- [ ] **Step 3: Add Pages security and cache headers**

Create `public/_headers` with exactly:

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.arishub.site; frame-ancestors 'none'; base-uri 'self'; form-action 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 4: Document the sole public browser variable in `.env.example`**

Use exactly:

```dotenv
# Public browser configuration; never place secrets in VITE_* variables.
VITE_API_BASE_URL=http://localhost:3000
```

- [ ] **Step 5: Build with the production API URL and verify copied artifacts**

Run:

```powershell
$env:VITE_API_BASE_URL = 'https://api.arishub.site'
npm run build
Get-Content -Raw dist/_redirects
Get-Content -Raw dist/_headers
Select-String -Path dist/assets/*.js -Pattern 'https://api.arishub.site' -SimpleMatch
Remove-Item Env:VITE_API_BASE_URL
```

Expected: both Pages files exist in `dist`; the JavaScript bundle contains the production API URL; no secret appears in output.

- [ ] **Step 6: Commit Pages compatibility**

Run:

```powershell
git add public/_redirects public/_headers .env.example
git commit -m "feat: add Cloudflare Pages configuration"
```

---

## Task 3: Add GitHub validation CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Confirm no workflow exists**

Run:

```powershell
Test-Path .github/workflows/ci.yml
```

Expected before implementation: `False`.

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

Use exactly:

```yaml
name: Admin dashboard CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: admin-dashboard-ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      VITE_API_BASE_URL: https://api.arishub.site
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install locked dependencies
        run: npm ci

      - name: Type-check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build production bundle
        run: npm run build

      - name: Verify Cloudflare Pages artifacts
        shell: bash
        run: |
          test -s dist/index.html
          test -s dist/_redirects
          test -s dist/_headers
          grep -Fq '/* /index.html 200' dist/_redirects
```

- [ ] **Step 3: Validate the workflow content locally**

Run:

```powershell
Select-String -Path .github/workflows/ci.yml -Pattern 'npm ci','npm run typecheck','npm run lint','npm run build','dist/_redirects','dist/_headers'
git diff --check
```

Expected: every required gate appears and `git diff --check` reports no whitespace errors.

- [ ] **Step 4: Re-run the same gates locally**

Run:

```powershell
npm ci
npm run typecheck
npm run lint
$env:VITE_API_BASE_URL = 'https://api.arishub.site'
npm run build
Remove-Item Env:VITE_API_BASE_URL
```

Expected: all commands exit 0 and Pages artifacts remain in `dist`.

- [ ] **Step 5: Commit CI**

Run:

```powershell
git add .github/workflows/ci.yml
git commit -m "ci: validate admin dashboard builds"
```

---

## Task 4: Add the deployment and rollback runbook

**Files:**

- Create: `docs/cloudflare-pages-deployment-runbook.md`
- Modify: `README.md`

- [ ] **Step 1: Add a concise deployment section to `README.md`**

Replace the current VPS-oriented production checklist with a `Cloudflare Pages deployment` section that links to `docs/cloudflare-pages-deployment-runbook.md` and states:

```markdown
## Cloudflare Pages deployment

The primary production host is `https://admin.arishub.site`. Cloudflare Pages builds the private GitHub repository with `npm run build`, publishes `dist`, and injects the public variable `VITE_API_BASE_URL=https://api.arishub.site`.

Cloudflare Access must protect the whole hostname with an exact-email Allow policy. Access does not replace the dashboard's NestJS administrator login. See [the deployment runbook](docs/cloudflare-pages-deployment-runbook.md) for first deployment, verification, and rollback.
```

Keep the existing local development, production build, Docker rollback, JWT/session, and API CORS explanations.

- [ ] **Step 2: Create `docs/cloudflare-pages-deployment-runbook.md`**

The runbook must contain these sections and concrete values:

1. `Prerequisites`: private GitHub repo, `main`, Cloudflare zone `arishub.site`, approved exact administrator email, healthy `https://api.arishub.site`, backend admin credentials stored outside Git.
2. `First push`: SSH verification, `git push -u origin main`, GitHub Actions validation.
3. `Create Pages project`: connect GitHub repository, production branch `main`, build command `npm run build`, output `dist`, Node 22 build variable if Cloudflare requires it, and `VITE_API_BASE_URL=https://api.arishub.site` for Production and Preview.
4. `Attach hostname`: add `admin.arishub.site` using the Pages Custom domains screen and wait for Active HTTPS status; do not manually create a conflicting DNS record.
5. `Protect with Access`: create a self-hosted application for `admin.arishub.site/*`, add one Allow policy whose Include selector is the exact administrator email, verify no broad Allow policy exists, and set a finite session duration.
6. `Backend CORS`: in protected VPS production configuration, add `https://admin.arishub.site` to the comma-separated `CORS_ORIGINS`, restart only the backend service, and verify its health before dashboard testing.
7. `Acceptance`: denied unapproved identity; approved identity reaches login; valid admin login; overview; provider review; recharge review; client/job search; logout; deep-link reload; no CORS or mixed-content errors.
8. `Normal releases`: merge/push to `main`, wait for CI and Pages deployment, smoke-test before announcing.
9. `Rollback`: use Cloudflare Pages Deployments to roll back to the preceding successful production deployment; if Pages itself is unavailable, deliberately deploy the existing Docker image and repoint DNS only with an operator-approved change window.
10. `Secret handling`: never paste or commit Cloudflare/GitHub tokens, admin credentials, backend secrets, or SSH private keys.

- [ ] **Step 3: Check documentation for obsolete primary-host instructions**

Run:

```powershell
Select-String -Path README.md,docs/cloudflare-pages-deployment-runbook.md -Pattern 'admin.arishub.site','api.arishub.site','npm run build','dist','exact','CORS_ORIGINS','rollback'
Select-String -Path README.md -Pattern 'Point admin.arishub.site to the VPS'
git diff --check
```

Expected: required terms are present; the obsolete VPS-primary instruction is absent; no whitespace errors appear.

- [ ] **Step 4: Commit documentation**

Run:

```powershell
git add README.md docs/cloudflare-pages-deployment-runbook.md
git commit -m "docs: add admin dashboard deployment runbook"
```

---

## Task 5: Perform the pre-push release audit

**Files:**

- Verify only; no expected source changes.

- [ ] **Step 1: Run all local release gates from a locked install**

Run:

```powershell
npm ci
npm run typecheck
npm run lint
$env:VITE_API_BASE_URL = 'https://api.arishub.site'
npm run build
Remove-Item Env:VITE_API_BASE_URL
```

Expected: all commands exit 0. The known lint warnings may remain, but there are no errors.

- [ ] **Step 2: Verify Pages and Docker outputs**

Run:

```powershell
Test-Path dist/index.html
Test-Path dist/_redirects
Test-Path dist/_headers
docker build --build-arg VITE_API_BASE_URL=https://api.arishub.site -t arishub-admin:release-candidate .
```

Expected: the three files exist and Docker builds successfully. If Docker is unavailable locally, record it as an explicit unverified rollback check; do not claim it passed.

- [ ] **Step 3: Audit the commit set and excluded files**

Run:

```powershell
git status --short
git log --oneline --decorate --max-count=10
git ls-files | Select-String -Pattern '(^|/)(\.env($|\.)|node_modules/|dist/)|\.pem$|\.key$|id_ed25519|\.tsbuildinfo$'
git grep -n -I -E '(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|CLOUDFLARE_API_TOKEN|ADMIN_SEED_PASSWORD|WINSMS_API_KEY=.+|RESEND_API_KEY=.+)'
```

Expected: worktree is clean; forbidden-file scan prints nothing; secret-pattern scan prints nothing. If it finds documentation variable names without values, inspect them manually and confirm no credential is present.

- [ ] **Step 4: Verify remote and branch without pushing**

Run:

```powershell
git branch --show-current
git remote get-url origin
ssh -T git@github.com
```

Expected: `main`, the intended SSH remote, and successful GitHub account authentication. GitHub's SSH command may return exit code 1 while still printing a successful-authentication message; judge the message, not only the code.

- [ ] **Step 5: Present the audit result and request push authorization**

Report the exact commit list, validation results, ignored-artifact result, and any remaining warning. Do not push until the operator explicitly authorizes this external write.

---

## Task 6: Push and connect Cloudflare Pages (operator checkpoint)

**Files:**

- External systems only: GitHub and Cloudflare dashboard.

- [ ] **Step 1: Push the reviewed `main` branch after explicit authorization**

Run:

```powershell
git push -u origin main
```

Expected: GitHub receives all commits and the validation workflow completes successfully.

- [ ] **Step 2: Operator creates the Pages project**

In Cloudflare Dashboard:

1. Open **Workers & Pages** and create a Pages project by importing the private GitHub repository `SaifEddine-BenTurkia/ArisHub_Admin_Dashboard`.
2. Select production branch `main`.
3. Set build command to `npm run build`.
4. Set build output directory to `dist`.
5. Add `VITE_API_BASE_URL` with value `https://api.arishub.site` to both Production and Preview environments.
6. Save and deploy, then confirm the generated `pages.dev` URL loads the dashboard login.

- [ ] **Step 3: Operator attaches the production hostname**

In the Pages project, open **Custom domains**, add `admin.arishub.site`, accept the managed DNS record, and wait until the hostname and certificate show Active.

- [ ] **Step 4: Operator creates the exact-email Access application**

In Cloudflare Zero Trust:

1. Open **Access → Applications → Add an application → Self-hosted**.
2. Use domain `admin.arishub.site` and path `/*`.
3. Create an `Allow` policy whose Include rule is exactly the administrator email address.
4. Review all policies and remove any `Everyone`, broad email-domain, or unrestricted valid-email Allow rule.
5. Choose a finite session duration and save.

- [ ] **Step 5: Operator updates backend CORS on the VPS**

Add `https://admin.arishub.site` to the protected production `CORS_ORIGINS` value without removing other approved origins. Restart the backend container/service using the existing backend deployment runbook, then verify:

```bash
curl --fail --show-error https://api.arishub.site/health
```

If the backend uses a different documented health endpoint, substitute that exact endpoint.

---

## Task 7: Execute live acceptance and record launch status

**Files:**

- Modify: `docs/cloudflare-pages-deployment-runbook.md` only if the live environment reveals a necessary correction.

- [ ] **Step 1: Verify public transport and Access enforcement**

Run:

```powershell
Resolve-DnsName admin.arishub.site
curl.exe -I https://admin.arishub.site
```

Expected: DNS resolves through Cloudflare, HTTPS is valid, and an unauthenticated request is redirected to or challenged by Cloudflare Access rather than serving the dashboard directly.

- [ ] **Step 2: Test Access with two identities**

In a private browser session, verify an unapproved email is denied. Then use the exact allowlisted administrator email and verify it reaches the NestJS administrator login page. Never share the one-time code or password in chat.

- [ ] **Step 3: Test administrator authentication and core operations**

Using valid backend administrator credentials, verify:

- login and `/admin/me` session restoration;
- dashboard overview;
- provider list, detail, approve/reject workflow;
- recharge list and review workflow;
- client list/detail and job history;
- job list/detail, candidate, and assignment visibility;
- logout and rejection of the cleared session.

Expected: each action reaches `https://api.arishub.site` and backend authorization remains enforced.

- [ ] **Step 4: Test SPA deep links and browser security**

Open `/providers`, `/clients`, `/jobs`, and one available detail URL directly in a new tab, then reload each page.

Expected: no Pages 404, no mixed-content warning, and no CORS failure in browser developer tools.

- [ ] **Step 5: Verify rollback readiness**

Confirm Cloudflare Pages lists the current deployment and at least the deployment identifier needed for rollback. Confirm the documented Docker image build result from Task 5. Do not actually roll back or repoint DNS during acceptance.

- [ ] **Step 6: Record the final result**

Report:

- GitHub commit deployed;
- Pages deployment URL and status;
- custom hostname status;
- Access deny/allow results without identifying the private email;
- backend login and core-operation results;
- deep-link and CORS results;
- Docker rollback verification status;
- any known warnings or deferred work.

Only call the dashboard live after every security and functional acceptance item above passes.
