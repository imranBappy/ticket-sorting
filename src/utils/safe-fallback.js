function buildLlmFallbackResponse(partial = {}) {
  return {
    relevant_transaction_id: partial.relevant_transaction_id ?? null,
    evidence_verdict: partial.evidence_verdict ?? "insufficient_data",
    case_type: partial.case_type ?? "other",
    severity: partial.severity ?? "medium",
    department: partial.department ?? "customer_support",
    agent_summary:
      partial.agent_summary ??
      "Automated investigation could not be completed. Case escalated for manual review.",
    recommended_next_action:
      partial.recommended_next_action ??
      "Assign to a human investigator and verify transaction records through official channels.",
    customer_reply:
      partial.customer_reply ??
      "Thank you for contacting us. Your case has been received and will be reviewed by our official support team. We will follow up after verification.",
    human_review_required: true,
    confidence: 0.3,
    reason_codes: [
      ...new Set([
        ...(partial.reason_codes || []),
        ...((partial.reason_codes || []).includes("llm_not_configured") ||
        (partial.reason_codes || []).includes("llm_error")
          ? []
          : ["llm_timeout"]),
      ]),
    ],
  };
}

module.exports = { buildLlmFallbackResponse };
