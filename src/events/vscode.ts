import extension from "../extension";

extension.on("vscode", (user) => {
  extension.logger.info("Get vscode");

  if (user)
    extension.userTree.update(Object.create(user));

  if ("appsStatus" in user)
    extension.appTree.addRawApps(user.appsStatus);

  if ("appsTeam" in user)
    extension.teamAppTree.addRawApps(user.appsTeam.map(id => ({ id })));

  if ("subdomains" in user)
    extension.subDomainTree.update(user.subdomains);

  if ("customdomains" in user)
    extension.customDomainTree.update(user.customdomains);
});
