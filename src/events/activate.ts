import { workspace } from "vscode";
import extension from "../extension";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import DiagnosticProvider from "../providers/DiagnosticProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import AutoRefresh from "../structures/AutoRefresh";
import { tokenIsDiscloudJwt, tokenValidator } from "../util";

extension.once("activate", (context) => {
  extension.logger.append("Activate: begin");

  extension.loadStatusBar();
  extension.statusBar.setLoading();

  new CompletionItemProvider();
  new DiagnosticProvider();

  extension.autoRefresher = new AutoRefresh();
  extension.appTree = new AppTreeDataProvider("discloud-apps");
  extension.customDomainTree = new CustomDomainTreeDataProvider("discloud-domains");
  extension.subDomainTree = new SubDomainTreeDataProvider("discloud-subdomains");
  extension.teamAppTree = new TeamAppTreeDataProvider("discloud-teams");
  extension.userTree = new UserTreeDataProvider("discloud-user");

  extension.loadCommands();

  const disposableConfiguration = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration("discloud.token")) {
      if (extension.token) {
        tokenValidator(extension.token);
      } else {
        extension.statusBar.setLogin();
      }
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
    disposableConfiguration,
    disposableWorkspaceFolders,
  );

  if (tokenIsDiscloudJwt(extension.token)) {
    extension.statusBar.setUpload();
    extension.user.fetch(true);
  } else {
    extension.statusBar.setLogin();
  }

  extension.logger.info("Activate: done");
});
