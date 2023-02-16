import extension from "../extension";

class AutoRefresh {
  timer?: NodeJS.Timer;

  constructor() {
    if (!extension.config.has("auto.refresh"))
      extension.config.update("auto.refresh", 60, true);

    if (this.interval)
      this.setInterval();
  }

  get interval() {
    return extension.config.get<number>("auto.refresh");
  }

  private refresh() {
    if (extension.token) {
      extension.statusBar.setLoading();
      extension.user.fetch(true);
      extension.statusBar.reset();
    }
  }

  stop() {
    try { clearInterval(this.timer); } catch { };
  }

  setInterval(interval: number | undefined = this.interval) {
    if (interval && interval < 30) {
      interval = 30;
      extension.config.update("auto.refresh", 30, true);
    }

    this.stop();

    if (interval)
      this.timer = setInterval(() => this.refresh, interval * 1000);
  }
}

export default AutoRefresh;