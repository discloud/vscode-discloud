import { type Uri, window } from "vscode";
import { type TaskData } from "../../@types";
import extension from "../../extension";
import type AppTreeItem from "../../structures/AppTreeItem";
import Command from "../../structures/Command";

export default class extends Command {
  constructor() {
    super();
  }

  async run(task: TaskData, item?: AppTreeItem) {
    if (!item) {
      const picked = await this.pickAppOrTeamApp(task, { showOther: false });
      item = picked.app;
    }

    const terminal = window.createTerminal({
      env: { DISCLOUD_TOKEN: extension.token },
      iconPath: item.iconPath as Uri,
      name: typeof item.label === "string" ? item.label : item.appId,
    });

    extension.subscriptions.push(terminal);

    terminal.show();

    terminal.sendText(`npx -y discloud-cli@latest terminal ${item.appId}\nexit`);
  }
}
