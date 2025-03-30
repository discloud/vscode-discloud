/* eslint-disable no-duplicate-imports */
import { commands, window } from "vscode";
import { type TaskData } from "./@types";
import type Command from "./structures/Command";
import { type CommandConstructor } from "./structures/Command";
import type Discloud from "./structures/Discloud";

export async function commandsRegister(
  extension: Discloud,
) {
  // root
  commandModuleRegister(extension, await import("./commands/commit"), "commit");
  commandModuleRegister(extension, await import("./commands/create.config"), "create.config");
  commandModuleRegister(extension, await import("./commands/login"), "login");
  commandModuleRegister(extension, await import("./commands/logs"), "logs");
  commandModuleRegister(extension, await import("./commands/upload"), "upload");

  // apps
  commandModuleRegister(extension, await import("./commands/apps/backup"), "apps/backup");
  commandModuleRegister(extension, await import("./commands/apps/commit"), "apps/commit");
  commandModuleRegister(extension, await import("./commands/apps/copy.id"), "apps/copy.id");
  commandModuleRegister(extension, await import("./commands/apps/delete"), "apps/delete");
  commandModuleRegister(extension, await import("./commands/apps/import"), "apps/import");
  commandModuleRegister(extension, await import("./commands/apps/logs"), "apps/logs");
  commandModuleRegister(extension, await import("./commands/apps/ram"), "apps/ram");
  commandModuleRegister(extension, await import("./commands/apps/refresh"), "apps/refresh");
  commandModuleRegister(extension, await import("./commands/apps/restart"), "apps/restart");
  commandModuleRegister(extension, await import("./commands/apps/start"), "apps/start");
  commandModuleRegister(extension, await import("./commands/apps/status"), "apps/status");
  commandModuleRegister(extension, await import("./commands/apps/stop"), "apps/stop");
  commandModuleRegister(extension, await import("./commands/apps/terminal"), "apps/terminal");

  // apps mods
  commandModuleRegister(extension, await import("./commands/apps/mods/add"), "apps/mods/add");
  commandModuleRegister(extension, await import("./commands/apps/mods/edit"), "apps/mods/edit");
  commandModuleRegister(extension, await import("./commands/apps/mods/rem"), "apps/mods/rem");

  // apps profile
  commandModuleRegister(extension, await import("./commands/apps/profile/avatar"), "apps/profile/avatar");
  commandModuleRegister(extension, await import("./commands/apps/profile/name"), "apps/profile/name");

  // apps show avatar instead status
  commandModuleRegister(extension, await import("./commands/apps/show.avatar.instead.status/always"), "apps/profile/show.avatar.instead.status/always");
  commandModuleRegister(extension, await import("./commands/apps/show.avatar.instead.status/never"), "apps/profile/show.avatar.instead.status/never");
  commandModuleRegister(extension, await import("./commands/apps/show.avatar.instead.status/when.online"), "apps/profile/show.avatar.instead.status/when.online");

  // apps sort by
  commandModuleRegister(extension, await import("./commands/apps/sort/by/id.asc"), "apps/sort/by/id.asc");
  commandModuleRegister(extension, await import("./commands/apps/sort/by/id.desc"), "apps/sort/by/id.desc");
  commandModuleRegister(extension, await import("./commands/apps/sort/by/memory.usage.asc"), "apps/sort/by/memory.usage.asc");
  commandModuleRegister(extension, await import("./commands/apps/sort/by/memory.usage.desc"), "apps/sort/by/memory.usage.desc");
  commandModuleRegister(extension, await import("./commands/apps/sort/by/name.asc"), "apps/sort/by/name.asc");
  commandModuleRegister(extension, await import("./commands/apps/sort/by/name.desc"), "apps/sort/by/name.desc");
  commandModuleRegister(extension, await import("./commands/apps/sort/by/none"), "apps/sort/by/none");
  commandModuleRegister(extension, await import("./commands/apps/sort/by/started.asc"), "apps/sort/by/started.asc");
  commandModuleRegister(extension, await import("./commands/apps/sort/by/started.desc"), "apps/sort/by/started.desc");

  // apps sort online
  commandModuleRegister(extension, await import("./commands/apps/sort/online/activate"), "apps/sort/online/activate");
  commandModuleRegister(extension, await import("./commands/apps/sort/online/deactivate"), "apps/sort/online/deactivate");

  // domain
  commandModuleRegister(extension, await import("./commands/domain/refresh"), "domain/refresh");

  // subdomain
  commandModuleRegister(extension, await import("./commands/subdomain/refresh"), "subdomain/refresh");

  // team
  commandModuleRegister(extension, await import("./commands/team/backup"), "team/backup");
  commandModuleRegister(extension, await import("./commands/team/commit"), "team/commit");
  commandModuleRegister(extension, await import("./commands/team/copy.id"), "team/copy.id");
  commandModuleRegister(extension, await import("./commands/team/import"), "team/import");
  commandModuleRegister(extension, await import("./commands/team/logs"), "team/logs");
  commandModuleRegister(extension, await import("./commands/team/ram"), "team/ram");
  commandModuleRegister(extension, await import("./commands/team/refresh"), "team/refresh");
  commandModuleRegister(extension, await import("./commands/team/restart"), "team/restart");
  commandModuleRegister(extension, await import("./commands/team/start"), "team/start");
  commandModuleRegister(extension, await import("./commands/team/status"), "team/status");
  commandModuleRegister(extension, await import("./commands/team/stop"), "team/stop");

  // team sort by
  commandModuleRegister(extension, await import("./commands/team/sort/by/id.asc"), "team/sort/by/id.asc");
  commandModuleRegister(extension, await import("./commands/team/sort/by/id.desc"), "team/sort/by/id.desc");
  commandModuleRegister(extension, await import("./commands/team/sort/by/memory.usage.asc"), "team/sort/by/memory.usage.asc");
  commandModuleRegister(extension, await import("./commands/team/sort/by/memory.usage.desc"), "team/sort/by/memory.usage.desc");
  commandModuleRegister(extension, await import("./commands/team/sort/by/name.asc"), "team/sort/by/name.asc");
  commandModuleRegister(extension, await import("./commands/team/sort/by/name.desc"), "team/sort/by/name.desc");
  commandModuleRegister(extension, await import("./commands/team/sort/by/none"), "team/sort/by/none");
  commandModuleRegister(extension, await import("./commands/team/sort/by/started.asc"), "team/sort/by/started.asc");
  commandModuleRegister(extension, await import("./commands/team/sort/by/started.desc"), "team/sort/by/started.desc");

  // apps sort online
  commandModuleRegister(extension, await import("./commands/team/sort/online/activate"), "team/sort/online/activate");
  commandModuleRegister(extension, await import("./commands/team/sort/online/deactivate"), "team/sort/online/deactivate");

  // user
  commandModuleRegister(extension, await import("./commands/user/set.locale"), "user/set.locale");

  extension.debug("Commands loaded:", extension.commands.size);
}

