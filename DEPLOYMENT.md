# Deployment & Replication Runbook

This document describes how to run the CRM Ticket Sorter API locally and deploy it to a public HTTPS endpoint. Graders can follow this runbook if no live URL is provided.

## Architecture

```
Client  --HTTPS-->  Express API (Node.js)
                         |
                         +--> GET  /health
                         +--> POST /sort-ticket
                                    |
                                    v
                              OpenRouter API
                              (gpt-4o-mini)
```

## 1. Local replication

### 1.1 Clone and install

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd mock-task
pnpm install   # or: npm install
```

### 1.2 Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
PORT=5001
```

### 1.3 Start the server

```bash
node index.js
```

Expected console output:

```
App is listening on 5001
```

### 1.4 Smoke tests

**Health check (required for grading):**

```bash
curl -i http://localhost:5001/health
```

Expected:

```
HTTP/1.1 200 OK
...
OK
```

**Ticket classification:**

```bash
curl -s -X POST http://localhost:5001/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"test-1","message":"Someone emailed me asking for my password."}' | jq .
```

Expected: JSON with `case_type`, `severity`, `department`, `agent_summary`, `human_review_required`, `confidence`, and `ticket_id`.

---

## 2. Production deployment

The app runs as a standard Node.js HTTP server locally. For **Vercel**, it is deployed as a serverless function via `api/index.js` and `vercel.json`. Other platforms (Render, Railway, Fly.io, EC2, Poridhi Lab) run `node index.js` as a persistent process.

### Common requirements (all platforms)

| Item | Value |
|------|-------|
| Start command | `node index.js` |
| Node version | 18 or 20 |
| Required env var | `OPENROUTER_API_KEY` |
| Health check path | `/health` |
| Listen port | Platform-assigned `PORT` env var or `5001` (local / Render / Railway / Fly) |

---

### 2.1 Vercel

1. Push this repo to GitHub (public).
2. Install the [Vercel CLI](https://vercel.com/docs/cli) (optional) or use the [Vercel dashboard](https://vercel.com/new).
3. **Import** the GitHub repo as a new project.
4. **Environment variables** → add:
   - `OPENROUTER_API_KEY` = your key
5. Deploy with default settings (no custom build command needed).
6. Copy the production URL (e.g. `https://mock-task.vercel.app`).
7. Verify:

```bash
curl https://<your-project>.vercel.app/health
curl -s -X POST https://<your-project>.vercel.app/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"test-1","message":"Payment failed on my last invoice."}'
```

**CLI deploy (from project root):**

```bash
pnpm install
vercel link          # first time only
vercel env add OPENROUTER_API_KEY
vercel --prod
```

**How it works:** `vercel.json` rewrites all routes to `api/index.js`, which exports the Express app. Locally, run `node index.js` as usual.

---

### 2.2 Render

1. Push this repo to GitHub (public).
2. In [Render](https://render.com): **New → Web Service** → connect the repo.
3. Settings:
   - **Runtime:** Node
   - **Build command:** `pnpm install` (or `npm install`)
   - **Start command:** `node index.js`
   - **Health check path:** `/health`
4. **Environment → Add variable:**
   - `OPENROUTER_API_KEY` = your key
5. Deploy. Copy the service URL (e.g. `https://mock-task.onrender.com`).
6. Verify:

```bash
curl https://<your-service>.onrender.com/health
```

---

### 2.3 Railway

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Set start command: `node index.js`
3. **Variables** tab → add `OPENROUTER_API_KEY`
4. **Settings** → generate domain (HTTPS enabled by default)
5. Verify:

```bash
curl https://<your-app>.up.railway.app/health
```

---

### 2.4 Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/).
2. From the project root:

```bash
fly launch --no-deploy
```

3. Ensure `fly.toml` includes:

```toml
[http_service]
  internal_port = 5001
  force_https = true

[[http_service.checks]]
  path = "/health"
  interval = "15s"
  timeout = "2s"
```

4. Set secrets and deploy:

```bash
fly secrets set OPENROUTER_API_KEY=sk-or-v1-...
fly deploy
```

5. Verify:

```bash
curl https://<your-app>.fly.dev/health
```

---

### 2.5 AWS EC2 (minimal)

1. Launch an Ubuntu EC2 instance; open inbound TCP on your app port (or `80`/`443` behind a reverse proxy).
2. SSH in and install Node 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Clone, install, configure:

```bash
git clone https://github.com/imranBappy/ticket-sorting.git
cd mock-task
npm install
cp .env.example .env
# set OPENROUTER_API_KEY in .env
```

4. Run with a process manager (example: `pm2`):

```bash
sudo npm install -g pm2
pm2 start index.js --name ticket-sorter
pm2 save
pm2 startup
```

5. Put Nginx or Caddy in front for HTTPS, or use an Application Load Balancer with TLS.
6. Verify `https://<your-domain>/health` returns `OK`.

---

## 3. Post-deploy checklist

Use this before submitting the Google Form:

- [ ] Repository is **public** on GitHub
- [ ] `README.md` and this runbook are in the repo
- [ ] Live base URL uses **HTTPS**
- [ ] `GET <base-url>/health` returns `200` and body `OK`
- [ ] `POST <base-url>/sort-ticket` returns valid JSON for a sample ticket
- [ ] `OPENROUTER_API_KEY` is set only in platform secrets (not committed)

---

## 4. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `/health` connection refused | Server not running or wrong port | Confirm start command; check platform logs |
| `/health` timeout on Render free tier | Service spun down | Wait for cold start (~30s) and retry |
| `/sort-ticket` 500 or hang | Missing/invalid API key | Verify `OPENROUTER_API_KEY` in env |
| Platform health check fails | App listens on wrong port | Confirm `process.env.PORT \|\| 5001` in `index.js` (non-Vercel hosts) |
| Vercel `/sort-ticket` times out | LLM call exceeds function limit | Hobby plan: 10s max; Pro allows up to 60s (`maxDuration` in `vercel.json`) |
| Invalid JSON from LLM | Model returned non-JSON | Retry; check OpenRouter status/dashboard |

---

## 5. Rollback

- **Render / Railway / Fly:** Redeploy a previous successful commit from the platform dashboard.
- **EC2 / pm2:** `git checkout <previous-commit>` then `pm2 restart ticket-sorter`.
