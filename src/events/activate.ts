import { workspace } from "vscode";
import extension from "../extension";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import DiagnosticProvider from "../providers/DiagnosticProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";

extension.once("activate", (context) => {
  extension.loadStatusBar();
  extension.statusBar.setLoading();

  new DiagnosticProvider();

  const completionItemProvider = new CompletionItemProvider();

  extension.appTree = new AppTreeDataProvider("discloud-apps");
  extension.customDomainTree = new CustomDomainTreeDataProvider("discloud-domains");
  extension.subDomainTree = new SubDomainTreeDataProvider("discloud-subdomains");
  extension.teamAppTree = new TeamAppTreeDataProvider("discloud-teams");
  extension.userTree = new UserTreeDataProvider("discloud-user");

  extension.loadCommands();

  const disposableConfiguration = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration("discloud.token")) {
      extension.statusBar.reset();
    }

    if (event.affectsConfiguration("discloud.auto.refresh")) {
      if (extension.autoRefresher.interval) {
        extension.autoRefresher.setInterval();
      } else {
        extension.autoRefresher.stop();
      }
    }
  });

  const disposableWorkspaceFolders = workspace.onDidChangeWorkspaceFolders(() => {
    if (extension.workspaceAvailable) {
      extension.statusBar.show();
    } else {
      extension.statusBar.hide();
    }
  });

  context.subscriptions.push(
    completionItemProvider.disposable,
    disposableConfiguration,
    disposableWorkspaceFolders,
  );

  extension.statusBar.reset();

  if (extension.token)
    extension.user.fetch(true);
});
