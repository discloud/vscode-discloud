import { Archiver, ArchiverOptions, create } from "archiver";
import { WriteStream, createWriteStream, existsSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { isAbsolute } from "node:path";

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

      const name = fileName.replace(/\\/g, "/").replace(/^\//, "");
      
      if (!name) continue;
      
      const fileStats = statSync(file);

      if (fileStats.isFile()) {
        this.zip.file(file, { name });
      } else if (fileStats.isDirectory() && zipEmptyDirs) {
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
