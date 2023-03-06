import extension from "../extension";

extension.on("noConnection", () => {
  extension.resetStatusBar();
  extension.logger.error("No connection");
});