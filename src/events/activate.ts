import { workspace } from "vscode";
import extension from "../extension";
import BaseLanguageProvider from "../providers/BaseLanguageProvider";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import LanguageConfigurationProvider from "../providers/LanguageConfigurationProvider";
import { tokenValidator } from "../services/discloud/utils";
import { DISCLOUD_CONFIG_SCHEMA_FILE_NAME } from "../util/constants";

extension.on("activate", async function (context) {
  try {
    const path = context.asAbsolutePath(DISCLOUD_CONFIG_SCHEMA_FILE_NAME);

    const schema = await BaseLanguageProvider.getSchemaFromPath(path);

    new CompletionItemProvider(context, schema);
    new LanguageConfigurationProvider(context, schema);
  } catch (error: any) {
    extension.logger.error(error);
  }

  const disposableChangeConfiguration = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration("discloud.token")) {
      if (extension.token) {
        tokenValidator(extension.token);
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

    if (event.affectsConfiguration("discloud.app.separate.by.type")) {
      extension.appTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.app.show.avatar.instead.status")) {
      for (const app of extension.appTree.children.values()) {
        app._patch({});
      }

      extension.appTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.status.bar.behavior")) {
      extension.statusBar.setDefault();

      return;
    }
  });

  context.subscriptions.push(disposableChangeConfiguration);

  extension.logger.info("Activate: done");

  if (extension.token) await tokenValidator(extension.token);

  extension.statusBar.reset();
});
