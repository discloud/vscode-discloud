import { window } from "vscode";
import extension from "../extension";

extension.on("error", (error) => {
  const message = error?.body?.message ?? error;

  extension.logger.error(message);
  window.showErrorMessage(message);
});
