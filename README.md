# CRM Ticket Sorter API

Express API that classifies CRM support tickets using an LLM. Given a ticket message, it returns structured routing metadata: case type, severity, department, agent summary, human-review flag, and confidence score.

## Live endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check — returns `OK` |
| `POST` | `/sort-ticket` | Classify a ticket and return routing metadata |

## Quick start (local)

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (or npm)
- OpenRouter API key ([create one](https://openrouter.ai/keys))

### Setup

```bash
git clone https://github.com/imranBappy/ticket-sorting.git
cd mock-task

pnpm install
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY
```

### Run

```bash
node index.js
```

The server listens on port `5001` by default.

### Verify health

```bash
curl http://localhost:5001/health
# Expected: OK
```

### Example request

```bash
curl -X POST http://localhost:5001/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "TKT-1001",
    "message": "I was charged twice for my subscription and need a refund."
  }'
```

Example response:

```json
{
  "ticket_id": "TKT-1001",
  "case_type": "refund_request",
  "severity": "medium",
  "department": "payments_ops",
  "agent_summary": "Customer reports duplicate subscription charge and requests refund.",
  "human_review_required": false,
  "confidence": 0.92
}
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | API key for OpenRouter |
| `PORT` | No | HTTP port (default: `5001`) |

## LLM usage

**Yes** — this service uses an LLM for ticket classification.

| Setting | Value |
|---------|-------|
| Provider | [OpenRouter](https://openrouter.ai/) |
| Model | `openai/gpt-4o-mini` |
| Temperature | `0` |
| Output format | JSON object (structured response) |

The `/sort-ticket` endpoint sends the ticket text to the model with a fixed system prompt that constrains `case_type`, `severity`, and `department` to predefined enums.

## Classification schema

**`case_type`:** `wrong_transfer` · `payment_failed` · `refund_request` · `phishing_or_social_engineering` · `other`

**`severity`:** `low` · `medium` · `high` · `critical`

**`department`:** `customer_support` · `dispute_resolution` · `payments_ops` · `fraud_risk`

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full replication runbook (local, Render, Railway, Fly.io, and generic platforms).

Minimum production requirements for grading:

- Public HTTPS base URL
- `GET /health` returns `200` with body `OK`
- `OPENROUTER_API_KEY` set in the deployment environment

## Project structure

```
mock-task/
├── index.js          # Express app and route handlers
├── package.json
├── .env.example      # Environment variable template
├── DEPLOYMENT.md     # Deployment and replication runbook
└── SUBMISSION.md     # Google Form submission checklist
```

## Known issues

- Port is hardcoded to `5001` in `index.js`; `PORT` from `.env` is not yet read by the listener.
- `package.json` `dev` script references `nodemon main` instead of `index.js`.
- No automated tests.
- `/sort-ticket` does not validate request body or handle LLM/API errors explicitly.

## License

ISC
