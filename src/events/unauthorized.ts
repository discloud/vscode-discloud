import extension from "../extension";

extension.on("unauthorized", () => {
  extension.logger.warn("Unauthorized");
  extension.statusBar.setLogin();
});