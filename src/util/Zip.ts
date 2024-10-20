import { type Archiver, type ArchiverOptions, create } from "archiver";
import { type Stats, type WriteStream, createWriteStream, existsSync, rmSync, statSync, unlinkSync, writeFileSync } from "fs";
import { isAbsolute, join, relative } from "path";
import { type Uri, workspace } from "vscode";
import { logger } from "../extension";

export interface AppendOptions {
  rootDir: string
  zipEmptyDirs: boolean
}

export interface UriData {
  name: string
  stats: Stats
}

export class Zip {
  declare readonly stream: WriteStream;
  declare readonly zip: Archiver;

  constructor(public file: string, format = "zip", public options: ArchiverOptions = {}) {
    if (existsSync(file)) try { rmSync(file); } catch { }
    this.zip = create(format, options);
    writeFileSync(file, "");
    this.stream = createWriteStream(file);
    this.zip.pipe(this.stream);
  }

  getUriData(uri: Uri, rootDir?: string): UriData | void {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) return;

    rootDir ??= "";
    if (isAbsolute(rootDir)) rootDir = relative(workspaceFolder.uri.fsPath, rootDir);

    const name = relative(join(workspaceFolder.uri.fsPath, rootDir), uri.fsPath);
    if (!name) return;

    const stats = statSync(uri.fsPath);

    return { name, stats };
  }

  appendUriList(uriList: Uri[], options?: Partial<AppendOptions>) {
    if (!uriList?.length) return;

    options ??= {};
    options.zipEmptyDirs ??= true;

    const zipped: string[] = [];

    for (const uri of uriList) {
      if (zipped.includes(uri.fsPath) || !existsSync(uri.fsPath)) continue;

      const uriData = this.getUriData(uri, options.rootDir);
      if (!uriData) continue;

      const { name, stats } = uriData;

      zipped.push(uri.fsPath);

      if (stats.isFile()) {
        this.zip.file(uri.fsPath, { name, stats });
      } else if (stats.isDirectory() && options.zipEmptyDirs) {
        this.zip.directory(uri.fsPath, false);
      }
    }

    logger.info("Zip:", zipped);
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
    return await this.zip.finalize().then(() => true);
  }
}
