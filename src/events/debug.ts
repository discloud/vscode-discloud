import extension from "../extension";

extension.on("debug", async function (message, ...args) {
  if (extension.isDebug) extension.logger.info(message, ...args);
  else extension.logger.debug(message, ...args);
});
