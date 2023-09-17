import { commands } from "vscode";
import extension from "../extension";

extension.on("authorized", async (token, isWorkspace) => {
  commands.executeCommand("setContext", "discloudTokenAuthorized", true);
  commands.executeCommand("setContext", "discloudTokenUnauthorized", false);

  if (isWorkspace)
    await extension.config.update("token", undefined);

  extension.config.update("token", token, true);

  extension.statusBar.setDefault();

  extension.logger.info("Authorized");
});
