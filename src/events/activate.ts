import { commands, workspace } from "vscode";
import core from "../extension";
import BaseLanguageProvider from "../providers/BaseLanguageProvider";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import LanguageConfigurationProvider from "../providers/LanguageConfigurationProvider";
import { ConfigKeys, DISCLOUD_CONFIG_SCHEMA_FILE_NAME, SecretKeys } from "../utils/constants";

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
      core.userAppTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.team.sort")) {
      core.teamAppTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.app.separate.by.type")) {
      core.userAppTree.refresh();

      return;
    }

    if (event.affectsConfiguration("discloud.app.show.avatar.instead.status")) {
      for (const app of core.userAppTree.children.values()) {
        app._patch({});
      }

      core.userAppTree.refresh();

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
    await core.secrets.store(SecretKeys.discloudpat, oldConfigToken);
  }

  const oldSecret = await core.secrets.get("token");
  if (oldSecret) {
    await core.secrets.delete("token");
    await core.secrets.store(SecretKeys.discloudpat, oldSecret);
  }

  const session = await core.auth.pat.getSession();

  if (session) {
    void commands.executeCommand("discloud.login", session);
  } else {
    core.statusBar.reset();
  }
});
