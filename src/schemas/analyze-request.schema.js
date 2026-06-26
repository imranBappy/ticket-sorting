const { z } = require("zod");
const config = require("../config");
const { transactionSchema } = require("./transaction.schema");

const analyzeRequestSchema = z.object({
  complaint: z
    .string()
    .min(1, "Complaint cannot be empty")
    .max(config.limits.maxComplaintLength, "Complaint exceeds maximum length"),
  transaction_history: z
    .array(transactionSchema)
    .max(config.limits.maxTransactionHistory)
    .default([]),
});

module.exports = { analyzeRequestSchema };
