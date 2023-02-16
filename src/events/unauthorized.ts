import extension from "../extension";

extension.on("unauthorized", () => {
  extension.statusBar.setLogin();
});