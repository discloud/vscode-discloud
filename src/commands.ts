/* eslint-disable no-duplicate-imports */
import { t } from "@vscode/l10n";
import { commands, window } from "vscode";
import type ExtensionCore from "./core/extension";
import type Command from "./structures/Command";
import { type CommandConstructor } from "./structures/Command";

export async function commandsRegister(core: ExtensionCore) {
  // root
  commandModuleRegister(core, "commit", await import("./commands/commit"));
  commandModuleRegister(core, "create.config", await import("./commands/create.config"));
  commandModuleRegister(core, "login", await import("./commands/login"));
  commandModuleRegister(core, "logout", await import("./commands/logout"));
  commandModuleRegister(core, "logs", await import("./commands/logs"));
  commandModuleRegister(core, "upload", await import("./commands/upload"));

  // apps
  commandModuleRegister(core, "apps/backup", await import("./commands/apps/backup"));
  commandModuleRegister(core, "apps/commit", await import("./commands/apps/commit"));
  commandModuleRegister(core, "apps/copy.id", await import("./commands/apps/copy.id"));
  commandModuleRegister(core, "apps/delete", await import("./commands/apps/delete"));
  commandModuleRegister(core, "apps/import", await import("./commands/apps/import"));
  commandModuleRegister(core, "apps/logs", await import("./commands/apps/logs"));
  commandModuleRegister(core, "apps/ram", await import("./commands/apps/ram"));
  commandModuleRegister(core, "apps/refresh", await import("./commands/apps/refresh"));
  commandModuleRegister(core, "apps/restart", await import("./commands/apps/restart"));
  commandModuleRegister(core, "apps/start", await import("./commands/apps/start"));
  commandModuleRegister(core, "apps/status", await import("./commands/apps/status"));
  commandModuleRegister(core, "apps/stop", await import("./commands/apps/stop"));
  commandModuleRegister(core, "apps/terminal", await import("./commands/apps/terminal"));

  // apps mods
  commandModuleRegister(core, "apps/mods/add", await import("./commands/apps/mods/add"));
  commandModuleRegister(core, "apps/mods/edit", await import("./commands/apps/mods/edit"));
  commandModuleRegister(core, "apps/mods/rem", await import("./commands/apps/mods/rem"));

  // apps profile
  commandModuleRegister(core, "apps/profile/avatar", await import("./commands/apps/profile/avatar"));
  commandModuleRegister(core, "apps/profile/name", await import("./commands/apps/profile/name"));

  // apps show avatar instead status
  commandModuleRegister(core, "apps/show.avatar.instead.status/always", await import("./commands/apps/show.avatar.instead.status/always"));
  commandModuleRegister(core, "apps/show.avatar.instead.status/never", await import("./commands/apps/show.avatar.instead.status/never"));
  commandModuleRegister(core, "apps/show.avatar.instead.status/when.online", await import("./commands/apps/show.avatar.instead.status/when.online"));

  // apps sort by
  commandModuleRegister(core, "apps/sort/by/id.asc", await import("./commands/apps/sort/by/id.asc"));
  commandModuleRegister(core, "apps/sort/by/id.desc", await import("./commands/apps/sort/by/id.desc"));
  commandModuleRegister(core, "apps/sort/by/memory.usage.asc", await import("./commands/apps/sort/by/memory.usage.asc"));
  commandModuleRegister(core, "apps/sort/by/memory.usage.desc", await import("./commands/apps/sort/by/memory.usage.desc"));
  commandModuleRegister(core, "apps/sort/by/name.asc", await import("./commands/apps/sort/by/name.asc"));
  commandModuleRegister(core, "apps/sort/by/name.desc", await import("./commands/apps/sort/by/name.desc"));
  commandModuleRegister(core, "apps/sort/by/none", await import("./commands/apps/sort/by/none"));
  commandModuleRegister(core, "apps/sort/by/started.asc", await import("./commands/apps/sort/by/started.asc"));
  commandModuleRegister(core, "apps/sort/by/started.desc", await import("./commands/apps/sort/by/started.desc"));

  // apps sort online
  commandModuleRegister(core, "apps/sort/online/activate", await import("./commands/apps/sort/online/activate"));
  commandModuleRegister(core, "apps/sort/online/deactivate", await import("./commands/apps/sort/online/deactivate"));

  // domain
  commandModuleRegister(core, "domain/refresh", await import("./commands/domain/refresh"));

  // subdomain
  commandModuleRegister(core, "subdomain/refresh", await import("./commands/subdomain/refresh"));

  // team
  commandModuleRegister(core, "team/backup", await import("./commands/team/backup"));
  commandModuleRegister(core, "team/commit", await import("./commands/team/commit"));
  commandModuleRegister(core, "team/copy.id", await import("./commands/team/copy.id"));
  commandModuleRegister(core, "team/import", await import("./commands/team/import"));
  commandModuleRegister(core, "team/logs", await import("./commands/team/logs"));
  commandModuleRegister(core, "team/ram", await import("./commands/team/ram"));
  commandModuleRegister(core, "team/refresh", await import("./commands/team/refresh"));
  commandModuleRegister(core, "team/restart", await import("./commands/team/restart"));
  commandModuleRegister(core, "team/start", await import("./commands/team/start"));
  commandModuleRegister(core, "team/status", await import("./commands/team/status"));
  commandModuleRegister(core, "team/stop", await import("./commands/team/stop"));

  // team sort by
  commandModuleRegister(core, "team/sort/by/id.asc", await import("./commands/team/sort/by/id.asc"));
  commandModuleRegister(core, "team/sort/by/id.desc", await import("./commands/team/sort/by/id.desc"));
  commandModuleRegister(core, "team/sort/by/memory.usage.asc", await import("./commands/team/sort/by/memory.usage.asc"));
  commandModuleRegister(core, "team/sort/by/memory.usage.desc", await import("./commands/team/sort/by/memory.usage.desc"));
  commandModuleRegister(core, "team/sort/by/name.asc", await import("./commands/team/sort/by/name.asc"));
  commandModuleRegister(core, "team/sort/by/name.desc", await import("./commands/team/sort/by/name.desc"));
  commandModuleRegister(core, "team/sort/by/none", await import("./commands/team/sort/by/none"));
  commandModuleRegister(core, "team/sort/by/started.asc", await import("./commands/team/sort/by/started.asc"));
  commandModuleRegister(core, "team/sort/by/started.desc", await import("./commands/team/sort/by/started.desc"));

  // apps sort online
  commandModuleRegister(core, "team/sort/online/activate", await import("./commands/team/sort/online/activate"));
  commandModuleRegister(core, "team/sort/online/deactivate", await import("./commands/team/sort/online/deactivate"));

  // user
  commandModuleRegister(core, "user/set.locale", await import("./commands/user/set.locale"));

  core.debug("Commands loaded");
}

