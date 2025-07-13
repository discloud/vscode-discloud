import AdmZip from "adm-zip";
import { FileType, type Uri, workspace } from "vscode";

export default class Zip {
  declare readonly zip: AdmZip;

  constructor(fileNameOrRawData?: string | Buffer, options?: Partial<AdmZip.InitOptions>) {
    this.zip = new AdmZip(fileNameOrRawData, options);
  }

  async appendUriList(uriList: Uri[]) {
    if (!uriList?.length) return;

    const zipped = new Set<string>();

    for (const uri of uriList) {
      if (zipped.has(uri.fsPath)) continue;

      const name = workspace.asRelativePath(uri.fsPath, false);
      if (!name) continue;

      let stats;
      try { stats = await workspace.fs.stat(uri); }
      catch { continue; }

      if (stats.type !== FileType.File) continue;

      zipped.add(uri.fsPath);

      const arrayBuffer = await workspace.fs.readFile(uri);

      const buffer = Buffer.from(arrayBuffer);

      this.zip.addFile(name, buffer);
    }
  }

  getBuffer() {
    return this.zip.toBufferPromise();
  }

  writeZip(targetFileName?: string) {
    return this.zip.writeZipPromise(targetFileName, { overwrite: true });
  }
}
