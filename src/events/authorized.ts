import { commands } from "vscode";
import core from "../extension";

core.on("authorized", async function () {
  await Promise.all([
    commands.executeCommand("setContext", "discloudAuthorized", true),
    commands.executeCommand("setContext", "discloudUnauthorized", false),
  ]);

  core.api.authorized = true;

  core.statusBar.reset();

  core.logger.info("Authorized");
});
