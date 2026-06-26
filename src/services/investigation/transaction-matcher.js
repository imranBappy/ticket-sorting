const config = require("../../config");
const {
  normalizePhone,
  amountsMatch,
  parseTimestamp,
  hoursDifference,
} = require("../../utils/score");

function scoreTransaction(parsedComplaint, transaction) {
  let score = 0;
  const reasonCodes = [];

  if (
    parsedComplaint.amount !== null &&
    amountsMatch(parsedComplaint.amount, transaction.amount, config.matcher.amountTolerancePercent)
  ) {
    score += 40;
    reasonCodes.push("amount_match");
  }

  if (
    parsedComplaint.transactionType &&
    parsedComplaint.transactionType === transaction.type
  ) {
    score += 20;
    reasonCodes.push("type_match");
  }

  const complaintPhones = parsedComplaint.phoneNumbers.map(normalizePhone);
  const counterparty = normalizePhone(transaction.counterparty);
  if (complaintPhones.length > 0 && counterparty) {
    const phoneMatch = complaintPhones.some(
      (p) => p === counterparty || counterparty.endsWith(p) || p.endsWith(counterparty),
    );
    if (phoneMatch) {
      score += 25;
      reasonCodes.push("counterparty_match");
    }
  }

  if (parsedComplaint.merchant && transaction.merchant) {
    if (
      transaction.merchant.toLowerCase().includes(parsedComplaint.merchant.toLowerCase())
    ) {
      score += 10;
      reasonCodes.push("merchant_match");
    }
  }

  const complaintTime = parseTimestamp(parsedComplaint.time);
  const txnTime = parseTimestamp(transaction.timestamp);
  if (complaintTime && txnTime) {
    const diff = hoursDifference(complaintTime, txnTime);
    if (diff !== null && diff <= config.matcher.timeWindowHours) {
      score += 10;
      reasonCodes.push("time_proximity");
    }
  } else if (txnTime && parsedComplaint.time) {
    score += 5;
    reasonCodes.push("time_reference");
  }

  if (transaction.status) {
    score += 5;
    reasonCodes.push("status_considered");
  }

  return { score, reasonCodes, transaction };
}

function matchTransaction(parsedComplaint, transactionHistory) {
  if (!transactionHistory || transactionHistory.length === 0) {
    return {
      relevantTransactionId: null,
      matchedTransaction: null,
      matchScore: 0,
      reasonCodes: ["no_transaction_history"],
    };
  }

  const scored = transactionHistory
    .map((txn) => scoreTransaction(parsedComplaint, txn))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (!best || best.score < config.matcher.scoreThreshold) {
    return {
      relevantTransactionId: null,
      matchedTransaction: null,
      matchScore: best?.score || 0,
      reasonCodes: ["no_confident_match"],
    };
  }

  return {
    relevantTransactionId: best.transaction.id,
    matchedTransaction: best.transaction,
    matchScore: best.score,
    reasonCodes: best.reasonCodes,
  };
}

module.exports = { matchTransaction, scoreTransaction };
