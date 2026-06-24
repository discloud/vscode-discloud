import { format } from "util";
import type ExtensionCore from "../core/extension";

export default async function (core: ExtensionCore, message: string, ...args: any[]) {
  if (core.isDebug) core.logger.appendLine(format(message, ...args));
  else core.logger.debug(format(message, ...args));
}
