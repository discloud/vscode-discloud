import type { Events, IEventModule } from "./@types";
import type ExtensionCore from "./core/extension";

export async function loadEvents(core: ExtensionCore) {
  await Promise.all([
    loadEvent(core, "activate", import("./events/activate")),
    loadEvent(core, "appUpdate", import("./events/appUpdate")),
    loadEvent(core, "authorized", import("./events/authorized")),
    loadEvent(core, "debug", import("./events/debug")),
    loadEvent(core, "error", import("./events/error")),
    loadEvent(core, "missingConnection", import("./events/missingConnection")),
    loadEvent(core, "missingToken", import("./events/missingToken")),
    loadEvent(core, "rateLimited", import("./events/rateLimited")),
    loadEvent(core, "teamAppUpdate", import("./events/teamAppUpdate")),
    loadEvent(core, "unauthorized", import("./events/unauthorized")),
    loadEvent(core, "vscode", import("./events/vscode")),
  ]);

  core.debug("Events loaded");
}

async function loadEvent<K extends keyof Events>(
  core: ExtensionCore,
  name: K,
  eventPromise: Promise<IEventModule<Events, K, Events[K]>>,
) {
  const event = await eventPromise;
  const invoker = event.once ? "once" : "on";
  core[invoker](name, event.default as any);
}
