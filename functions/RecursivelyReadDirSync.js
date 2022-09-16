// @ts-nocheck
const { existsSync, readdirSync, readFileSync, statSync } = require("node:fs");

class RecursivelyReadDirSync {
  /**
   * @type {string[]}
   */
  cache = [];

  /**
   * @type {string[]}
   */
  found = [];

  /**
   * @param {string} path 
   * @param {FileSystemOptions} [options] 
   */
  constructor(path, options) {
    /**
     * @type {string}
     */
    this.path = path = path.replace(/\\/g, "/").replace(/\/$/, "");

    /**
     * @type {FileSystemOptions}
     */
    this.options = options ??= {};

    if (!existsSync(path) || !statSync(path).isDirectory()) {
      if (!this.options.pattern)
        this.options.pattern = options.pattern = [];

      this.options.pattern.push(this.#formatRegExp(path));

      this.path = path = path.replace(/\/?[^\\/]+$/, "");
    }

    this.#recursivelyReadDirSync(this.path);

    this.found = this.cache;

    if (this.options.ignoreFile) this.#resolveIgnoreFile(this.options.ignoreFile);
    if (this.options.pattern) this.#resolvePattern(this.options.pattern);
    if (this.options.ignore) {
      this.options.ignore = this.#formatRegExp(this.options.ignore);

      this.#resolveIgnore(this.options.ignore);
    }
  }

  #formatRegExp(pattern) {
    if (Array.isArray(pattern)) {
      for (let i = 0; i < pattern.length; i++)
        pattern[i] = this.#formatRegExp(pattern[i]);

      return pattern;
    }

    return pattern
      .replace(/\\/g, "/")
      .replace(/\/$/, "")
      .replace(/\./g, "\\.")
      .replace(/\*+/g, (str) => str.length > 1 ? ".*" : "[^\\/]*") +
      "(/.*)?$";
  }

  /**
   * @param {string|string[]} ignore
   */
  #resolveIgnore(ignore) {
    if (Array.isArray(ignore)) {
      for (let i = 0; i < ignore.length; i++)
        this.#resolveIgnore(ignore[i]);

      return;
    }

    this.found = this.found.filter(file => !RegExp(ignore).test(file));
  }

  /**
   * @param {string|string[]} ignoreFile
   */
  #resolveIgnoreFile(ignoreFile) {
    if (Array.isArray(ignoreFile)) {
      for (let i = 0; i < ignoreFile.length; i++)
        this.#resolveIgnoreFile(ignoreFile[i]);

      return;
    }

    if (existsSync(ignoreFile))
      this.options.ignore = [
        ...(this.options.ignore ?? []),
        ...readFileSync(ignoreFile, "utf8")
          .replace(/#[^\r?\n]+/g, "")
          .split(/\r?\n/)
          .filter(a => a),
      ];
  }

  /**
   * @param {string|string[]} pattern
   */
  #resolvePattern(pattern) {
    if (Array.isArray(pattern)) {
      for (let i = 0; i < pattern.length; i++)
        this.#resolvePattern(pattern[i]);

      return;
    }

    this.found = this.found.filter(file => RegExp(pattern).test(file));
  }

  /**
   * @param {string} path 
   */
  #recursivelyReadDirSync(path) {
    const files = readdirSync(path, { withFileTypes: true });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.isDirectory()) {
        this.#recursivelyReadDirSync(`${path}/${file.name}`);
      } else {
        this.cache.push(`${path}/${file.name}`);
      }
    }
  }
}

module.exports = { RecursivelyReadDirSync };

/**
 * @typedef FileSystemOptions
 * @property {string[]} [ignore]
 * @property {string|string[]} [ignoreFile]
 * @property {string[]} [pattern]
 */