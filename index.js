const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  return res.send("OK");
});

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

app.post("/sort-ticket", async (req, res) => {
  const body = req.body;
  const { message, ticket_id } = body;
  const prompt = `
You are a CRM ticket classifier.

Return ONLY valid JSON.

Rules:

case_type:
- wrong_transfer
- payment_failed
- refund_request
- phishing_or_social_engineering
- other

severity:
- low
- medium
- high
- critical

department:
- customer_support
- dispute_resolution
- payments_ops
- fraud_risk

Response format:
{
  "case_type": "",
  "severity": "",
  "department": "",
  "agent_summary": "",
  "human_review_required": false,
  "confidence": 0.0
}
Notes:
- Must be valid JSON formet

Ticket:
${message}
`;

  const result = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    temperature: 0,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: prompt,
      },
    ],
  });

  const content = JSON.parse(
    result?.choices?.length ? result.choices[0]?.message?.content : "{}",
  );
    return res.json({
        ticket_id,
      ...content,
    });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`App is listening on ${PORT}`);
  });
}
