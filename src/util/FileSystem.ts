import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { FileType, Uri, commands, env, workspace } from "vscode";
import { logger } from "../extension";
import { ALL_BLOCKED_FILES } from "./constants";

export const ALL_BLOCKED_FILES_IGNORE_PATTERN = `{${ALL_BLOCKED_FILES.join(",")}}`;

export interface FileSystemOptions {
  fileNames?: string[]
  ignoreFile?: string
  ignoreList?: string[]
}

export class FileSystem {
  declare readonly ignoreFile?: string;
  readonly ignoreList = new Set(ALL_BLOCKED_FILES);
  ignorePattern: string = ALL_BLOCKED_FILES_IGNORE_PATTERN;
  readonly patterns = new Set("**");
  found: Uri[] = [];

  constructor(public options: FileSystemOptions = {}) {
    if (!options) options = {};

    if (options.fileNames?.length) {
      this.patterns.clear();

      for (const filename of options.fileNames) {
        this.patterns.add(filename);
      };
    }

    if (options.ignoreFile) this.ignoreFile = options.ignoreFile;

    if (options.ignoreList?.length) {
      for (const ignore of options.ignoreList) {
        this.ignoreList.add(ignore);
      }
      this.ignorePattern = `{${Array.from(this.ignoreList).join(",")}}`;
    }
  }

  async findFiles(readSelectedPath = false) {
    await this.#findIgnoreFile();
    if (readSelectedPath)
      await this.#readSelectedPath();

    const promises = Array.from(this.patterns).flatMap((pattern) => [
      workspace.findFiles(pattern, this.ignorePattern), // search a single file
      workspace.findFiles(join(pattern, "**"), this.ignorePattern), // recursively search the directory
    ]);

    this.found = await Promise.all(promises)
      .then(values => values.flat());

    return this.found;
  }

  async #findIgnoreFile() {
    if (!this.ignoreFile) return;

    const patterns = await FileSystem.findIgnoreFile(this.ignoreFile, this.ignorePattern);

    for (const pattern of patterns) {
      this.ignoreList.add(pattern);
    }

    this.ignorePattern = `{${Array.from(this.ignoreList).join(",")}}`;
  }

  async #readSelectedPath() {
    const files = FileSystem.transformFileListToGlobPatterns(await FileSystem.readSelectedPath(true));

    for (const file of files) {
      this.patterns.add(file);
    }
  }

  static async findIgnoreFile(fileName: string, ignoreList: string | string[] | Set<string>) {
    if (!ignoreList) ignoreList = ALL_BLOCKED_FILES_IGNORE_PATTERN;

    if (ignoreList instanceof Set) ignoreList = Array.from(ignoreList);

    if (Array.isArray(ignoreList)) ignoreList = `{${ignoreList.join(",")}}`;

    const files = await workspace.findFiles(join("**", fileName), ignoreList);

    return await Promise.all(files.map(async (f) => {
      const stat = await workspace.fs.stat(f);

      if (stat.type !== FileType.File) return [];

      const fileBuffer = await workspace.fs.readFile(f);

      return fileBuffer.toString()
        .replace(/([\r\n]*\s*#.*)/g, "")
        .split(/([\r\n]+)/);
    }))
      .then(values => Array.from(new Set(values.flat())))
      .then(values => values.filter(Boolean))
      .then(values => values.flatMap(value => [value, join("**", value)]));
  }

  /**
   * @param {boolean} relative
   * @default true
   */
  static async readSelectedPath(relative: boolean = true) {
    await commands.executeCommand(relative ? "copyRelativeFilePath" : "copyFilePath");
    const copied = await env.clipboard.readText();
    logger.info("File names:", copied);
    return copied.split(/[\r\n]+/);
  }

  static transformFileListToGlobPatterns(fileNames: string[]) {
    return fileNames.map(file => existsSync(file) && statSync(file).isDirectory() ? join(file, "**") : file);
  }
}

export default FileSystem;
