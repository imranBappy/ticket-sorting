# QueueStorm Investigator API

Evidence-based fintech investigation engine for the QueueStorm hackathon. This service analyzes customer complaints against transaction history using **deterministic reasoning first**, with at most **one optional LLM call** for ambiguous or multilingual cases.

This is **not** a chatbot or ticket classifier — it is an investigation pipeline that matches evidence, applies rules, and returns structured JSON verdicts.

## Live endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check — returns `OK` |
| `POST` | `/analyze-ticket` | Investigate a complaint against transaction history |

## Quick start (local)

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (or npm)
- OpenRouter API key ([create one](https://openrouter.ai/keys))

### Setup

```bash
git clone <YOUR_REPO_URL>
cd mock-task

pnpm install
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY
```

### Run

```bash
pnpm start
# or: pnpm dev
```

Server listens on port `5001` by default.

### Verify health

```bash
curl http://localhost:5001/health
# Expected: OK
```

### Example request

```bash
curl -X POST http://localhost:5001/analyze-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "complaint": "I sent 5000 taka to wrong number 01712345678 around 2pm",
    "transaction_history": [
      {
        "id": "txn_abc123",
        "amount": 5000,
        "currency": "BDT",
        "type": "transfer",
        "counterparty": "01712345678",
        "merchant": null,
        "timestamp": "2026-06-26T14:05:00Z",
        "status": "completed"
      }
    ]
  }'
```

### Example response

```json
{
  "relevant_transaction_id": "txn_abc123",
  "evidence_verdict": "consistent",
  "case_type": "wrong_transfer",
  "severity": "high",
  "department": "dispute_resolution",
  "agent_summary": "Case classified as wrong_transfer. Evidence verdict: consistent. Matched transaction txn_abc123.",
  "recommended_next_action": "Verify beneficiary details and initiate dispute review per wrong-transfer policy. Do not promise reversal.",
  "customer_reply": "We have received your report regarding a possible wrong transfer...",
  "human_review_required": true,
  "confidence": 0.85,
  "reason_codes": ["amount_match", "type_match", "counterparty_match", "deterministic_path"]
}
```

## Architecture

```
Incoming Request
       ↓
Request Validation (Zod)
       ↓
Input Safety Guard
       ↓
Complaint Parser (deterministic)
       ↓
Transaction Matcher (scoring)
       ↓
Evidence Engine
       ↓
Rule Engine
       ↓
Need LLM? ──No──→ Template Replies
       │
      Yes
       ↓
Single LLM Call (10s timeout)
       ↓
Output Safety Scrub
       ↓
Response Validation (Zod)
       ↓
JSON Response
```

## Folder structure

```
src/
  app.js                    # Express app factory
  server.js                 # Local dev entry
  routes/                   # Route definitions
  controllers/              # Thin HTTP handlers
  services/
    investigation/          # Parser, matcher, evidence, rules, orchestrator
    llm.service.js            # OpenRouter integration
  validators/               # Zod validation helpers
  schemas/                  # Request/response contracts
  middleware/               # Logging, safety, error handling
  config/                   # App configuration and enums
  prompts/                  # LLM system prompts
  utils/                    # Language detect, scoring, fallbacks
tests/
  unit/                     # Module unit tests
  integration/              # API integration tests
api/index.js                # Vercel serverless entry
```

## API documentation

### `POST /analyze-ticket`

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `complaint` | string | Yes | Customer complaint text |
| `transaction_history` | array | No | List of transactions (default `[]`) |

**Transaction object:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique transaction ID |
| `amount` | number | Positive amount |
| `currency` | string | Currency code (default `BDT`) |
| `type` | enum | `transfer`, `payment`, `refund`, `withdrawal`, `other` |
| `counterparty` | string \| null | Phone or account identifier |
| `merchant` | string \| null | Merchant name |
| `timestamp` | string | ISO or parseable datetime |
| `status` | enum | `completed`, `failed`, `pending`, `reversed`, `cancelled` |

**Response fields:** `relevant_transaction_id`, `evidence_verdict`, `case_type`, `severity`, `department`, `agent_summary`, `recommended_next_action`, `customer_reply`, `human_review_required`, `confidence`, `reason_codes`

**Error responses** are always JSON with `error` and `reason_codes`.

## Reasoning engine

### Complaint parser

Regex/heuristic extraction — no AI:

- Amount (`5000`, `5,000 taka`, `৳5000`)
- Transaction type keywords
- Bangladesh phone numbers
- Time references
- Intent classification
- Language detection (`en`, `bn`, `banglish`, `mixed`)

### Evidence matching algorithm

Weighted transaction scoring:

| Signal | Weight |
|--------|--------|
| Amount match (±1%) | 40 |
| Type match | 20 |
| Counterparty/phone match | 25 |
| Timestamp proximity (±2h) | 10 |
| Status considered | 5 |

Best match returned if score ≥ 50; otherwise `relevant_transaction_id` is `null`.

### Evidence verdicts

| Scenario | Verdict |
|----------|---------|
| Payment failed + completed txn | `inconsistent` |
| Wrong transfer + completed txn | `consistent` |
| No matching transaction | `insufficient_data` |
| Ambiguous intent | `insufficient_data` |

## Safety guardrails

**Input safety:** Blocks prompt injection, jailbreak attempts, SQL injection patterns. Returns `403`.

**Output safety:** Scrubs PIN, OTP, password, API key, refund confirmations, and stack traces from generated text. Forces `human_review_required` when triggered.

## Model choice

| Setting | Value |
|---------|-------|
| Provider | [OpenRouter](https://openrouter.ai/) |
| Model | `openai/gpt-4o-mini` |
| Temperature | `0` |
| Max calls per request | `1` |
| Timeout | `10s` |

LLM is invoked only for Bangla/Banglish/mixed language, ambiguous cases, or when template replies are insufficient.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes* | — | OpenRouter API key |
| `PORT` | No | `5001` | HTTP port |
| `LLM_MODEL` | No | `openai/gpt-4o-mini` | Model identifier |
| `LLM_TIMEOUT_MS` | No | `10000` | LLM timeout in ms |
| `LOG_LEVEL` | No | `info` | Pino log level |

\*Required for LLM-assisted paths. Deterministic investigations work without it.

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Vercel, Render, Railway, and local replication.

**Vercel:** `api/index.js` exports the Express app. `vercel.json` rewrites all routes with `maxDuration: 30`.

```bash
pnpm install
vercel env add OPENROUTER_API_KEY
vercel --prod
```

## Testing

```bash
pnpm test
pnpm lint
```

## Known limitations

- Complaint parser uses heuristics; highly unstructured complaints may require LLM assistance.
- Transaction time matching uses relative text when ISO parse fails.
- Bangla NLP is routed to LLM rather than fully parsed deterministically.
- No persistent case storage or ticket ID tracking.

## Future improvements

- Bengali deterministic parser with dedicated token dictionaries
- Fuzzy merchant name matching
- Case persistence and audit trail
- Rate limiting and API authentication
- Confidence calibration from labeled dispute outcomes

## License

ISC
