import type ExtensionCore from "./core/extension";

export async function loadEvents(core: ExtensionCore) {
  await import("./events/activate");
  await import("./events/appUpdate");
  await import("./events/authorized");
  await import("./events/debug");
  await import("./events/error");
  await import("./events/missingConnection");
  await import("./events/missingToken");
  await import("./events/rateLimited");
  await import("./events/teamAppUpdate");
  await import("./events/unauthorized");
  await import("./events/vscode");

  core.debug("Events loaded");
}
