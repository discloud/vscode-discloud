import extension from "../extension";

extension.on("missingConnection", async () => {
  extension.resetStatusBar();

  extension.logger.error("Missing connection");
});
