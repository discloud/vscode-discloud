import { window } from "vscode";
import extension from "../extension";

extension.on("error", (error) => {
  window.showErrorMessage(`${error.body?.message ?? error}`);
});