import { ExtensionContextId } from "../@enum";
import type ExtensionCore from "../core";

export default async function (core: ExtensionCore) {
  await Promise.all([
    core.setContext(ExtensionContextId.discloudAuthorized, true),
    core.setContext(ExtensionContextId.discloudUnauthorized, false),
  ]);

  core.api.authorized = true;

  core.statusBar.reset();

  core.logger.info("Authorized");
}
