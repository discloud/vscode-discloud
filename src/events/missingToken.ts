import extension from "../extension";

extension.on("missingToken", async () => {
  extension.statusBar.setLogin();
  extension.userTree.children.clear();
  extension.userTree.refresh();

  extension.logger.warn("Missing token");
});
