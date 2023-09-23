import { commands } from "vscode";
import extension from "../extension";

extension.on("unauthorized", async () => {
  commands.executeCommand("setContext", "discloudTokenAuthorized", false);
  commands.executeCommand("setContext", "discloudTokenUnauthorized", true);

  extension.userTree.clear();

  extension.statusBar.setLogin();

  extension.logger.warn("Unauthorized");
});