function commandModuleRegister(
  core: ExtensionCore,
  commandName: string,
  module: { default: CommandConstructor } | CommandConstructor,
) {
  commandRegister(
    core,
    `discloud.${commandName.replace(/[/\\]+/g, ".")}`,
    "default" in module ? new module.default(core) : new module(core),
  );
}

function commandRegister(
  core: ExtensionCore,
  commandName: string,
  command: Command,
) {
  if (
    !command ||
    typeof command !== "object" ||
    !Reflect.has(command, "data") ||
    !Reflect.has(command, "run")
  ) {
    core.debug(commandName, "❌");
    return;
  }

  const disposable = commands.registerCommand(commandName, async function (...args) {
    if (!command.data.allowTokenless)
      if (!await core.auth.pat.getSession())
        return void window.showErrorMessage(t("missing.token"));

    try {
      if (command.data.progress) {
        return await window.withProgress(command.data.progress, async function (progress, token) {
          return await Promise.race([
            new Promise((_, reject) => token.onCancellationRequested(reject)),
            command.run({ progress, token }, ...args),
          ]);
        });
      }

      return await command.run(null, ...args);
    } catch (error) {
      core.emit("error", error);
    } finally {
      core.statusBar.reset();
    }
  });

  core.context.subscriptions.push(disposable);

  core.debug(commandName, "✅");
}
