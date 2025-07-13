import { format } from "util";
import core from "../extension";

core.on("debug", async function (message, ...args) {
  if (core.isDebug) core.logger.appendLine(format(message, ...args));
  else core.logger.debug(format(message, ...args));
});
