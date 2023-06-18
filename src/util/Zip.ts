import { Archiver, ArchiverOptions, create } from "archiver";
import { WriteStream, createWriteStream, existsSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";

export class Zip {
  declare stream: WriteStream;
  declare zip: Archiver;

  constructor(public file: string, format = "zip", public options: ArchiverOptions = {}) {
    if (existsSync(file)) try { rmSync(file); } catch { };
    this.#create(file, format, options);
  }

  #create(file = this.file, format = "zip", options = this.options) {
    this.zip = create(format, options);
    writeFileSync(file, "");
    this.stream = createWriteStream(file);
    this.zip.pipe(this.stream);
  }

  appendFileList(fileList: string[], targetPath: string, zipEmptyDirs?: boolean) {
    if (!fileList?.length) return;

    for (const file of fileList) {
      if (file.length === targetPath.length) continue;

      let fileName = file;

      if (file.length > targetPath.length)
        fileName = file.slice(targetPath.length, fileName.length);

      const name = fileName.replace(/\\/g, "/").replace(/^\//, "");

      if (!name) continue;

      if (existsSync(file))
        if (statSync(file).isFile()) {
          this.zip.file(file, { name });
        } else if (statSync(file).isDirectory() && zipEmptyDirs) {
          this.zip.file(file, { name });
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
