import { dirname, join } from "path";
import { type CancellationToken, FileType, type Uri, commands, env, workspace } from "vscode";
import { BLOCKED_FILES } from "./constants";
import lazy from "./lazy";

const lazyDefaultBlockedFiles = lazy(() => Array.from(new Set(Object.values(BLOCKED_FILES).flat())));
const lazyDefaultBlockedFilesPattern = lazy(() => `{${lazyDefaultBlockedFiles().join(",")}}`);

export interface FileSystemOptions {
  cwd?: string
  fileNames?: string[]
  ignoreFile?: string
  ignoreList?: string[]
}

export default class FileSystem {
  declare readonly ignoreFile?: string;
  readonly ignoreList = new Set<string>(lazyDefaultBlockedFiles());
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

    await this.#findIgnoreFile(token);
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

    if (this.options.cwd) {
      // @ts-expect-error ts(2540)
      this.found = this.found.filter((value) => value.fsPath.startsWith(this.options.cwd!));
    }

    return this.found;
  }

  async #findIgnoreFile(token?: CancellationToken) {
    if (!this.ignoreFile) return;

    const patterns = await FileSystem.findIgnoreFile(this.ignoreFile, this.ignorePattern, token);

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

  static async findIgnoreFile(filename: string, ignoreList?: string | string[] | Set<string>, token?: CancellationToken) {
    if (!ignoreList) ignoreList = lazyDefaultBlockedFilesPattern();

    if (ignoreList instanceof Set) ignoreList = Array.from(ignoreList);

    if (Array.isArray(ignoreList)) ignoreList = `{${ignoreList}}`;

    const files = await workspace.findFiles(join("**", filename), ignoreList, undefined, token);

    const result = new Set<string>();

    for (const file of files) {
      const stat = await workspace.fs.stat(file);

      if (stat.type !== FileType.File || !stat.size) return [];

      const relativeFolder = dirname(workspace.asRelativePath(file, false));

      const fileBuffer = await workspace.fs.readFile(file);

      const patterns = fileBuffer.toString()
        .replace(/\s*#.*/g, "")
        .split(/[\r\n]+/);

      for (const pattern of patterns) {
        result.add(join(relativeFolder, pattern));
      }
    }

    return Array.from(result);
  }

  static readSelectedPath(relative?: true): Promise<string[]>
  static readSelectedPath(relative: boolean): Promise<string[]>
  static async readSelectedPath(relative: boolean = true) {
    await commands.executeCommand(relative ? "copyRelativeFilePath" : "copyFilePath");
    const copied = await env.clipboard.readText();
    return copied.split(/[\r\n]+/);
  }
}
