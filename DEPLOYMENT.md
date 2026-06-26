# Deployment & Replication Runbook

QueueStorm Investigator API — evidence-based fintech investigation engine.

## Architecture

```
Client  --HTTPS-->  Express API (Node.js)
                         |
                         +--> GET  /health
                         +--> POST /analyze-ticket
                                    |
                                    v
                              Deterministic Pipeline
                              (parser → matcher → evidence → rules)
                                    |
                                    v (optional, max 1 call)
                              OpenRouter API (gpt-4o-mini)
```

## 1. Local replication

### 1.1 Clone and install

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd mock-task
pnpm install
```

### 1.2 Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
PORT=5001
LLM_TIMEOUT_MS=10000
```

### 1.3 Start the server

```bash
pnpm start
```

Expected output:

```
QueueStorm Investigator API listening
```

### 1.4 Smoke tests

**Health check:**

```bash
curl -i http://localhost:5001/health
```

Expected: `HTTP/1.1 200 OK` with body `OK`

**Investigation:**

```bash
curl -s -X POST http://localhost:5001/analyze-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "complaint": "I sent 5000 taka to wrong number 01712345678",
    "transaction_history": [{
      "id": "txn_abc123",
      "amount": 5000,
      "currency": "BDT",
      "type": "transfer",
      "counterparty": "01712345678",
      "merchant": null,
      "timestamp": "2026-06-26T14:05:00Z",
      "status": "completed"
    }]
  }' | jq .
```

Expected: JSON with `evidence_verdict`, `case_type`, `department`, `human_review_required`, `confidence`, `reason_codes`.

**Run tests:**

```bash
pnpm test
```

---

## 2. Production deployment

### Common requirements

| Item | Value |
|------|-------|
| Start command | `node index.js` |
| Node version | 18 or 20 |
| Required env var | `OPENROUTER_API_KEY` (for LLM paths) |
| Health check path | `/health` |
| Listen port | `PORT` env var or `5001` |

### 2.1 Vercel (recommended)

1. Push repo to GitHub.
2. Import project in [Vercel dashboard](https://vercel.com/new).
3. Add environment variable: `OPENROUTER_API_KEY`
4. Deploy with default settings.
5. Verify:

```bash
curl https://<your-project>.vercel.app/health
curl -s -X POST https://<your-project>.vercel.app/analyze-ticket \
  -H "Content-Type: application/json" \
  -d '{"complaint":"Payment failed","transaction_history":[]}'
```

**CLI deploy:**

```bash
pnpm install
vercel link
vercel env add OPENROUTER_API_KEY
vercel --prod
```

`vercel.json` sets `maxDuration: 30` for the serverless function.

### 2.2 Render / Railway / Fly.io

Use start command `node index.js`, set `OPENROUTER_API_KEY`, health check `/health`.

---

## 3. Post-deploy checklist

- [ ] Repository is public on GitHub
- [ ] `README.md` and this runbook are in the repo
- [ ] Live base URL uses HTTPS
- [ ] `GET <base-url>/health` returns `200` and body `OK`
- [ ] `POST <base-url>/analyze-ticket` returns valid JSON
- [ ] `OPENROUTER_API_KEY` is set only in platform secrets
- [ ] `pnpm test` passes locally

---

## 4. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `/health` connection refused | Server not running | Check start command and logs |
| `/analyze-ticket` 400 | Invalid request body | Check Zod validation errors in response |
| `/analyze-ticket` 403 | Input safety block | Remove injection-like phrases from complaint |
| LLM always skipped | Clear English complaint | Expected for deterministic path |
| LLM fallback response | Timeout or API error | Check `OPENROUTER_API_KEY` and OpenRouter status |
| Vercel timeout | Cold start + LLM | Deterministic cases are fast; LLM has 10s timeout |

---

## 5. Rollback

Redeploy a previous successful commit from your platform dashboard or `git checkout <commit> && vercel --prod`.
