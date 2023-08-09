import { workspace } from "vscode";
import { BaseApiApp } from "../@types";
import extension from "../extension";
import AppTreeDataProvider from "../providers/AppTreeDataProvider";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import CustomDomainTreeDataProvider from "../providers/CustomDomainTreeDataProvider";
import LanguageConfigurationProvider from "../providers/LanguageConfigurationProvider";
import SubDomainTreeDataProvider from "../providers/SubDomainTreeDataProvider";
import TeamAppTreeDataProvider from "../providers/TeamAppTreeDataProvider";
import UserTreeDataProvider from "../providers/UserTreeDataProvider";
import { tokenIsDiscloudJwt, tokenValidator } from "../util";

extension.on("activate", (context) => {
  extension.logger.info("Activate: begin");

  extension.loadStatusBar();
  extension.statusBar.setLoading();

  new CompletionItemProvider({ path: "discloudconfig.json" });
  new LanguageConfigurationProvider({ path: "discloudconfig.json" });

  extension.appTree = new AppTreeDataProvider("discloud-apps");
  extension.customDomainTree = new CustomDomainTreeDataProvider("discloud-domains");
  extension.subDomainTree = new SubDomainTreeDataProvider("discloud-subdomains");
  extension.teamAppTree = new TeamAppTreeDataProvider("discloud-teams");
  extension.userTree = new UserTreeDataProvider("discloud-user");

  extension.loadCommands();

  const disposableConfiguration = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration("discloud.token")) {
      const isWorkspace = event.affectsConfiguration("discloud.token", workspace.workspaceFolders?.[0]);

      if (extension.token) {
        tokenValidator(extension.token, isWorkspace);
      } else {
        extension.emit("missingToken");
      }
    }

    if (event.affectsConfiguration("discloud.app.sort")) {
      extension.appTree.refresh();
    }

    if (event.affectsConfiguration("discloud.team.sort")) {
      extension.teamAppTree.refresh();
    }

    if (event.affectsConfiguration("discloud.app.show.avatar.instead.status")) {
      for (const id of extension.appTree.children.keys()) {
        extension.appTree.edit(id, <BaseApiApp>{ id });
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
