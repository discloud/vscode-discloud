import { t } from "@vscode/l10n";
import { commands, window } from "vscode";
import type ExtensionCore from "./core/extension";
import type Command from "./structures/Command";
import type { CommandConstructor } from "./structures/Command";

export async function commandsRegister(core: ExtensionCore) {
  await Promise.all([
    // root
    commandModuleRegister(core, "commit", import("./commands/commit")),
    commandModuleRegister(core, "create.config", import("./commands/create.config")),
    commandModuleRegister(core, "login", import("./commands/login")),
    commandModuleRegister(core, "logout", import("./commands/logout")),
    commandModuleRegister(core, "logs", import("./commands/logs")),
    commandModuleRegister(core, "upload", import("./commands/upload")),

    // apps
    commandModuleRegister(core, "apps/backup", import("./commands/apps/backup")),
    commandModuleRegister(core, "apps/commit", import("./commands/apps/commit")),
    commandModuleRegister(core, "apps/copy.id", import("./commands/apps/copy.id")),
    commandModuleRegister(core, "apps/delete", import("./commands/apps/delete")),
    commandModuleRegister(core, "apps/import", import("./commands/apps/import")),
    commandModuleRegister(core, "apps/logs", import("./commands/apps/logs")),
    commandModuleRegister(core, "apps/ram", import("./commands/apps/ram")),
    commandModuleRegister(core, "apps/refresh", import("./commands/apps/refresh")),
    commandModuleRegister(core, "apps/restart", import("./commands/apps/restart")),
    commandModuleRegister(core, "apps/start", import("./commands/apps/start")),
    commandModuleRegister(core, "apps/status", import("./commands/apps/status")),
    commandModuleRegister(core, "apps/stop", import("./commands/apps/stop")),
    commandModuleRegister(core, "apps/terminal", import("./commands/apps/terminal")),

    // apps mods
    commandModuleRegister(core, "apps/mods/add", import("./commands/apps/mods/add")),
    commandModuleRegister(core, "apps/mods/edit", import("./commands/apps/mods/edit")),
    commandModuleRegister(core, "apps/mods/rem", import("./commands/apps/mods/rem")),

    // apps profile
    commandModuleRegister(core, "apps/profile/avatar", import("./commands/apps/profile/avatar")),
    commandModuleRegister(core, "apps/profile/name", import("./commands/apps/profile/name")),

    // apps show avatar instead status
    commandModuleRegister(core, "apps/show.avatar.instead.status/always", import("./commands/apps/show.avatar.instead.status/always")),
    commandModuleRegister(core, "apps/show.avatar.instead.status/never", import("./commands/apps/show.avatar.instead.status/never")),
    commandModuleRegister(core, "apps/show.avatar.instead.status/when.online", import("./commands/apps/show.avatar.instead.status/when.online")),

    // apps sort by
    commandModuleRegister(core, "apps/sort/by/id.asc", import("./commands/apps/sort/by/id.asc")),
    commandModuleRegister(core, "apps/sort/by/id.desc", import("./commands/apps/sort/by/id.desc")),
    commandModuleRegister(core, "apps/sort/by/memory.usage.asc", import("./commands/apps/sort/by/memory.usage.asc")),
    commandModuleRegister(core, "apps/sort/by/memory.usage.desc", import("./commands/apps/sort/by/memory.usage.desc")),
    commandModuleRegister(core, "apps/sort/by/name.asc", import("./commands/apps/sort/by/name.asc")),
    commandModuleRegister(core, "apps/sort/by/name.desc", import("./commands/apps/sort/by/name.desc")),
    commandModuleRegister(core, "apps/sort/by/none", import("./commands/apps/sort/by/none")),
    commandModuleRegister(core, "apps/sort/by/started.asc", import("./commands/apps/sort/by/started.asc")),
    commandModuleRegister(core, "apps/sort/by/started.desc", import("./commands/apps/sort/by/started.desc")),

    // apps sort online
    commandModuleRegister(core, "apps/sort/online/activate", import("./commands/apps/sort/online/activate")),
    commandModuleRegister(core, "apps/sort/online/deactivate", import("./commands/apps/sort/online/deactivate")),

    // domain
    commandModuleRegister(core, "domain/refresh", import("./commands/domain/refresh")),

    // subdomain
    commandModuleRegister(core, "subdomain/refresh", import("./commands/subdomain/refresh")),

    // team
    commandModuleRegister(core, "team/backup", import("./commands/team/backup")),
    commandModuleRegister(core, "team/commit", import("./commands/team/commit")),
    commandModuleRegister(core, "team/copy.id", import("./commands/team/copy.id")),
    commandModuleRegister(core, "team/import", import("./commands/team/import")),
    commandModuleRegister(core, "team/logs", import("./commands/team/logs")),
    commandModuleRegister(core, "team/ram", import("./commands/team/ram")),
    commandModuleRegister(core, "team/refresh", import("./commands/team/refresh")),
    commandModuleRegister(core, "team/restart", import("./commands/team/restart")),
    commandModuleRegister(core, "team/start", import("./commands/team/start")),
    commandModuleRegister(core, "team/status", import("./commands/team/status")),
    commandModuleRegister(core, "team/stop", import("./commands/team/stop")),

    // team sort by
    commandModuleRegister(core, "team/sort/by/id.asc", import("./commands/team/sort/by/id.asc")),
    commandModuleRegister(core, "team/sort/by/id.desc", import("./commands/team/sort/by/id.desc")),
    commandModuleRegister(core, "team/sort/by/memory.usage.asc", import("./commands/team/sort/by/memory.usage.asc")),
    commandModuleRegister(core, "team/sort/by/memory.usage.desc", import("./commands/team/sort/by/memory.usage.desc")),
    commandModuleRegister(core, "team/sort/by/name.asc", import("./commands/team/sort/by/name.asc")),
    commandModuleRegister(core, "team/sort/by/name.desc", import("./commands/team/sort/by/name.desc")),
    commandModuleRegister(core, "team/sort/by/none", import("./commands/team/sort/by/none")),
    commandModuleRegister(core, "team/sort/by/started.asc", import("./commands/team/sort/by/started.asc")),
    commandModuleRegister(core, "team/sort/by/started.desc", import("./commands/team/sort/by/started.desc")),

    // apps sort online
    commandModuleRegister(core, "team/sort/online/activate", import("./commands/team/sort/online/activate")),
    commandModuleRegister(core, "team/sort/online/deactivate", import("./commands/team/sort/online/deactivate")),

    // user
    commandModuleRegister(core, "user/copy.id", import("./commands/user/copy.id")),
    commandModuleRegister(core, "user/set.locale", import("./commands/user/set.locale")),
  ]);

  core.debug("Commands loaded");
}

