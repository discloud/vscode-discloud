import { format } from "util";
import extension from "../extension";

extension.on("debug", async function (message, ...args) {
  if (extension.isDebug) extension.logger.appendLine(format(message, ...args));
  else extension.logger.debug(format(message, ...args));
});
