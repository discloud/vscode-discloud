import { type Archiver, type ArchiverOptions, create, type Format } from "archiver";
import { createWriteStream, existsSync, rmSync, type Stats, statSync, unlinkSync, writeFileSync, type WriteStream } from "fs";
import { relative } from "path";
import { type Uri, workspace } from "vscode";
import { logger } from "../extension";

export interface AppendOptions {
  zipEmptyDirs: boolean
}

export interface UriData {
  name: string
  stats: Stats
}

export class Zip {
  declare readonly stream: WriteStream;
  declare readonly zip: Archiver;

  constructor(readonly file: string, readonly format: Format = "zip", readonly options: ArchiverOptions = {}) {
    if (existsSync(file)) try { rmSync(file); } catch { }
    this.zip = create(format, options);
    writeFileSync(file, "");
    this.stream = createWriteStream(file);
    this.zip.pipe(this.stream);
  }

  getUriData(uri: Uri): UriData | void {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) return;

    const name = relative(workspaceFolder.uri.fsPath, uri.fsPath);
    if (!name) return;

    const stats = statSync(uri.fsPath);

    return { name, stats };
  }

  appendUriList(uriList: Uri[], options?: Partial<AppendOptions>) {
    if (!uriList?.length) return;

    options ??= {};
    options.zipEmptyDirs ??= true;

    const zipped = new Set<string>();

    for (const uri of uriList) {
      if (zipped.has(uri.fsPath) || !existsSync(uri.fsPath)) continue;

      const uriData = this.getUriData(uri);
      if (!uriData) continue;

      const { name, stats } = uriData;

      zipped.add(uri.fsPath);

      if (stats.isFile()) {
        this.zip.file(uri.fsPath, { name, stats });
      } else if (stats.isDirectory() && options.zipEmptyDirs) {
        this.zip.directory(uri.fsPath, false);
      }
    }

    logger.info("Zip:", [...zipped]);
  }

  destroy() {
    try { this.zip.destroy(); } catch { }
    try { this.stream.destroy(); } catch { }
    try { unlinkSync(this.file); } catch { }
    try { rmSync(this.file); } catch { }
  }

  async finalize() {
    return await this.zip.finalize().then(() => true);
  }
}