function commandModuleRegister(
  extension: Discloud,
  module: { default: CommandConstructor } | CommandConstructor,
  commandName: string,
) {
  commandRegister(
    extension,
    `discloud.${commandName.replace(/[/\\]+/g, ".")}`,
    "default" in module ? new module.default() : new module(),
  );
}

function commandRegister(
  extension: Discloud,
  commandName: string,
  command: Command,
) {
  if (!command || typeof command !== "object" || !Reflect.has(command, "data") || !Reflect.has(command, "run")) {
    extension.debug(commandName, "❌");
    return;
  }

  const disposable = commands.registerCommand(commandName, async function (...args) {
    if (!command.data.allowTokenless)
      if (!extension.hasToken) return;

    try {
      if (command.data.progress) {
        const taskData = <TaskData>{};

        await window.withProgress(command.data.progress, async function (progress, token) {
          token.onCancellationRequested(() => extension.statusBar.reset());

          taskData.progress = progress;
          taskData.token = token;

          await command.run(taskData, ...args);
        });
      } else {
        await command.run(null, ...args);
      }
    } catch (error) {
      extension.emit("error", error);
    } finally {
      extension.statusBar.reset();
    }
  });

  extension.context.subscriptions.push(disposable);

  extension.commands.set(commandName, command);

  extension.debug(commandName, "✅");
}
