# Cloudflare Pages Deployment Runbook

This runbook publishes the private ArisHub administrator dashboard at `https://admin.arishub.site`. Cloudflare Access is the outer identity gate; the NestJS administrator login remains required and authoritative.

## Prerequisites

- The private GitHub repository is `SaifEddine-BenTurkia/ArisHub_Admin_Dashboard`.
- The production branch is `main`.
- The `arishub.site` zone is active in the operator's Cloudflare account.
- `https://api.arishub.site/health/ready` is healthy before functional acceptance.
- The exact administrator email and backend credentials are available to the operator but are not stored in Git or shared in chat.
- The backend production environment and restart procedure are available on the VPS.

## First push

From the repository root, verify the destination before publishing:

```powershell
git status --short
git branch --show-current
git remote get-url origin
ssh -T git@github.com
```

The branch must be `main`, and the remote must be:

```text
git@github.com:SaifEddine-BenTurkia/ArisHub_Admin_Dashboard.git
```

After the release audit and explicit operator approval:

```powershell
git push -u origin main
```

Do not force-push if GitHub rejects the update. Resolve the remote history deliberately, then confirm the GitHub Actions workflow is successful.

## Create the Pages project

1. In Cloudflare, open **Workers & Pages** and create a Pages project by importing an existing Git repository.
2. Authorize the Cloudflare Pages GitHub application for only `SaifEddine-BenTurkia/ArisHub_Admin_Dashboard` where possible.
3. Set the production branch to `main`.
4. Select the Vite framework preset.
5. Leave the root directory empty because the dashboard occupies the repository root.
6. Set the build command to `npm run build`.
7. Set the build output directory to `dist`.
8. Add `VITE_API_BASE_URL=https://api.arishub.site` to Production and Preview build environments.
9. Add `NODE_VERSION=22.16.0` to pin the Pages build runtime.
10. Select **Save and Deploy**, inspect the logs, and confirm the generated `pages.dev` URL renders the administrator login.

`VITE_API_BASE_URL` is public browser configuration. Never add API keys, JWT secrets, administrator credentials, VPS credentials, or signing material to a `VITE_*` variable.

## Attach the production hostname

Configure the custom domain before enabling Access on it so certificate validation is not blocked.

1. Open the Pages project and select **Custom domains**.
2. Select **Set up a custom domain**.
3. Enter `admin.arishub.site`.
4. Allow Pages to create the managed DNS record. Do not manually create a second conflicting record.
5. Wait until the hostname and HTTPS certificate show **Active**.

If the hostname remains in verification, check for an existing Access application, redirect, Worker route, or conflicting DNS record before changing DNS.

## Protect the custom hostname with Access

1. In Cloudflare Zero Trust, open **Access controls → Applications**.
2. Select **Create new application → Self-hosted and private**.
3. Add the public hostname `admin.arishub.site` and leave the path empty to protect the whole host. If the UI requires a path, use `/*`.
4. Create a policy named `Allow ArisHub administrator` with action **Allow**.
5. For **Include**, select **Emails** and enter only the operator's exact administrator email.
6. Select the intended identity provider, such as Google or One-time PIN, and choose a finite session duration.
7. Confirm there is no Allow rule using **Everyone**, a broad email domain, or **Login Methods → One-time PIN** as its unrestricted Include selector.
8. Save, then test an unapproved identity before testing the approved identity.

Cloudflare Access is not a replacement for `/admin/login` or backend authorization checks.

## Protect Pages and preview hostnames

The custom-domain Access application does not automatically protect the generated `pages.dev` production and preview URLs.

1. In the Pages project, open **Settings → General**.
2. Enable the preview deployment Access policy.
3. Review the Access applications created for preview deployments.
4. Follow the Pages Access configuration to protect the base project `pages.dev` hostname as well as wildcard preview deployments.
5. Verify that the custom hostname, base `pages.dev` hostname, and a preview hostname all require authentication.

Do not leave an alternate Pages hostname publicly reachable merely because `admin.arishub.site` is protected.

## Configure backend CORS

The browser calls only `https://api.arishub.site`. In the protected VPS production environment, add the dashboard origin to the comma-separated list without removing other approved origins:

```dotenv
CORS_ORIGINS=https://admin.arishub.site
```

Restart only the backend service using its production deployment procedure. Verify both application and database readiness:

```bash
curl --fail --show-error https://api.arishub.site/health/live
curl --fail --show-error https://api.arishub.site/health/ready
```

Verify the browser preflight from PowerShell:

```powershell
curl.exe -i -X OPTIONS "https://api.arishub.site/admin/login" -H "Origin: https://admin.arishub.site" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
```

The response must allow exactly `https://admin.arishub.site`; it must not use a wildcard origin with credentials.

## Acceptance checklist

- An unauthenticated request receives a Cloudflare Access challenge.
- An unapproved email is denied.
- The exact approved email reaches the NestJS administrator login.
- Valid administrator credentials establish the dashboard session.
- Invalid or inactive administrator credentials remain rejected.
- Overview metrics load from `https://api.arishub.site`.
- Provider search, detail, approval, and rejection work.
- Recharge search and review work without duplicate processing.
- Client and job search and detail pages work.
- Logout clears the browser session.
- Direct reloads of `/providers`, `/clients`, `/jobs`, and available detail pages do not produce a Pages 404.
- Browser developer tools show no CORS or mixed-content failures.
- The custom hostname, base `pages.dev` hostname, and preview deployments all require Access authentication.

## Normal releases

1. Commit a reviewed change on a feature branch or `main` according to the repository workflow.
2. Run `npm ci`, `npm run typecheck`, `npm run lint`, and a production `npm run build`.
3. Push or merge to `main`.
4. Wait for GitHub CI and the Cloudflare Pages production deployment to succeed.
5. Smoke-test Access, administrator login, one read operation, one authorized mutation when safe, and logout before announcing the release.

## Rollback

For an application regression, open the Pages project's **Deployments** view and roll production back to the preceding successful deployment. Record the failed and restored commit identifiers.

If Pages itself is unavailable, the existing multi-stage Docker image can serve the compiled dashboard through Nginx. Deploying that image and repointing DNS are deliberate production changes that require operator approval and a change window. Do not roll back the backend solely because the static dashboard deployment failed.

## Secret handling

- Never commit or paste Cloudflare tokens, GitHub tokens, administrator passwords, email one-time codes, backend secrets, or SSH private keys.
- Keep backend secrets in the protected VPS environment or an approved secret store.
- Treat all `VITE_*` variables as public.
- Keep administrator login active even when Cloudflare Access is healthy.
