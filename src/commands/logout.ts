import { type AuthenticationSessionAccountInformation } from "vscode";
import type ExtensionCore from "../core/extension";
import Command from "../structures/Command";
import type UserTreeItem from "../structures/UserTreeItem";

export default class extends Command {
  constructor(core: ExtensionCore) {
    super(core, {
      allowTokenless: true,
    });
  }

  async run(_: null, user: UserTreeItem) {
    const account: AuthenticationSessionAccountInformation = {
      id: user.userID,
      label: user.data.username ?? user.userID,
    };

    await this.core.auth.pat.clearSession(account);
  }
}
