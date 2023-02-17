import { Archiver, ArchiverOptions, create } from "archiver";
import { createWriteStream, existsSync, rmSync, statSync, unlinkSync, writeFileSync, WriteStream } from "node:fs";

export class Zip {
  stream!: WriteStream;
  zip!: Archiver;

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

  appendFileList(fileList: string[], targetPath: string) {
    if (!fileList?.length) return;

    const targetRegex = RegExp(`${targetPath}\\/?`, "i");

    for (const file of fileList) {
      const name = file.replace(targetRegex, "");

      if (existsSync(file))
        if (statSync(file).isFile())
          this.zip.file(file, { name });
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