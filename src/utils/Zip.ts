import AdmZip from "adm-zip";
import { FileType, workspace, type Uri } from "vscode";

export default class Zip {
  constructor(fileNameOrRawData?: string | Buffer, options?: Partial<AdmZip.InitOptions>) {
    this.#zip = new AdmZip(fileNameOrRawData, options);
  }

  readonly #zip: AdmZip;
  readonly #zipped = new Set<string>();

  async appendUriList(uriList: Uri[]) {
    if (!uriList?.length) return;

    for (const uri of uriList) {
      const uriText = uri.toString();
      if (this.#zipped.has(uriText)) continue;
      this.#zipped.add(uriText);

      const filename = workspace.asRelativePath(uri, false);
      if (!filename) continue;

      let fileStat;
      try { fileStat = await workspace.fs.stat(uri); }
      catch { continue; }

      if (fileStat.type !== FileType.File) continue;

      const arrayBuffer = await workspace.fs.readFile(uri);

      const buffer = Buffer.from(arrayBuffer);

      this.#zip.addFile(filename, buffer);
    }
  }

  getBuffer() {
    return this.#zip.toBufferPromise();
  }

  writeZip(targetFileName?: string) {
    return this.#zip.writeZipPromise(targetFileName, { overwrite: true });
  }
}
