import { commands } from "vscode";
import core from "../extension";
import { localize } from "../localize";
import { canAccessCustomDomains, canAccessSubdomains } from "../utils/plans";

core.on("vscode", async function (user) {
  if (!user) return;

  const hasSubdomainsAccess = canAccessSubdomains(user.plan);
  const hasCustomDomainsAccess = canAccessCustomDomains(user.plan);

  await Promise.all([
    commands.executeCommand("setContext", "discloudHasSubdomainsAccess", hasSubdomainsAccess),
    commands.executeCommand("setContext", "discloudHasCustomDomainsAccess", hasCustomDomainsAccess),
    localize(core.context, user.locale || undefined),
  ]);

  core.userTree.set(user);

  if ("appsStatus" in user)
    core.userAppTree.setRawApps(user.appsStatus);

  if ("appsStatus" in user)
    core.snapshotTree.setRawApps(user.appsStatus);

  if ("appsTeam" in user)
    core.teamAppTree.setRawApps(user.appsTeam.map(id => ({ id })));

  if ("subdomains" in user)
    core.subDomainTree.update(hasSubdomainsAccess ? user.subdomains : []);

  if ("customdomains" in user)
    core.customDomainTree.update(hasCustomDomainsAccess ? user.customdomains : []);
});
