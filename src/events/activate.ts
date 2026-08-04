import { type AuthenticationSessionAccountInformation, commands, type ExtensionContext, workspace } from "vscode";
import { ExtensionContextId } from "../@enum";
import { AuthenticationProviderId } from "../authentication/enum/providers";
import type ExtensionCore from "../core/extension";
import BaseLanguageProvider from "../language/BaseLanguageProvider";
import { GlobalStorageKeys } from "../utils/constants";

const _discloudAppSort = "discloud.app.sort";
const _discloudTeamSort = "discloud.team.sort";
const _discloudAppSeparateByType = "discloud.app.separate.by.type";
const _discloudAppShowAvatarInsteadStatus = "discloud.app.show.avatar.instead.status";
const _discloudStatusBarBehavior = "discloud.status.bar.behavior";

export default async function (core: ExtensionCore, context: ExtensionContext) {
  queueMicrotask(() => BaseLanguageProvider.startProviders(context).catch(core.logger.error));

  const disposableChangeConfiguration = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration(_discloudAppSort)) return core.userAppTree.refresh();

    if (event.affectsConfiguration(_discloudTeamSort)) return core.teamAppTree.refresh();

    if (event.affectsConfiguration(_discloudAppSeparateByType)) return core.userAppTree.refresh();

    if (event.affectsConfiguration(_discloudAppShowAvatarInsteadStatus)) {
      for (const app of core.userAppTree.children.values()) {
        app._patch({});
      }

      return core.userAppTree.refresh();
    }

    if (event.affectsConfiguration(_discloudStatusBarBehavior)) return core.statusBar.setDefault();
  });

  // Refresh extension when session was removed
  const disposableAuthenticationEvent = core.auth.onDidChangeSessions(async (event) => {
    if (event.removed?.length) {
      const session = await core.auth.getSession();
      if (!session) core.emit("missingToken", core);
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

  await core.setContext(ExtensionContextId.discloudInitialized, true);
}

async function migrateAuthenticationProvider(core: ExtensionCore) {
  const oldSessionIdList = core.globalStorage.get<string[]>("sessionIdList", []);

  const [oldSessionId] = oldSessionIdList;

  if (oldSessionId === "discloudpat") {
    const promises: Thenable<void>[] = [];

    const account = core.globalStorage.get<AuthenticationSessionAccountInformation>(oldSessionId);

    const newSessionId = account
      ? `${AuthenticationProviderId.discloud}.${account.id}`
      : AuthenticationProviderId.discloud;

    promises.push(
      core.globalStorage.update(GlobalStorageKeys.currentAutenticationProviderId, newSessionId),
      core.globalStorage.update(GlobalStorageKeys.currentSessionId, newSessionId),
      core.globalStorage.update(newSessionId, account),
      core.globalStorage.update(oldSessionId, undefined),
    );

    const secret = await core.secrets.get(oldSessionId);
    if (secret) {
      promises.push(
        core.secrets.store(newSessionId, secret),
        core.secrets.delete(oldSessionId),
      );
    }

    oldSessionIdList[0] = newSessionId;

    await Promise.all(promises.concat(
      core.globalStorage.update(GlobalStorageKeys.sessionIdList, oldSessionIdList),
      core.globalStorage.delete("sessionIdList"),
    ));
  }
}
