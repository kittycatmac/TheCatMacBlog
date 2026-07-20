---
title: 'Docker Deployment Guide — Multi-Tenant PWA (Vite + TypeScript + Express)'
description: 'A complete walkthrough of containerizing and deploying a multitenant path-based PWA, including troubleshooting issues encountered and best practices for next time.'
pubDate: 'July 19 2026'
heroImage: '/Build_the_web_you_want.png'
---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Pre-Docker Cleanup](#2-pre-docker-cleanup)
3. [Docker File Structure](#3-docker-file-structure)
4. [Troubleshooting Issues Encountered](#4-troubleshooting-issues-encountered)
5. [Database Setup with Supabase](#5-database-setup-with-supabase)
6. [Deploying to Fly.io](#6-deploying-to-flyio)
7. [Custom Domain & SSL](#7-custom-domain--ssl)
8. [Hosting Options Comparison](#8-hosting-options-comparison)
9. [Development Workflow](#9-development-workflow)
10. [Best Practices for Next Time](#10-best-practices-for-next-time)

---

## 1. Project Overview

**Stack:**
- Frontend: Vite + React + TypeScript (PWA)
- Backend: Express + Node.js
- Database: PostgreSQL via Drizzle ORM
- Auth: Session-based + Azure SSO + reCAPTCHA
- Tenancy: Path-based (`app.com/tenantSlug/`)

**Container Architecture:**
```
Browser
   ↓
nginx (port 80) — serves static assets, proxies /api/ and /uploads/
   ↓
Node/Express (port 3000, internal only)
   ↓
Supabase PostgreSQL
```

---

## 2. Pre-Docker Cleanup

Before building Docker containers, audit and remove all platform-specific dependencies.

### Replit-Specific Items to Remove

Run this audit in Claude Code first:
```
Search the entire codebase for: replit, REPLIT, repl.co,
replit.dev, PRIVATE_OBJECT_DIR, objectStorage, objectAcl.
List every reference with file and line number.
```

**What we found and fixed:**

| File | Issue | Fix |
|---|---|---|
| `server/objectStorage.ts` | Replit object storage SDK | Deleted entirely |
| `server/objectAcl.ts` | Replit ACL helpers | Deleted entirely |
| `server/routes.ts` | Video upload to Replit storage | Replaced with URL-only |
| `.env` | `AZURE_REDIRECT_URI` pointing at `*.repl.co` | Updated to `localhost:3000` |
| `package.json` | `@replit/vite-plugin-*` dev plugins | Removed |
| `vite.config.ts` | Replit plugin imports | Removed |
| `server/index.ts` | Replit-specific comments | Left as-is (harmless) |
| `replit.md` | Replit deployment docs | Replaced with this file |

### Switch Video Uploads to URL-Only

If your app uploads videos to object storage, switch to URL-only for Docker simplicity:

```ts
// Before — Replit object storage
app.post("/api/admin/training-videos", async (req, res) => {
  const privateDir = process.env.PRIVATE_OBJECT_DIR;
  // ... complex upload logic
});

// After — just save the URL
app.post("/api/admin/training-videos", requireAdmin, async (req, res) => {
  const { title, description, url, tenantId } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ message: "Valid video URL required" });
  }
  const video = await db.trainingVideo.create({ data: { title, description, url, tenantId } });
  return res.json({ videoUrl: url, video });
});
```

### Clean reCAPTCHA Defaults

```ts
// Remove Replit domains from default
const allowedHostnames = (
  process.env.RECAPTCHA_ALLOWED_HOSTNAMES || 'localhost,yourdomain.com'
).split(',').map(h => h.trim().toLowerCase());
```

### Environment Files

```
.env              → local development
.env.production   → Docker / production
```

Ensure `.gitignore` covers both:
```
.env*
```

---

## 3. Docker File Structure

### Dockerfile (Multi-Stage)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
# Output: dist/public/ (Vite) and dist/index.js (esbuild)

# Stage 2: nginx static + reverse proxy
FROM nginx:alpine AS web
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist/public /usr/share/nginx/html
EXPOSE 80

# Stage 3: Node API server (MUST be last for Fly.io)
FROM node:20-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/index.js ./dist/index.js
COPY --from=builder /app/dist/public ./dist/public
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

> **Important:** The server stage must be LAST in the Dockerfile.
> Fly.io uses the final stage by default regardless of `target` in `fly.toml`.

### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Service worker — never cache
    location = /sw.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
        add_header Pragma "no-cache";
        expires off;
    }

    # Vite content-hashed assets — cache forever
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Proxy API and uploads to Node server
    location ~ ^/(api|uploads)/ {
        proxy_pass         http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        client_max_body_size 10m;
    }

    # SPA fallback — path-based tenant routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### docker-compose.yml

```yaml
services:
  app:
    build:
      context: .
      target: server
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
      PORT: "3000"
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  nginx:
    build:
      context: .
      target: web
    ports:
      - "80:80"
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped

volumes:
  uploads:
```

### .dockerignore

```
node_modules
dist
.git
.env
.env.local
.env.development
*.log
.DS_Store
coverage
.vite
uploads
```

### vite.config.ts — Key Settings

```ts
export default defineConfig({
  base: '/',  // Critical for path-based tenant routing
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  }
});
```

---

## 4. Troubleshooting Issues Encountered

### Issue 1 — Windows BIOS Virtualization Disabled

**Error:** Docker Desktop won't start — "Hardware assisted virtualization must be enabled"

**Diagnosis:**
```powershell
systeminfo | findstr "Virtualization"
# Virtualization Enabled In Firmware: No
```

**Fix:** Enter BIOS and enable virtualization.

For HP EliteDesk:
- Restart → spam F10 on HP logo screen
- Navigate: Security → System Security → Virtualization Technology (VTx) → Enable
- Save with F10

To enter BIOS without timing the keypress:
```
Start → Settings → Update & Security → Recovery
→ Advanced Startup → Restart Now
→ Troubleshoot → Advanced Options → UEFI Firmware Settings → Restart
```

**Verify fixed:**
```powershell
systeminfo | findstr "Virtualization"
# Virtualization Enabled In Firmware: Yes
```

---

### Issue 2 — nginx "host not found in upstream app"

**Error:**
```
nginx: [emerg] host not found in upstream "app" in /etc/nginx/conf.d/app.conf
```

**Cause:** Running nginx container alone without the Node `app` container.
nginx's `proxy_pass http://app:3000` requires Docker Compose networking to resolve
the `app` hostname.

**Fix:** Always use `docker compose up` not `docker run` for the nginx container.

---

### Issue 3 — Vite Bundled into Production Build

**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite'
imported from /app/dist/index.js
```

**Cause:** esbuild uses `--packages=external` which keeps all imports as-is.
The static `import { createServer } from "vite"` at the top of `server/vite.ts`
gets included in the bundle even though it's inside a dev-only guard.

**Fix:** Convert static imports to dynamic imports inside `setupVite`:

```ts
// server/vite.ts — BEFORE (causes issue)
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";

// server/vite.ts — AFTER (fixed)
export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  // viteConfig — remove entirely, use configFile: false and pass options inline
  const viteLogger = createLogger();
  // ... rest of function
}
```

Also remove the `vite.config.ts` dynamic import — let Vite find its own config:
```ts
const vite = await createViteServer({
  configFile: false,
  server: { middlewareMode: true, hmr: { server }, allowedHosts: ["all"] },
  appType: "custom",
});
```

---

### Issue 4 — Healthcheck Failing (400 Missing X-Tenant-Slug)

**Error:**
```
GET /api/health 400 :: {"error":"Missing X-Tenant-Slug header"}
```

**Cause:** Tenant middleware was catching the `/api/health` route despite being
registered after it — a global `app.use()` or middleware order issue.

**Fix:** Add `/health` to the tenant middleware bypass list:

```ts
// server/middleware/tenantMiddleware.ts
const isPlatformRoute = (path: string) =>
  path.startsWith('/api/health') ||  // ← add this
  path.startsWith('/api/auth') ||
  // ... other bypasses
```

---

### Issue 5 — Wrong Docker Stage Deployed to Fly.io

**Error:** Fly.io deployed the nginx stage instead of the Node server stage,
causing the same "host not found in upstream app" error in production.

**Cause:** Fly.io uses the **last stage** in the Dockerfile by default,
regardless of `target` in `fly.toml`. The nginx `web` stage was last.

**Fix:** Reorder Dockerfile stages so `server` is always last:
```
Stage 1: builder  (builds everything)
Stage 2: web      (nginx — for local Docker Compose)
Stage 3: server   (Node — last, used by Fly.io)
```

---

### Issue 6 — DATABASE_URL Using localhost (Docker Networking)

**Error:** App can't connect to local PostgreSQL from inside Docker container.

**Cause:** `localhost` inside a Docker container refers to the container itself,
not your host machine.

**Fix:** Use `host.docker.internal` for local development:
```bash
# .env — for local Docker
DATABASE_URL=postgresql://postgres:pass@host.docker.internal:5432/dbname
```

---

### Issue 7 — Supabase IPv6 Connection Issue (Local Development)

**Error:**
```
Error: getaddrinfo ENOTFOUND db.xxxx.supabase.co
```

**Cause:** Supabase direct connections use IPv6 by default. Windows machines
on IPv4-only networks can't resolve the hostname.

**Fix:** Use the Transaction Pooler URL instead of direct connection for local dev:
```
Supabase Dashboard → Connect → Transaction pooler → URI
```

Pooler URL format:
```
postgresql://postgres.projectref:password@aws-0-region.pooler.supabase.com:6543/postgres
```

> Use direct connection URL for Fly.io (supports IPv6). Use pooler URL locally.

---

### Issue 8 — Drizzle db:push Fails on Supabase

**Error:**
```
error: column "id" is in a primary key (code: 42P16)
```

**Cause:** Drizzle Kit bug — fails when introspecting Supabase's internal schemas
that have primary key constraints it can't modify.

**Fix:** Skip `db:push` entirely. Generate raw SQL from your schema and run it
directly in Supabase SQL Editor:

```
Claude Code prompt:
"Read shared/schema.ts and generate a complete SQL script
with CREATE TABLE IF NOT EXISTS for all tables."
```

Then in Supabase SQL Editor:
```sql
-- Reset schema first if needed
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then paste and run your generated schema SQL
```

Adding `schemaFilter: ["public"]` to `drizzle.config.ts` helps but doesn't
fully resolve the issue with Supabase.

---

### Issue 9 — Stale Service Worker from Dev Environment

**Symptom:** Blank page, console shows requests going to `localhost:3000`
even though app is served on port 80.

**Cause:** Browser had a cached service worker from Replit dev session
registered with `localhost:3000` scope. It was intercepting all requests.

**Fix:**
```
Chrome DevTools → Application → Service Workers → Unregister
Application → Storage → Clear site data
Ctrl+Shift+R (hard refresh)
```

**Prevention:** nginx serves `sw.js` with no-cache headers:
```nginx
location = /sw.js {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

---

### Issue 10 — Fly.io Trial Ended Mid-Deployment

**Error:**
```
Error: trial has ended, please add a credit card
```

**Fix:** Add billing at `fly.io/dashboard → Billing`. Free allowance includes:
- 3 shared VMs
- 160GB outbound transfer
- 3GB persistent storage

Low traffic apps typically stay within free limits ($0/month).

---

### Issue 11 — SSL Certificate Not Verifying (Missing AAAA Record)

**Error:**
```
fly certs check myprintgig.com
! No AAAA records were found for your domain
```

**Cause:** Fly.io requires an AAAA (IPv6) DNS record to verify domain ownership
for SSL certificate issuance, even if the A record is correctly set.

**Fix:** Run `fly certs setup myprintgig.com` to get the exact records needed,
then add the AAAA record at your domain registrar alongside the A record.

---

## 5. Database Setup with Supabase

### Create Project
```
supabase.com → New Project
→ Set database password (save it!)
→ Choose region closest to your hosting
```

### Get Connection Strings

**For Fly.io (IPv6 direct):**
```
Connect → Direct connection → URI
postgresql://postgres:pass@db.xxxx.supabase.co:5432/postgres
```

**For local development (IPv4 pooler):**
```
Connect → Transaction pooler → URI
postgresql://postgres.ref:pass@aws-0-region.pooler.supabase.com:6543/postgres
```

### Push Schema

Since Drizzle `db:push` has issues with Supabase, generate SQL:
```
Claude Code: "Generate CREATE TABLE IF NOT EXISTS SQL for all 
tables in shared/schema.ts"
```

Run in Supabase SQL Editor → click "Run Without RLS"
(your app uses its own auth middleware, not Supabase RLS)

### Create Super Admin

Run locally with pooler DATABASE_URL:
```powershell
npx tsx server/scripts/createSuperAdmin.ts email@example.com "Password!" ID "Full Name"
```

Or via Fly.io SSH if script is compiled:
```powershell
fly ssh console
# then run compiled version inside container
```

---

## 6. Deploying to Fly.io

### Install CLI
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
# Restart PowerShell after install
fly version
```

### Login and Launch
```powershell
fly auth login
cd your-project-folder
fly launch --no-db --region dfw --name your-app-name --no-deploy
```

### fly.toml Configuration
```toml
app = 'your-app-name'
primary_region = 'dfw'

[build]
  dockerfile = "Dockerfile"
  target = "server"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'off'    # prevent cold starts
  auto_start_machines = true
  min_machines_running = 1
  processes = ['app']

[mounts]
  source = "uploads"
  destination = "/app/uploads"

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

### Set Secrets
```powershell
fly secrets set DATABASE_URL="your-supabase-direct-url"
fly secrets set SESSION_SECRET="your-session-secret"
fly secrets set RECAPTCHA_SECRET_KEY="your-key"
fly secrets set RECAPTCHA_SITE_KEY="your-key"
fly secrets set NODE_ENV="production"
fly secrets set PORT="3000"
fly secrets set RECAPTCHA_ALLOWED_HOSTNAMES="localhost,yourdomain.com,your-app.fly.dev"
fly secrets set AZURE_REDIRECT_URI="https://yourdomain.com/api/auth/azure/callback"
```

### Deploy
```powershell
fly deploy
```

### Useful Fly Commands
```powershell
fly status              # check machine state
fly logs                # live log stream
fly ssh console         # shell into running container
fly secrets list        # see all secret names
fly certs list          # check SSL cert status
fly certs check domain  # verify domain ownership
fly certs setup domain  # get DNS records needed
```

---

## 7. Custom Domain & SSL

### Add Domain to Fly
```powershell
fly certs add yourdomain.com
fly certs add www.yourdomain.com
fly certs setup yourdomain.com  # get DNS records
```

### DNS Records Required
```
A     @    66.241.x.x        (Fly IPv4)
AAAA  @    [fly ipv6 addr]   (required for cert verification)
CNAME www  your-app.fly.dev
```

### Verify
```powershell
fly certs check yourdomain.com
# Status = Verified ✓
```

SSL auto-renews — no manual intervention needed after initial setup.

---

## 8. Hosting Options Comparison

| Platform | Docker | Free Tier | Cold Starts | PostgreSQL | Best For |
|---|---|---|---|---|---|
| **Fly.io** | ✅ Native | $5 credit | No (if min=1) | Paid add-on | Production Docker apps |
| **Railway** | ✅ Native | $5 credit | No | ✅ Free | Quick deploys |
| **Render** | ✅ Native | Free (limited) | Yes (15min) | 90-day expiry | Prototypes |
| **Netlify** | ❌ | Free | N/A | ❌ | Frontend only |
| **Vercel** | ❌ | Free | N/A | ❌ | Frontend/Next.js |
| **Supabase** | N/A | ✅ 500MB | N/A | ✅ Best free | Database only |

### Recommended Stack (Free)
```
Database    → Supabase (500MB free, no expiry, no credit card)
App hosting → Fly.io (best Docker support, free allowance)
File storage→ Fly.io volume (persistent, included)
Domain SSL  → Fly.io (auto-managed Let's Encrypt)
```

### Running Multiple Platforms Simultaneously
You can deploy to multiple platforms pointing at the same Supabase database:
```powershell
fly deploy      # → your-app.fly.dev (production)
railway up      # → your-app.railway.app (staging/backup)
```

---

## 9. Development Workflow

### Local Development
```powershell
npm run dev                 # Vite + Express dev server
```

### Local Docker Testing
```powershell
docker compose up --build   # build and start all containers
docker compose down         # stop all containers
docker compose up           # start without rebuilding (env var changes only)
```

### Deploy to Production
```powershell
git add .
git commit -m "your change"
git push origin main        # GitLab (work)
git push github main        # GitHub (personal backup)
fly deploy                  # deploy to Fly.io
```

### One-Command Deploy
```powershell
git add . && git commit -m "update" && git push origin main && git push github main && fly deploy
```

### Environment Variables

| Variable | Local (.env) | Docker (.env.production) | Fly.io (secrets) |
|---|---|---|---|
| DATABASE_URL | pooler URL | host.docker.internal | direct connection URL |
| NODE_ENV | development | production | production |
| PORT | 3000 | 3000 | 3000 |
| SESSION_SECRET | any string | strong secret | strong secret |
| RECAPTCHA_* | dev keys | prod keys | prod keys |
| AZURE_REDIRECT_URI | localhost:3000 | your domain | your domain |

---

## 10. Best Practices for Next Time

### Before Starting Containerization

- [ ] Audit all platform-specific dependencies first (`grep -r "replit\|heroku\|vercel"`)
- [ ] List every env var used across the codebase
- [ ] Check for hardcoded URLs or origins
- [ ] Confirm build output directory matches Dockerfile COPY paths
- [ ] Add `/api/health` endpoint early — required for Docker healthchecks
- [ ] Make sure health endpoint bypasses all auth/tenant middleware

### Dockerfile Best Practices

- Always use multi-stage builds — keeps production image small
- Put the deployment target stage LAST (Fly.io uses last stage by default)
- Use `node:20-alpine` not full node image (smaller, faster)
- Use `npm ci` not `npm install` for reproducible builds
- Use `npm ci --omit=dev` in production stage
- Never COPY `.env` files into the image
- Create volume mount points with `RUN mkdir -p`

### esbuild / Bundling

- If using `--packages=external`, all imports stay as runtime dependencies
- Dynamic imports (`await import()`) are excluded from bundle analysis
- Always check `dist/index.js` for unwanted imports after build:
  ```bash
  grep -n "from \"vite\"" dist/index.js
  ```

### Service Worker (PWA)

- Always serve `sw.js` with `Cache-Control: no-store` in nginx
- Stale SWs from dev can break production — clear browser storage when switching environments
- SW scope should always be `/` with no hardcoded host

### Database

- Use Supabase for free PostgreSQL (no expiry, no credit card required)
- Direct connection = IPv6 (use for Fly.io)
- Transaction pooler = IPv4 (use for local Windows development)
- Skip `drizzle-kit push` on Supabase — generate raw SQL instead
- Always run schema SQL before deploying app
- Keep a seed script for creating initial superadmin users

### Security

- Never commit `.env` or `.env.production` — use `.env*` in `.gitignore`
- Set secrets via platform CLI (`fly secrets set`) never via code
- Add production domain to reCAPTCHA console before go-live
- Update AZURE_REDIRECT_URI for each environment
- Use strong randomly generated SESSION_SECRET in production

### DNS & SSL

- Fly.io requires BOTH A (IPv4) and AAAA (IPv6) records for cert verification
- SSL cert verification can take 15-30 minutes after DNS propagates
- Use `fly certs check domain` to monitor status
- Consider Cloudflare for DNS management (instant propagation, free CDN)

---

*Generated from a real containerization session — Vite + TypeScript + Express multitenant PWA migrated from Replit to Docker + Fly.io + Supabase.*