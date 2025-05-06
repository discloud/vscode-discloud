import { CancellationError, commands, version, window } from "vscode";
import WarningError from "../errors/warning";
import extension from "../extension";
import DiscloudAPIError from "../services/discloud/error";

extension.on("error", async function (error: any) {
  if (!error) return;

  if (error instanceof CancellationError) return;

  if (error instanceof WarningError) {
    await window.showWarningMessage(error.message);
    return;
  }

  const metadata = [
    "",
    `Extension v${extension.context.extension.packageJSON.version}`,
    `VSCode v${version}`,
  ].join("\n");

  if (error instanceof DiscloudAPIError) {
    if (error.code > 499) {
      extension.logger.error(`Server error ${error.code}`, metadata);
      await window.showErrorMessage(`Server error ${error.code}`);
      return;
    }
  }

  extension.logger.error(error, metadata);

  const message = error.message ?? error;

  if (error.body && typeof error.body === "object" && "button" in error.body) {
    const buttonLabel = error.body.button.label;
    const buttonUrl = error.body.button.url;
    const action = await window.showErrorMessage(message, buttonLabel);
    if (action === buttonLabel) await commands.executeCommand("vscode.open", buttonUrl);
    return;
  }

  await window.showErrorMessage(message);
});
