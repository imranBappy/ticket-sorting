function evaluateEvidence(parsedComplaint, matchResult) {
  const { matchedTransaction } = matchResult;
  const intent = parsedComplaint.intent;

  if (!matchedTransaction) {
    return {
      evidenceVerdict: "insufficient_data",
      reasonCodes: ["no_matching_transaction"],
    };
  }

  if (intent === "other") {
    return {
      evidenceVerdict: "insufficient_data",
      reasonCodes: ["ambiguous_intent"],
    };
  }

  if (intent === "payment_failed") {
    if (matchedTransaction.status === "completed") {
      return {
        evidenceVerdict: "inconsistent",
        reasonCodes: ["status_mismatch", "payment_reported_failed_but_completed"],
      };
    }
    if (matchedTransaction.status === "failed") {
      return {
        evidenceVerdict: "consistent",
        reasonCodes: ["status_match", "payment_failed_confirmed"],
      };
    }
    return {
      evidenceVerdict: "insufficient_data",
      reasonCodes: ["inconclusive_payment_status"],
    };
  }

  if (intent === "wrong_transfer") {
    if (matchedTransaction.status === "completed") {
      return {
        evidenceVerdict: "consistent",
        reasonCodes: ["status_match", "completed_transfer_found"],
      };
    }
    return {
      evidenceVerdict: "insufficient_data",
      reasonCodes: ["transfer_not_completed"],
    };
  }

  if (intent === "refund_request") {
    if (matchedTransaction.status === "reversed") {
      return {
        evidenceVerdict: "consistent",
        reasonCodes: ["refund_already_reversed"],
      };
    }
    return {
      evidenceVerdict: "insufficient_data",
      reasonCodes: ["refund_status_unclear"],
    };
  }

  if (intent === "phishing_or_social_engineering") {
    return {
      evidenceVerdict: "insufficient_data",
      reasonCodes: ["fraud_requires_manual_review"],
    };
  }

  return {
    evidenceVerdict: "insufficient_data",
    reasonCodes: ["unhandled_intent"],
  };
}

module.exports = { evaluateEvidence };
