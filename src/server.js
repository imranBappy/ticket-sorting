const config = require("./config");
const createApp = require("./app");
const { rootLogger } = require("./middleware/logger");

const app = createApp();

if (require.main === module) {
  app.listen(config.port, () => {
    rootLogger.info({ port: config.port }, "QueueStorm Investigator API listening");
  });
}

module.exports = app;
