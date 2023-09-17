import { workspace } from "vscode";
import { BaseApiApp } from "../@types";
import extension from "../extension";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import LanguageConfigurationProvider from "../providers/LanguageConfigurationProvider";
import { tokenIsDiscloudJwt, tokenValidator } from "../util";

extension.on("activate", async (context) => {
  extension.logger.info("Activate: begin");

  extension.loadStatusBar();
  extension.statusBar.setLoading();

  extension.loadCommands();

  new CompletionItemProvider({ path: "discloudconfig.json" });
  new LanguageConfigurationProvider({ path: "discloudconfig.json" });

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
    extension.statusBar.setDefault();
    extension.user.fetch(true);
  } else {
    extension.statusBar.setLogin();
  }

  extension.logger.info("Activate: done");
});
