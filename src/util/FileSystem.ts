import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { FileType, Uri, commands, env, workspace } from "vscode";

export const blockedFiles = {
  common: [".cache", ".git", ".vscode"],
  go: [],
  js: ["node_modules", ".npm", "package-lock.json", "yarn.lock"],
  py: ["venv"],
  rb: ["Gemfile.lock"],
  rs: ["Cargo.lock", "target"],
  ts: ["node_modules", ".npm", "package-lock.json", "yarn.lock"],
};

export const allBlockedFiles = Array.from(new Set(Object.values(blockedFiles).flat()));

export const allBlockedFilesIgnorePattern = `{${allBlockedFiles.join(",")}}`;

export interface FileSystemOptions {
  fileNames?: string[]
  ignoreFile?: string
  ignoreList?: string[]
}

export class FileSystem {
  declare ignoreFile?: string;
  ignoreList: string[] = allBlockedFiles;
  ignorePattern: string = allBlockedFilesIgnorePattern;
  patterns: string[] = ["**"];
  found: Uri[] = [];
  foundPath: string[] = [];

  constructor(public options: FileSystemOptions = {}) {
    if (!options) options = {};

    if (options.fileNames?.length) {
      this.patterns = Array.from(new Set(FileSystem.transformFileListToGlobPatterns(options.fileNames)));
    }

    if (options.ignoreFile) this.ignoreFile = options.ignoreFile;

    if (options.ignoreList?.length)
      this.ignoreList = Array.from(new Set(this.ignoreList.concat(options.ignoreList)));
  }

  async findFiles(readSelectedPath = false) {
    await this.#findIgnoreFile();
    if (readSelectedPath)
      await this.#readSelectedPath();

    const promises = this.patterns.flatMap((pattern) => {
      if (pattern === "**") {
        return workspace.findFiles(pattern, this.ignorePattern);
      }

      return [
        workspace.findFiles(join("**", pattern), this.ignorePattern),
        workspace.findFiles(join(pattern, "**"), this.ignorePattern),
      ];
    });

    const uris = await Promise.all(promises)
      .then(values => values.flat());

    this.foundPath = uris.map(uri => uri.fsPath);

    return this.found = uris;
  }

  async #findIgnoreFile() {
    if (!this.ignoreFile) return [];

    const patterns = await FileSystem.findIgnoreFile(this.ignoreFile, this.ignorePattern);

    this.ignoreList = Array.from(new Set(this.ignoreList.concat(patterns)));

    this.ignorePattern = `{${this.ignoreList.join(",")}}`;
  }

  async #readSelectedPath() {
    const files = FileSystem.transformFileListToGlobPatterns(await FileSystem.readSelectedPath(true));

    if (this.options.fileNames?.length) {
      this.patterns = Array.from(new Set(this.patterns.concat(files)));
    } else {
      this.patterns = files;
    }
  }

  static async findIgnoreFile(fileName: string, ignoreList: string | string[]) {
    if (!ignoreList) ignoreList = allBlockedFilesIgnorePattern;

    if (Array.isArray(ignoreList)) {
      ignoreList = `{${ignoreList.join(",")}}`;
    }

    const files = await workspace.findFiles(join("**", fileName), ignoreList);

    const patterns = await Promise.all(files.map(async (f) => {
      const stat = await workspace.fs.stat(f);

      if (stat.type !== FileType.File) return [];

      const fileBuffer = await workspace.fs.readFile(f);

      const text = fileBuffer.toString();

      return text
        .replace(/([\r\n]*\s*#.*)/g, "")
        .split(/([\r\n]+)/);
    }))
      .then(values => Array.from(new Set(values.flat())))
      .then(values => values.filter(a => a))
      .then(values => values.flatMap(value => [value, join("**", value)]));

    return patterns;
  }

  static async readSelectedPath(relative = true) {
    await commands.executeCommand(relative ? "copyRelativeFilePath" : "copyFilePath");
    const copied = await env.clipboard.readText();
    return copied.split(/[\r\n]+/g);
  }

  static transformFileListToGlobPatterns(fileNames: string[]) {
    return fileNames.map(file => existsSync(file) && statSync(file).isDirectory() ? join(file, "**") : file);
  }
}

export default FileSystem;