async function commandModuleRegister(
  core: ExtensionCore,
  commandName: string,
  modulePromise: Promise<{ default: CommandConstructor } | CommandConstructor>,
) {
  const module = await modulePromise;

  commandRegister(
    core,
    normalizeCommandName(commandName),
    "default" in module ? new module.default(core) : new module(core),
  );
}

const commandNameNormalizerRegex = /[/\\]+/g;
const dot = ".";
function normalizeCommandName(commandName: string) {
  return `discloud.${commandName.replace(commandNameNormalizerRegex, dot)}`;
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
    return core.debug(commandName, "❌");
  }

  const disposable = commands.registerCommand(commandName, async function (...args) {
    if (!command.data.allowTokenless)
      if (!await core.auth.getSession())
        return void window.showErrorMessage(t("missing.token"));

    try {
      if (command.data.progress) {
        return await window.withProgress(command.data.progress, async function (progress, token) {
          const controller = new AbortController();

          return await Promise.race([
            new Promise((_, reject) => token.onCancellationRequested((e) => {
              controller.abort(e);
              reject(e);
            })),
            command.run({ progress, token, signal: controller.signal }, ...args),
          ]);
        });
      }

      return await command.run(null, ...args);
    } catch (error) {
      core.emit("error", core, error);
    } finally {
      core.statusBar.reset();
    }
  });

  core.context.subscriptions.push(disposable);

  core.debug(commandName, "✅");
}
