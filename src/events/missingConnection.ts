import extension from "../extension";

extension.on("missingConnection", async function () {
  extension.resetStatusBar();

  extension.logger.error("Missing connection");
});
