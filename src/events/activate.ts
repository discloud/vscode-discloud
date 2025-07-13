import { workspace } from "vscode";
import core from "../extension";
import BaseLanguageProvider from "../providers/BaseLanguageProvider";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import LanguageConfigurationProvider from "../providers/LanguageConfigurationProvider";
import { tokenValidator } from "../services/discloud/utils";
import { ConfigKeys, DISCLOUD_CONFIG_SCHEMA_FILE_NAME } from "../util/constants";

core.on("activate", async function (context) {
  try {
    const path = context.asAbsolutePath(DISCLOUD_CONFIG_SCHEMA_FILE_NAME);

    const schema = await BaseLanguageProvider.getSchemaFromPath(path);

    new CompletionItemProvider(context, schema);
    new LanguageConfigurationProvider(context, schema);
  } catch (error: any) {
    core.logger.error(error);
  }

  const disposableChangeConfiguration = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration("discloud.app.sort")) {
      core.appTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.team.sort")) {
      core.teamAppTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.app.separate.by.type")) {
      core.appTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.app.show.avatar.instead.status")) {
      for (const app of core.appTree.children.values()) {
        app._patch({});
      }

      core.appTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.status.bar.behavior")) {
      core.statusBar.setDefault();

      return;
    }
  });

  context.subscriptions.push(disposableChangeConfiguration);

  core.logger.info("Activate: done");

  const oldConfigToken = core.config.get<string>(ConfigKeys.token);
  if (oldConfigToken) {
    await core.config.update(ConfigKeys.token, undefined, true);
    await core.secrets.setToken(oldConfigToken);
  }

  const token = await core.secrets.getToken();
  if (token) await tokenValidator(token);
});
