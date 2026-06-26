require("dotenv").config();

const config = {
  port: Number(process.env.PORT) || 5001,
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  limits: {
    maxJsonBodySize: "1mb",
  },
  logLevel: process.env.LOG_LEVEL || "info",
};

module.exports = config;
