import { commands } from "vscode";
import extension from "../extension";
import { ConfigKeys } from "../util/constants";

extension.on("authorized", async function (token, isWorkspace) {
  commands.executeCommand("setContext", "discloudTokenAuthorized", true);
  commands.executeCommand("setContext", "discloudTokenUnauthorized", false);

  if (isWorkspace)
    await extension.config.update(ConfigKeys.token, undefined);

  extension.config.update(ConfigKeys.token, token, true);

  extension.statusBar.setDefault();

  extension.logger.info("Authorized");
});
