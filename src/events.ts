import type Discloud from "./structures/Discloud";

export async function loadEvents(extension: Discloud) {
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

  extension.debug("Events loaded");
}
