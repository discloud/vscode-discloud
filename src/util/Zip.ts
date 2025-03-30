import AdmZip from "adm-zip";
import { existsSync } from "fs";
import { FileType, type Uri, workspace } from "vscode";
import extension from "../extension";

export default class Zip {
  declare readonly zip: AdmZip;

  constructor(fileNameOrRawData?: string | Buffer, options?: Partial<AdmZip.InitOptions>) {
    this.zip = new AdmZip(fileNameOrRawData, options);
  }

  async appendUriList(uriList: Uri[]) {
    if (!uriList?.length) return;

    const zipped = new Set<string>();

    for (const uri of uriList) {
      if (zipped.has(uri.fsPath) || !existsSync(uri.fsPath)) continue;

      const name = workspace.asRelativePath(uri.fsPath, false);
      if (!name) continue;

      let stats;
      try { stats = await workspace.fs.stat(uri); } catch { continue; }

      zipped.add(name);

      if (stats.type === FileType.File)
        this.zip.addLocalFile(uri.fsPath, void 0, name);
    }

    extension.debug("Zip:", [...zipped]);
  }

  getBuffer() {
    return this.zip.toBuffer();
  }

  writeZip(targetFileName?: string) {
    return this.zip.writeZipPromise(targetFileName, { overwrite: true });
  }
}
