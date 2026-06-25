# Google Form Submission Checklist

Copy the values below into the submission form. Replace placeholders marked with `<...>` before submitting.

## Required fields

| Field | Value |
|-------|-------|
| **Team name** | `<YOUR_REGISTERED_TEAM_NAME>` |
| **GitHub repository URL** | `<https://github.com/YOUR_ORG/mock-task>` |
| **Live API base URL** | `<https://your-deployed-app.example.com>` (no trailing slash) |
| **Deployment platform** | `<Render / Railway / Fly / Vercel / EC2 / Poridhi Lab / other>` |
| **LLM used** | **Yes** — OpenRouter, model `openai/gpt-4o-mini` |

## Optional field

| Field | Value |
|-------|-------|
| **Known issues or blockers** | Port hardcoded to 5001 (may need `process.env.PORT` for some hosts). No request validation or structured error handling on `/sort-ticket`. No automated tests. |

## Pre-submit verification

Run these against your **live** base URL:

```bash
# Must return HTTP 200 and body "OK"
curl -i https://your-deployed-app.example.com/health

# Should return classified JSON
curl -s -X POST https://your-deployed-app.example.com/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"form-check","message":"Payment failed on my last invoice."}'
```

## Repository requirements (for graders)

- [x] Public GitHub repo
- [x] `README.md` with project overview and API usage
- [x] Source code in repo
- [x] Deployment replication runbook: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

## Notes

- No team is eliminated based on this round — use submission time to validate deployment workflow, GitHub flow, and team coordination.
- If the live URL is unavailable, graders will deploy locally using `DEPLOYMENT.md`.
