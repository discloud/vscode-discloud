/* eslint-disable no-duplicate-imports */
import { t } from "@vscode/l10n";
import { commands, window } from "vscode";
import type ExtensionCore from "./core/extension";
import type Command from "./structures/Command";
import { type CommandConstructor } from "./structures/Command";

export async function commandsRegister(core: ExtensionCore) {
  // root
  commandModuleRegister(core, await import("./commands/commit"), "commit");
  commandModuleRegister(core, await import("./commands/create.config"), "create.config");
  commandModuleRegister(core, await import("./commands/login"), "login");
  commandModuleRegister(core, await import("./commands/logout"), "logout");
  commandModuleRegister(core, await import("./commands/logs"), "logs");
  commandModuleRegister(core, await import("./commands/upload"), "upload");

  // apps
  commandModuleRegister(core, await import("./commands/apps/backup"), "apps/backup");
  commandModuleRegister(core, await import("./commands/apps/commit"), "apps/commit");
  commandModuleRegister(core, await import("./commands/apps/copy.id"), "apps/copy.id");
  commandModuleRegister(core, await import("./commands/apps/delete"), "apps/delete");
  commandModuleRegister(core, await import("./commands/apps/import"), "apps/import");
  commandModuleRegister(core, await import("./commands/apps/logs"), "apps/logs");
  commandModuleRegister(core, await import("./commands/apps/ram"), "apps/ram");
  commandModuleRegister(core, await import("./commands/apps/refresh"), "apps/refresh");
  commandModuleRegister(core, await import("./commands/apps/restart"), "apps/restart");
  commandModuleRegister(core, await import("./commands/apps/start"), "apps/start");
  commandModuleRegister(core, await import("./commands/apps/status"), "apps/status");
  commandModuleRegister(core, await import("./commands/apps/stop"), "apps/stop");
  commandModuleRegister(core, await import("./commands/apps/terminal"), "apps/terminal");

  // apps mods
  commandModuleRegister(core, await import("./commands/apps/mods/add"), "apps/mods/add");
  commandModuleRegister(core, await import("./commands/apps/mods/edit"), "apps/mods/edit");
  commandModuleRegister(core, await import("./commands/apps/mods/rem"), "apps/mods/rem");

  // apps profile
  commandModuleRegister(core, await import("./commands/apps/profile/avatar"), "apps/profile/avatar");
  commandModuleRegister(core, await import("./commands/apps/profile/name"), "apps/profile/name");

  // apps show avatar instead status
  commandModuleRegister(core, await import("./commands/apps/show.avatar.instead.status/always"), "apps/show.avatar.instead.status/always");
  commandModuleRegister(core, await import("./commands/apps/show.avatar.instead.status/never"), "apps/show.avatar.instead.status/never");
  commandModuleRegister(core, await import("./commands/apps/show.avatar.instead.status/when.online"), "apps/show.avatar.instead.status/when.online");

  // apps sort by
  commandModuleRegister(core, await import("./commands/apps/sort/by/id.asc"), "apps/sort/by/id.asc");
  commandModuleRegister(core, await import("./commands/apps/sort/by/id.desc"), "apps/sort/by/id.desc");
  commandModuleRegister(core, await import("./commands/apps/sort/by/memory.usage.asc"), "apps/sort/by/memory.usage.asc");
  commandModuleRegister(core, await import("./commands/apps/sort/by/memory.usage.desc"), "apps/sort/by/memory.usage.desc");
  commandModuleRegister(core, await import("./commands/apps/sort/by/name.asc"), "apps/sort/by/name.asc");
  commandModuleRegister(core, await import("./commands/apps/sort/by/name.desc"), "apps/sort/by/name.desc");
  commandModuleRegister(core, await import("./commands/apps/sort/by/none"), "apps/sort/by/none");
  commandModuleRegister(core, await import("./commands/apps/sort/by/started.asc"), "apps/sort/by/started.asc");
  commandModuleRegister(core, await import("./commands/apps/sort/by/started.desc"), "apps/sort/by/started.desc");

  // apps sort online
  commandModuleRegister(core, await import("./commands/apps/sort/online/activate"), "apps/sort/online/activate");
  commandModuleRegister(core, await import("./commands/apps/sort/online/deactivate"), "apps/sort/online/deactivate");

  // domain
  commandModuleRegister(core, await import("./commands/domain/refresh"), "domain/refresh");

  // subdomain
  commandModuleRegister(core, await import("./commands/subdomain/refresh"), "subdomain/refresh");

  // team
  commandModuleRegister(core, await import("./commands/team/backup"), "team/backup");
  commandModuleRegister(core, await import("./commands/team/commit"), "team/commit");
  commandModuleRegister(core, await import("./commands/team/copy.id"), "team/copy.id");
  commandModuleRegister(core, await import("./commands/team/import"), "team/import");
  commandModuleRegister(core, await import("./commands/team/logs"), "team/logs");
  commandModuleRegister(core, await import("./commands/team/ram"), "team/ram");
  commandModuleRegister(core, await import("./commands/team/refresh"), "team/refresh");
  commandModuleRegister(core, await import("./commands/team/restart"), "team/restart");
  commandModuleRegister(core, await import("./commands/team/start"), "team/start");
  commandModuleRegister(core, await import("./commands/team/status"), "team/status");
  commandModuleRegister(core, await import("./commands/team/stop"), "team/stop");

  // team sort by
  commandModuleRegister(core, await import("./commands/team/sort/by/id.asc"), "team/sort/by/id.asc");
  commandModuleRegister(core, await import("./commands/team/sort/by/id.desc"), "team/sort/by/id.desc");
  commandModuleRegister(core, await import("./commands/team/sort/by/memory.usage.asc"), "team/sort/by/memory.usage.asc");
  commandModuleRegister(core, await import("./commands/team/sort/by/memory.usage.desc"), "team/sort/by/memory.usage.desc");
  commandModuleRegister(core, await import("./commands/team/sort/by/name.asc"), "team/sort/by/name.asc");
  commandModuleRegister(core, await import("./commands/team/sort/by/name.desc"), "team/sort/by/name.desc");
  commandModuleRegister(core, await import("./commands/team/sort/by/none"), "team/sort/by/none");
  commandModuleRegister(core, await import("./commands/team/sort/by/started.asc"), "team/sort/by/started.asc");
  commandModuleRegister(core, await import("./commands/team/sort/by/started.desc"), "team/sort/by/started.desc");

  // apps sort online
  commandModuleRegister(core, await import("./commands/team/sort/online/activate"), "team/sort/online/activate");
  commandModuleRegister(core, await import("./commands/team/sort/online/deactivate"), "team/sort/online/deactivate");

  // user
  commandModuleRegister(core, await import("./commands/user/set.locale"), "user/set.locale");

  core.debug("Commands loaded:", core.commands.size);
}

function commandModuleRegister(
  core: ExtensionCore,
  module: { default: CommandConstructor } | CommandConstructor,
  commandName: string,
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
  if (!command || typeof command !== "object" || !Reflect.has(command, "data") || !Reflect.has(command, "run")) {
    core.debug(commandName, "❌");
    return;
  }

  const disposable = commands.registerCommand(commandName, async function (...args) {
    if (!command.data.allowTokenless)
      if (!await core.secrets.getToken()) 
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

  core.commands.set(commandName, command);

  core.debug(commandName, "✅");
}
