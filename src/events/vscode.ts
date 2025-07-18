import core from "../extension";

core.on("vscode", async function (user) {
  if (!user) return;

  core.userTree.set(user);

  if ("appsStatus" in user)
    core.userAppTree.setRawApps(user.appsStatus);

  if ("appsTeam" in user)
    core.teamAppTree.setRawApps(user.appsTeam.map(id => ({ id })));

  if ("subdomains" in user)
    core.subDomainTree.update(user.subdomains);

  if ("customdomains" in user)
    core.customDomainTree.update(user.customdomains);
});
