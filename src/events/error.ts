import { commands, version, window } from "vscode";
import extension from "../extension";

extension.on("error", async function (error: any) {
  if (!error) return;

  const metadata = [
    "",
    `Extension v${extension.context.extension.packageJSON.version}`,
    `VSCode v${version}`,
  ];

  extension.logger.error(error, metadata.join("\n"));

  const message = error.message ?? error;

  if (error.responseBody && "button" in error.responseBody) {
    const buttonLabel = error.responseBody.button.label;
    const buttonUrl = error.responseBody.button.url;
    const action = await window.showErrorMessage(message, buttonLabel);
    if (action === buttonLabel) await commands.executeCommand("vscode.open", buttonUrl);
    return;
  }

  await window.showErrorMessage(message);
});
