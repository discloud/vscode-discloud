import extension from "../extension";

extension.on("authorized", () => {
  extension.logger.info("Authorized");
  extension.statusBar.setUpload();
});