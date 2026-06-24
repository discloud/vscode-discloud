import { commands } from "vscode";
import type ExtensionCore from "../core/extension";

export default async function (core: ExtensionCore) {
  await Promise.all([
    commands.executeCommand("setContext", "discloudAuthorized", true),
    commands.executeCommand("setContext", "discloudUnauthorized", false),
  ]);

  core.api.authorized = true;

  core.statusBar.reset();

  core.logger.info("Authorized");
}
