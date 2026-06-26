function determineSeverity(caseType, evidenceVerdict) {
  if (caseType === "phishing_or_social_engineering") {
    return "critical";
  }

  if (caseType === "wrong_transfer") {
    return "high";
  }

  if (caseType === "payment_failed") {
    return evidenceVerdict === "inconsistent" ? "high" : "medium";
  }

  if (caseType === "refund_request") {
    return "medium";
  }

  if (evidenceVerdict === "insufficient_data") {
    return "medium";
  }

  return "low";
}

module.exports = { determineSeverity };
