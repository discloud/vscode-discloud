import { commands } from "vscode";
import extension from "../extension";

extension.on("unauthorized", () => {
  commands.executeCommand("setContext", "discloudTokenAuthorized", false);
  commands.executeCommand("setContext", "discloudTokenUnauthorized", true);

  extension.userTree.children.clear();
  extension.userTree.refresh();

  extension.statusBar.setLogin();

  extension.logger.warn("Unauthorized");
});
