import extension from "../extension";

extension.on("missingConnection", () => {
  extension.resetStatusBar();

  extension.logger.error("Missing connection");
});
