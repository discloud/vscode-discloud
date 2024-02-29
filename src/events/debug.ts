import extension, { logger } from "../extension";

extension.on("debug", async function (message, ...args) {
  if (extension.isDebug) logger.info(message, ...args);
});
