import extension from "../extension";

extension.on("vscode", async function (user) {
  if (user) {
    extension.userTree.set(user);

    if ("appsStatus" in user)
      extension.appTree.setRawApps(user.appsStatus);

    if ("appsTeam" in user)
      extension.teamAppTree.setRawApps(user.appsTeam.map(id => ({ id })));

    if ("subdomains" in user)
      extension.subDomainTree.update(user.subdomains);

    if ("customdomains" in user)
      extension.customDomainTree.update(user.customdomains);
  }
});
