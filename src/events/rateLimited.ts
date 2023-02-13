import extension from "../extension";

extension.on("rateLimited", (rateLimitData) => {
  extension.statusBar.setRateLimited(true);
  setTimeout(() => {
    extension.statusBar.setRateLimited(false);
  }, rateLimitData.time);
});