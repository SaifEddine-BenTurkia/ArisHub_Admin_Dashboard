# ArisHub Admin Dashboard

Separate internal web application for launch operations. It does not import or modify the Flutter application.

## Included launch features

- Secure admin login using the NestJS `/admin/login` API
- Operational overview and financial indicators
- Provider search, KYC document review, approve/reject actions, and verification mismatch warning
- Recharge request review with duplicate-review protection supplied by the backend
- Manual provider wallet credit with a mandatory description
- Client search and recent job history
- Job search, lifecycle details, candidates, and assignment visibility
- Responsive desktop/mobile interface

## Local development

Requirements: Node.js 20.19+ and the ArisHub backend running locally.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:4173`. The default local API is `http://localhost:3000`.

The backend allows browser origins in development. For production, add the exact dashboard origin to its `CORS_ORIGINS` value:

```dotenv
CORS_ORIGINS=https://admin.arishub.site
```

If other browser applications also use the API, provide a comma-separated list.

## Production build

```powershell
$env:VITE_API_BASE_URL = "https://api.arishub.site"
npm run build
```

The generated static application is in `dist/`.

## Docker build

```powershell
docker build --build-arg VITE_API_BASE_URL=https://api.arishub.site -t arishub-admin .
docker run --rm -p 8080:80 arishub-admin
```

The container includes SPA routing, security headers, caching, and `/healthz`.

## Cloudflare Pages deployment

The primary production host is `https://admin.arishub.site`. Cloudflare Pages builds the private GitHub repository with `npm run build`, publishes `dist`, and injects the public variable `VITE_API_BASE_URL=https://api.arishub.site`.

Cloudflare Access must protect the whole hostname with an exact-email Allow policy. Access does not replace the dashboard's NestJS administrator login. See [the deployment runbook](docs/cloudflare-pages-deployment-runbook.md) for first deployment, verification, and rollback.

The backend must include `https://admin.arishub.site` in `CORS_ORIGINS`, use a unique `ADMIN_JWT_SECRET`, and retain a strong administrator password. Never place backend secrets in a `VITE_*` variable because browser variables are public.

The JWT is stored in `sessionStorage`, so closing the browser tab removes the local session. The API remains responsible for authorization on every request.
