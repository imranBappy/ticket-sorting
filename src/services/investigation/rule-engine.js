const { routeDepartment } = require("./department-router");
const { determineSeverity } = require("./severity-engine");
const { classifyCase } = require("./classifier");

function applyRules(parsedComplaint, evidenceResult, matchResult) {
  const classification = classifyCase(parsedComplaint, evidenceResult.evidenceVerdict);
  const caseType = classification.caseType;
  const department = routeDepartment(caseType, evidenceResult.evidenceVerdict);
  const severity = determineSeverity(caseType, evidenceResult.evidenceVerdict);

  let humanReviewRequired = false;
  const reasonCodes = [
    ...new Set([
      ...classification.reasonCodes,
      ...evidenceResult.reasonCodes,
      ...matchResult.reasonCodes,
    ]),
  ];

  if (caseType === "wrong_transfer") {
    humanReviewRequired = true;
    reasonCodes.push("wrong_transfer_policy");
  }

  if (caseType === "phishing_or_social_engineering") {
    humanReviewRequired = true;
    reasonCodes.push("fraud_escalation");
  }

  if (evidenceResult.evidenceVerdict === "insufficient_data") {
    humanReviewRequired = true;
    reasonCodes.push("insufficient_evidence");
  }

  if (evidenceResult.evidenceVerdict === "inconsistent") {
    humanReviewRequired = true;
    reasonCodes.push("evidence_inconsistent");
  }

  if (classification.ambiguous) {
    humanReviewRequired = true;
    reasonCodes.push("ambiguous_complaint");
  }

  let confidence = parsedComplaint.parserConfidence;
  if (matchResult.relevantTransactionId) confidence += 0.2;
  if (evidenceResult.evidenceVerdict === "consistent") confidence += 0.15;
  if (evidenceResult.evidenceVerdict === "inconsistent") confidence += 0.1;
  if (evidenceResult.evidenceVerdict === "insufficient_data") confidence -= 0.15;
  confidence = Math.max(0.1, Math.min(confidence, 0.95));

  return {
    caseType,
    department,
    severity,
    humanReviewRequired,
    confidence,
    reasonCodes: [...new Set(reasonCodes)],
    ambiguous: classification.ambiguous,
  };
}

module.exports = { applyRules };
