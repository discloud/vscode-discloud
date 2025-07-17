import { t } from "@vscode/l10n";
import { CancellationError, commands, version, window } from "vscode";
import WarningError from "../errors/warning";
import core from "../extension";
import DiscloudAPIError from "../services/discloud/errors/api";

core.on("error", async function (error: any) {
  if (!error) return;

  if (error instanceof CancellationError)
    return void window.showWarningMessage(t("action.cancelled"));

  if (error instanceof WarningError)
    return void window.showWarningMessage(error.message);

  const metadata = [
    "",
    `Extension v${core.context.extension.packageJSON.version}`,
    `VSCode v${version}`,
  ].join("\n");

  if (error instanceof DiscloudAPIError) {
    if (error.code > 499) {
      core.logger.error(`Server error ${error.code}`, metadata);
      return void window.showErrorMessage(`Server error ${error.code}`);
    }
  }

  core.logger.error(error, metadata);

  const message = error.message ?? error;

  if (error.body && typeof error.body === "object" && "button" in error.body) {
    const buttonLabel = error.body.button.label;
    const buttonUrl = error.body.button.url;
    const action = await window.showErrorMessage(message, buttonLabel);
    if (action === buttonLabel) void commands.executeCommand("vscode.open", buttonUrl);
    return;
  }

  void window.showErrorMessage(message);
});
