function classifyCase(parsedComplaint, evidenceVerdict) {
  const caseType = parsedComplaint.intent === "other" ? "other" : parsedComplaint.intent;

  if (evidenceVerdict === "insufficient_data" && caseType === "other") {
    return {
      caseType: "other",
      ambiguous: true,
      reasonCodes: ["ambiguous_case"],
    };
  }

  return {
    caseType,
    ambiguous: caseType === "other" || parsedComplaint.parserConfidence < 0.5,
    reasonCodes: caseType === "other" ? ["unclassified_intent"] : ["intent_classified"],
  };
}

module.exports = { classifyCase };
