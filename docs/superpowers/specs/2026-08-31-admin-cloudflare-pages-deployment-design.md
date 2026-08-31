# Admin Dashboard Cloudflare Deployment Design

Date: 31 August 2026

Status: Approved in conversation

## Objective

Publish the existing ArisHub React/Vite administrator dashboard at `https://admin.arishub.site`, keep the NestJS API on `https://api.arishub.site`, and restrict access to explicitly allowlisted administrator email addresses through Cloudflare Access.

## Repository boundary

The dashboard becomes a standalone private Git repository named `ArisHub_Admin_Dashboard`. It must not inherit or modify the parent legacy repository. Source code, deployment configuration, tests, and runbooks live in this repository. Build output, local environment files, dependencies, credentials, and signing material are ignored.

## Hosting

Cloudflare Pages builds the Vite application from the private GitHub repository.

- Build command: `npm run build`
- Build output directory: `dist`
- Production variable: `VITE_API_BASE_URL=https://api.arishub.site`
- Custom hostname: `admin.arishub.site`
- SPA navigation falls back to `index.html`.
- Every push to the production branch triggers a deployment; pull requests may use preview deployments.

The existing Docker image remains available as a local or VPS rollback option, but it is not the primary hosting path.

## Access control

Cloudflare Zero Trust Access protects the entire `admin.arishub.site` hostname before traffic reaches the dashboard. The Allow policy lists exact administrator email addresses. It must not use an Everyone rule, an unrestricted one-time-PIN rule, or a whole-domain rule unless the organization deliberately adopts managed corporate accounts later.

Cloudflare Access is an outer gate only. The dashboard still requires NestJS administrator login, and the backend remains authoritative for every admin permission.

## API and CORS

The browser sends API requests only to `https://api.arishub.site`. The VPS backend production environment includes `https://admin.arishub.site` in `CORS_ORIGINS`, together with any other approved browser origins. No backend secret is exposed through a `VITE_*` variable.

## CI and validation

GitHub CI runs install, type checking, linting, and production build. Cloudflare Pages performs the deployment build from the locked dependency graph. Release validation covers:

- direct dashboard hostname requires Cloudflare Access authentication;
- an unapproved email is denied;
- an approved email reaches the dashboard login screen;
- valid backend administrator credentials create a session;
- provider review, recharge review, client/job search, and logout call the production API successfully;
- deep links reload without a Pages 404;
- browser developer tools show no CORS or mixed-content failures;
- `/healthz` remains available only for the Docker rollback image, while Pages deployment health is checked through its root and static assets.

## Secret handling

GitHub, Cloudflare, administrator, VPS, and backend secrets are never committed or pasted into chat. Cloudflare Pages stores only the public API base URL. Administrator seed credentials and backend secrets remain on the VPS or in their appropriate protected secret stores.

## Deployment responsibilities

The implementation prepares the standalone repository, safe ignore rules, CI workflow, Pages-compatible SPA routing, production build validation, and runbook. The operator connects GitHub to Cloudflare Pages, attaches the custom hostname, configures the exact-email Access policy, updates protected VPS CORS configuration, and authorizes any external push/deployment action.

## Rollback

Cloudflare Pages can roll back to a previous successful deployment. If Pages is unavailable, the existing multi-stage Docker image can serve the same compiled dashboard through Nginx after DNS is deliberately repointed. Backend deployment is independent and is not rolled back merely because the dashboard deployment fails.
