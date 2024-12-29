import { window } from "vscode";
import extension from "../extension";

extension.on("error", async function (error: any) {
  const message = error?.body?.message ?? error;

  extension.logger.error(message);
  await window.showErrorMessage(error.message ?? message);
});
