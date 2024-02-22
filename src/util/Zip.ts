import { Archiver, ArchiverOptions, create } from "archiver";
import { WriteStream, createWriteStream, existsSync, rmSync, statSync, unlinkSync, writeFileSync } from "fs";
import { isAbsolute, relative } from "path";
import { Uri, workspace } from "vscode";
import { logger } from "../extension";

export class Zip {
  declare readonly stream: WriteStream;
  declare readonly zip: Archiver;

  constructor(public file: string, format = "zip", public options: ArchiverOptions = {}) {
    if (existsSync(file)) try { rmSync(file); } catch { };
    this.zip = create(format, options);
    writeFileSync(file, "");
    this.stream = createWriteStream(file);
    this.zip.pipe(this.stream);
  }

  appendUriList(uriList: Uri[], zipEmptyDirs = true) {
    if (!uriList?.length) return;

    const zipped: string[] = [];

    for (const uri of uriList) {
      if (zipped.includes(uri.fsPath)) continue;

      if (!existsSync(uri.fsPath)) continue;

      const workspaceFolder = workspace.getWorkspaceFolder(uri);

      if (!workspaceFolder) continue;

      const name = relative(workspaceFolder.uri.fsPath, uri.fsPath);

      if (!name) continue;

      zipped.push(uri.fsPath);

      const stats = statSync(uri.fsPath);

      if (stats.isFile()) {
        this.zip.file(uri.fsPath, { name, stats });
      } else if (stats.isDirectory() && zipEmptyDirs) {
        this.zip.directory(uri.fsPath, false);
      }
    }

    logger.info("Zip:", zipped);
  }

  appendFileList(fileList: string[], targetPath: string, zipEmptyDirs?: boolean) {
    if (!fileList?.length) return;

    const targetPathIsAbsolute = isAbsolute(targetPath);

    for (const file of fileList) {
      if (!existsSync(file)) continue;

      let fileName = file;

      const fileIsAbsolute = isAbsolute(file);

      if (fileIsAbsolute && targetPathIsAbsolute) {
        if (file.length === targetPath.length) continue;

        if (file.length > targetPath.length)
          fileName = file.slice(targetPath.length, file.length);
      }

      const name = fileName.replace(/^[\\/]/, "");

      if (!name) continue;

      const stats = statSync(file);

      if (stats.isFile()) {
        this.zip.file(file, { name, stats });
      } else if (stats.isDirectory() && zipEmptyDirs) {
        this.zip.file(file, { name, stats });
      }
    }
  }

  destroy() {
    try {
      this.zip.destroy();
      this.stream.destroy();
      unlinkSync(this.file);
      rmSync(this.file);
    } catch { }
  }

  async finalize() {
    return this.zip.finalize().then(() => true);
  }
};

export default Zip;
