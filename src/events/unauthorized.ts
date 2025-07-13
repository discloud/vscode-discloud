import { commands } from "vscode";
import core from "../extension";

core.on("unauthorized", async function () {
  await Promise.all([
    commands.executeCommand("setContext", "discloudAuthorized", false),
    commands.executeCommand("setContext", "discloudUnauthorized", true),
  ]);

  core.api.authorized = false;

  core.userTree.clear();

  core.statusBar.setLogin();

  core.logger.warn("Unauthorized");
});
