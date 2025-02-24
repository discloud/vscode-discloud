import { type BaseApiApp } from "discloud.app";
import { workspace } from "vscode";
import extension from "../extension";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import LanguageConfigurationProvider from "../providers/LanguageConfigurationProvider";
import { tokenValidator } from "../services/discloud";

extension.on("activate", async function (context) {
  extension.logger.info("Activate: begin");

  extension.loadStatusBar();
  extension.statusBar.setLoading();

  await extension.loadCommands();

  new CompletionItemProvider({ path: "discloudconfigschema.json" });
  new LanguageConfigurationProvider({ path: "discloudconfigschema.json" });

  const disposableConfiguration = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration("discloud.token")) {
      const isWorkspace = event.affectsConfiguration("discloud.token", extension.workspaceFolderUri);

      if (extension.token) {
        tokenValidator(extension.token, isWorkspace);
      } else {
        extension.emit("missingToken");
      }

      return;
    }

    if (event.affectsConfiguration("discloud.app.sort")) {
      extension.appTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.team.sort")) {
      extension.teamAppTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.app.show.avatar.instead.status")) {
      for (const id of extension.appTree.children.keys()) {
        extension.appTree.editRawApp(id, <BaseApiApp>{ id });
      }

      return;
    }

    if (event.affectsConfiguration("discloud.status.bar.behavior")) {
      extension.statusBar.setDefault();

      return;
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

  extension.logger.info("Activate: done");

  await tokenValidator(extension.token!);
});
