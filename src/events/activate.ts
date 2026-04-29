import { commands, workspace } from "vscode";
import { AuthenticationProviderId } from "../authentication/enum/providers";
import type ExtensionCore from "../core/extension";
import core from "../extension";
import BaseLanguageProvider from "../providers/BaseLanguageProvider";
import CompletionItemProvider from "../providers/CompletionItemProvider";
import LanguageConfigurationProvider from "../providers/LanguageConfigurationProvider";
import { DISCLOUD_CONFIG_SCHEMA_FILE_NAME, GlobalStorageKeys } from "../utils/constants";

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
    if (event.affectsConfiguration("discloud.app.sort")) return core.userAppTree.refresh();

    if (event.affectsConfiguration("discloud.team.sort")) return core.teamAppTree.refresh();

    if (event.affectsConfiguration("discloud.app.separate.by.type")) return core.userAppTree.refresh();

    if (event.affectsConfiguration("discloud.app.show.avatar.instead.status")) {
      for (const app of core.userAppTree.children.values()) {
        app._patch({});
      }

      return core.userAppTree.refresh();
    }

    if (event.affectsConfiguration("discloud.status.bar.behavior")) return core.statusBar.setDefault();
  });

  // Refresh extension when session was removed
  const disposableAuthenticationEvent = core.auth.onDidChangeSessions(async (event) => {
    if (event.removed?.length) {
      const session = await core.auth.getSession();
      if (!session) core.emit("missingToken");
      return;
    }
  });

  context.subscriptions.push(disposableChangeConfiguration, disposableAuthenticationEvent);

  core.logger.debug("Activate: done");

  await migrateAuthenticationProvider(core);

  const session = await core.auth.getSession();

  if (session) {
    await commands.executeCommand("discloud.login", session);
  } else {
    core.statusBar.reset();
  }

  await commands.executeCommand("setContext", "discloudInitialized", true);
});

async function migrateAuthenticationProvider(core: ExtensionCore) {
  const oldSessionIdList = core.globalStorage.get<string[]>("sessionIdList", []);

  const [oldSessionId] = oldSessionIdList;

  if (oldSessionId === "discloudpat") {
    const promises: Thenable<void>[] = [];

    const account = core.globalStorage.get(oldSessionId);

    const newSessionId = AuthenticationProviderId.discloud;

    promises.push(
      core.globalStorage.update(GlobalStorageKeys.currentAutenticationProviderId, newSessionId),
      core.globalStorage.update(GlobalStorageKeys.currentSessionId, newSessionId),
      core.globalStorage.update(newSessionId, account),
    );

    const secret = await core.secrets.get(oldSessionId);
    if (secret) {
      promises.push(
        core.secrets.store(newSessionId, secret),
        core.secrets.delete(oldSessionId),
      );
    }

    oldSessionIdList[0] = newSessionId;

    await Promise.all(promises);

    await Promise.all([
      core.globalStorage.update(GlobalStorageKeys.sessionIdList, oldSessionIdList),
    ]);

    await Promise.all([
      core.globalStorage.delete("sessionIdList"),
    ]);
  }
}
