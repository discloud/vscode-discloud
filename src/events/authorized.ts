import extension from "../extension";

extension.on("authorized", async (token, isWorkspace) => {
  if (isWorkspace)
    await extension.config.update("token", undefined);

  extension.config.update("token", token, true);

  extension.logger.info("Authorized");

  extension.statusBar.setUpload();
});