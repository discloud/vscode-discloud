import { window } from "vscode";
import extension from "../extension";

extension.on("error", (error) => {
  extension.logger.error(`${error.body?.message ?? error}`);
  window.showErrorMessage(`${error.body?.message ?? error}`);
});