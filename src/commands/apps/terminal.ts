import { type Uri, window } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super();
  }

  async run(_: TaskData, item: AppTreeItem) {
    const terminal = window.createTerminal({
      env: { DISCLOUD_TOKEN: extension.token },
      iconPath: item.iconPath as Uri,
      name: typeof item.label === "string" ? item.label : item.appId,
    });

    extension.context.subscriptions.push(terminal);

    terminal.show();

    terminal.sendText(`npx -y discloud-cli@latest app terminal ${item.appId}\nexit`);
  }
}
