import { commands, version, window } from "vscode";
import extension from "../extension";
import DiscloudAPIError from "../services/discloud/error";

extension.on("error", async function (error: any) {
  if (!error) return;

  const metadata = [
    "",
    `Extension v${extension.context.extension.packageJSON.version}`,
    `VSCode v${version}`,
  ];

  if (error instanceof DiscloudAPIError) {
    if (error.code > 499) {
      extension.logger.error(`Server error ${error.code}`, metadata.join("\n"));
      await window.showErrorMessage(`Server error ${error.code}`);
      return;
    }
  }

  extension.logger.error(error, metadata.join("\n"));

  const message = error.message ?? error;

  if (error.responseBody && typeof error.responseBody === "object" && "button" in error.responseBody) {
    const buttonLabel = error.responseBody.button.label;
    const buttonUrl = error.responseBody.button.url;
    const action = await window.showErrorMessage(message, buttonLabel);
    if (action === buttonLabel) await commands.executeCommand("vscode.open", buttonUrl);
    return;
  }

  await window.showErrorMessage(message);
});
