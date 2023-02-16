import extension from "../extension";

extension.on("authorized", () => {
  extension.statusBar.setUpload();
});