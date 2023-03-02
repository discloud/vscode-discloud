import { ConfigurationTarget } from "vscode";
import extension from "../extension";

class AutoRefresh {
  timer?: NodeJS.Timer;

  constructor() {
    if (this.interval)
      this.setInterval();
  }

  get interval() {
    return extension.config.get<number>("auto.refresh");
  }

  private async refresh() {
    if (extension.token) {
      extension.logger.info("Auto refresh run");
      extension.statusBar.setLoading();
      await extension.user.fetch(true);
      extension.statusBar.reset();
    }
  }

  stop() {
    try { clearInterval(this.timer); } catch { };
  }

  setInterval(interval?: number | null | undefined, isWorkspace?: boolean) {
    if (typeof interval !== "number") interval = this.interval;

    const inspect = extension.config.inspect<number>("auto.refresh");

    if (typeof isWorkspace === "undefined") {
      isWorkspace = Boolean(inspect?.workspaceValue);
    } else if (!isWorkspace) {
      interval = inspect?.globalValue ?? interval;
    }

    if (interval && interval < 30) {
      extension.logger.warn(
        `${interval} seconds interval is not allowed.`
        + " Intervals of less than 30 seconds are not allowed."
      );

      interval = 30;

      extension.config.update("auto.refresh", 30,
        isWorkspace ?
          ConfigurationTarget.Workspace :
          ConfigurationTarget.Global
      );
    }

    this.stop();

    if (interval)
      this.timer = setInterval(() => this.refresh(), interval * 1000);
  }
}

export default AutoRefresh;