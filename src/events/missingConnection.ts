import core from "../extension";

core.on("missingConnection", async function () {
  core.statusBar.reset();
});
