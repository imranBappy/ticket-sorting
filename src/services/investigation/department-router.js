function routeDepartment(caseType, evidenceVerdict) {
  switch (caseType) {
    case "wrong_transfer":
      return "dispute_resolution";
    case "payment_failed":
      return evidenceVerdict === "inconsistent" ? "payments_ops" : "customer_support";
    case "refund_request":
      return "payments_ops";
    case "phishing_or_social_engineering":
      return "fraud_risk";
    default:
      return "customer_support";
  }
}

module.exports = { routeDepartment };
