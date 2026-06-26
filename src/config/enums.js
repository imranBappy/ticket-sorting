const CASE_TYPES = [
  "wrong_transfer",
  "payment_failed",
  "refund_request",
  "phishing_or_social_engineering",
  "other",
];

const SEVERITIES = ["low", "medium", "high", "critical"];

const DEPARTMENTS = [
  "customer_support",
  "dispute_resolution",
  "payments_ops",
  "fraud_risk",
];

const EVIDENCE_VERDICTS = ["consistent", "inconsistent", "insufficient_data"];

const TRANSACTION_TYPES = ["transfer", "payment", "refund", "withdrawal", "other"];

const TRANSACTION_STATUSES = [
  "completed",
  "failed",
  "pending",
  "reversed",
  "cancelled",
];

const LANGUAGES = ["en", "bn", "banglish", "mixed"];

module.exports = {
  CASE_TYPES,
  SEVERITIES,
  DEPARTMENTS,
  EVIDENCE_VERDICTS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  LANGUAGES,
};
