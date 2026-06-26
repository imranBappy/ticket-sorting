function buildAgentSummary(caseType, evidenceVerdict, matchResult) {
  const txnPart = matchResult.relevantTransactionId
    ? `Matched transaction ${matchResult.relevantTransactionId}.`
    : "No confident transaction match found.";

  return `Case classified as ${caseType}. Evidence verdict: ${evidenceVerdict}. ${txnPart}`;
}

function buildRecommendedAction(caseType, evidenceVerdict, humanReviewRequired) {
  if (caseType === "wrong_transfer") {
    return "Verify beneficiary details and initiate dispute review per wrong-transfer policy. Do not promise reversal.";
  }
  if (caseType === "phishing_or_social_engineering") {
    return "Escalate to fraud risk team immediately. Secure account and review recent activity.";
  }
  if (caseType === "payment_failed" && evidenceVerdict === "inconsistent") {
    return "Compare gateway logs with customer report. Customer may have been debited despite failure message.";
  }
  if (caseType === "duplicate_payment") {
    return "Verify the duplicate with payments_ops. If the biller confirms only one payment was received, initiate reversal of duplicate transaction.";
  }
  if (caseType === "merchant_settlement_delay") {
    return "Route to merchant_operations to verify settlement batch status. If the batch is delayed, communicate a revised ETA to the merchant.";
  }
  if (caseType === "agent_cash_in_issue") {
    return "Investigate cash-in status with agent operations. Confirm settlement state and resolve within the standard cash-in SLA.";
  }
  if (evidenceVerdict === "insufficient_data") {
    return "Request additional transaction details from customer and verify against core banking records.";
  }
  if (humanReviewRequired) {
    return "Route to assigned department for manual verification before any customer commitment.";
  }
  return "Document findings and monitor case until resolution through official support channels.";
}

function buildCustomerReply(caseType, evidenceVerdict) {
  if (caseType === "wrong_transfer") {
    return "We have received your report regarding a possible wrong transfer. Our dispute resolution team is reviewing the transaction details. Please contact official support if you have additional information. We cannot confirm any reversal at this stage.";
  }
  if (caseType === "payment_failed" && evidenceVerdict === "inconsistent") {
    return "Thank you for reporting a payment issue. We are investigating whether the payment was processed despite the failure message you received. Our payments team will follow up through official support channels.";
  }
  if (caseType === "refund_request") {
    return "We have logged your refund request. Our team will verify the transaction and contact you through official support with next steps. We cannot confirm a refund until review is complete.";
  }
  if (caseType === "duplicate_payment") {
    return "We have noted the possible duplicate payment. Our payments team will verify with the biller and any eligible amount will be returned through official channels. Please do not share your PIN or OTP with anyone.";
  }
  if (caseType === "merchant_settlement_delay") {
    return "We have noted your concern about settlement. Our merchant operations team will check the batch status and update you on the expected settlement time through official channels.";
  }
  if (caseType === "agent_cash_in_issue") {
    return "We have noted your concern regarding the cash-in transaction. Our agent operations team is investigating and will update you soon through official channels. Please do not share your PIN or OTP with anyone.";
  }
  if (caseType === "phishing_or_social_engineering") {
    return "We take security concerns seriously. Your report has been escalated to our fraud and risk team. Please do not share PIN, OTP, or passwords with anyone. Contact official support immediately if you suspect unauthorized access.";
  }
  return "Thank you for contacting us. We are reviewing your complaint and will respond through our official support channels after verification.";
}

function generateReplies(parsedComplaint, ruleResult, evidenceResult, matchResult) {
  const { caseType, humanReviewRequired } = ruleResult;
  const { evidenceVerdict } = evidenceResult;

  return {
    agent_summary: buildAgentSummary(caseType, evidenceVerdict, matchResult),
    recommended_next_action: buildRecommendedAction(
      caseType,
      evidenceVerdict,
      humanReviewRequired,
    ),
    customer_reply: buildCustomerReply(caseType, evidenceVerdict),
  };
}

module.exports = { generateReplies };
