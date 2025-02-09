import { join } from "path";
import { type CancellationToken, FileType, type Uri, commands, env, workspace } from "vscode";
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
  readonly patterns = new Set("**");
  readonly found: Uri[] = [];

  constructor(readonly options: FileSystemOptions = {}) {
    if (!options) options = {};

    if (options.fileNames?.length) {
      this.patterns.clear();

      for (const filename of options.fileNames) {
        this.patterns.add(filename);
      }
    }

    if (typeof options.ignoreFile === "string") this.ignoreFile = options.ignoreFile;

    if (options.ignoreList?.length) {
      for (const ignore of options.ignoreList) {
        this.ignoreList.add(ignore);
      }
    }
  }

  get ignorePattern() {
    return `{${Array.from(this.ignoreList)}}`;
  }

  findFiles(): Promise<Uri[]>
  findFiles(readSelectedPath: boolean): Promise<Uri[]>
  findFiles(token: CancellationToken, readSelectedPath?: boolean): Promise<Uri[]>
  async findFiles(token?: CancellationToken | boolean, readSelectedPath?: boolean) {
    if (typeof token === "boolean") [readSelectedPath, token] = [token, undefined];

    await this.#findIgnoreFile();
    if (readSelectedPath) await this.#readSelectedPath();

    const ignorePattern = this.ignorePattern;

    const promises = [];
    for (const pattern of this.patterns) {
      promises.push(
        workspace.findFiles(pattern, ignorePattern, undefined, token), // search a single file
        workspace.findFiles(join(pattern, "**"), ignorePattern, undefined, token), // recursively search the directory
      );
    }

    // @ts-expect-error ts(2540)
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
  }

  async #readSelectedPath() {
    const files = await FileSystem.readSelectedPath(true);

    for (const file of files) {
      this.patterns.add(file);
    }
  }

  static async findIgnoreFile(fileName: string, ignoreList?: string | string[] | Set<string>) {
    if (!ignoreList) ignoreList = ALL_BLOCKED_FILES_IGNORE_PATTERN;

    if (ignoreList instanceof Set) ignoreList = Array.from(ignoreList);

    if (Array.isArray(ignoreList)) ignoreList = `{${ignoreList}}`;

    const files = await workspace.findFiles(join("**", fileName), ignoreList);

    return await Promise.all(files.map(async (f) => {
      const stat = await workspace.fs.stat(f);

      if (stat.type !== FileType.File || !stat.size) return [];

      const fileBuffer = await workspace.fs.readFile(f);

      return fileBuffer.toString()
        .replace(/[\r\n]*\s*#.*/g, "")
        .split(/[\r\n]+/);
    }))
      .then(values => Array.from(new Set(values.flat())))
      .then(values => values.filter(Boolean))
      .then(values => values.map(value => value.replace(/(^[/\\]|[/\\]$)/g, "")));
  }


  static readSelectedPath(relative?: true): Promise<string[]>
  static readSelectedPath(relative: boolean): Promise<string[]>
  static async readSelectedPath(relative: boolean = true) {
    await commands.executeCommand(relative ? "copyRelativeFilePath" : "copyFilePath");
    const copied = await env.clipboard.readText();
    logger.info("File names:", copied);
    return copied.split(/[\r\n]+/);
  }
}

export default FileSystem;
