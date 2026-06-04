import { commands } from "vscode";
import core from "../extension";
import { localize } from "../localize";

core.on("unauthorized", async function () {
  await Promise.all([
    commands.executeCommand("setContext", "discloudAuthorized", false),
    commands.executeCommand("setContext", "discloudUnauthorized", true),
    commands.executeCommand("setContext", "discloudHasSubdomainsAccess", false),
    commands.executeCommand("setContext", "discloudHasCustomDomainsAccess", false),
    localize(core.context),
  ]);

  core.api.authorized = false;

  core.userTree.clear();
  core.subDomainTree.update([]);
  core.customDomainTree.update([]);

  core.statusBar.setLogin();

  core.logger.warn("Unauthorized");
});
