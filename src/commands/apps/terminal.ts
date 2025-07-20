import { type Uri, window } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import Command from "../../structures/Command";
import type UserAppTreeItem from "../../structures/UserAppTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core);
  }

  async run(_: TaskData, item: UserAppTreeItem) {
    const session = await this.core.auth.pat.getSession();

    const terminal = window.createTerminal({
      env: { DISCLOUD_TOKEN: session?.accessToken },
      iconPath: item.iconPath as Uri,
      name: typeof item.label === "string" ? item.label : item.appId,
    });

    this.core.context.subscriptions.push(terminal);

    terminal.show();

    terminal.sendText(`npx -y discloud-cli@latest app terminal ${item.appId}\nexit`);
  }
}
