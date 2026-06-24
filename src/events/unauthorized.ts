import { commands } from "vscode";
import type ExtensionCore from "../core/extension";

export default async function (core: ExtensionCore) {
  await Promise.all([
    commands.executeCommand("setContext", "discloudAuthorized", false),
    commands.executeCommand("setContext", "discloudUnauthorized", true),
  ]);

  core.api.authorized = false;

  core.userTree.clear();

  core.statusBar.setLogin();

  core.logger.warn("Unauthorized");
}