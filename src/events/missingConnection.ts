import type ExtensionCore from "../core/extension";

export default async function (core: ExtensionCore) {
  core.statusBar.reset();
}
