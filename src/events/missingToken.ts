import extension from "../extension";

extension.on("missingToken", async function () {
  extension.userTree.clear();
  extension.statusBar.setLogin();

  extension.logger.warn("Missing token");
});
