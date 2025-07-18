import { type Uri, window } from "vscode";
import { type TaskData } from "../../@types";
import type ExtensionCore from "../../core/extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor(readonly core: ExtensionCore) {
    super();
  }

  async run(_: TaskData, item: AppTreeItem) {
    const terminal = window.createTerminal({
      env: { DISCLOUD_TOKEN: await this.core.secrets.getToken() },
      iconPath: item.iconPath as Uri,
      name: typeof item.label === "string" ? item.label : item.appId,
    });

    this.core.context.subscriptions.push(terminal);

    terminal.show();

    terminal.sendText(`npx -y discloud-cli@latest app terminal ${item.appId}\nexit`);
  }
}
