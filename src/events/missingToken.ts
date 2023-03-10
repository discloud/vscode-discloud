import extension from "../extension";

extension.on("missingToken", () => {
  extension.statusBar.setLogin();
  extension.userTree.children.clear();
  extension.userTree.refresh();

  extension.logger.warn("Missing token");
});
