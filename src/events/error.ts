import { commands, window } from "vscode";
import extension from "../extension";

extension.on("error", async function (error: any) {
  const message = error?.message ?? error;

  extension.logger.error(error);

  if (error.responseBody && "button" in error.responseBody) {
    const buttonLabel = error.responseBody.button.label;
    const buttonUrl = error.responseBody.button.url;
    const action = await window.showErrorMessage(message, buttonLabel);
    if (action === buttonLabel) await commands.executeCommand("vscode.open", buttonUrl);
    return;
  }

  await window.showErrorMessage(message);
});
