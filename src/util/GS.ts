import { IgnoreFiles } from "discloud.app";
import { GlobSync } from "glob";
import { statSync } from "node:fs";
import { blocked_files } from "./constants";

export class GS {
  found: string[] = [];
  ignore: IgnoreFiles;

  constructor(public path: string, ignoreFileName?: string, ignore: string[] = []) {
    this.ignore = new IgnoreFiles({
      fileName: ignoreFileName!,
      path,
      optionalIgnoreList: ignore,
    });

    this.path = this.#normalizePath(path);

    this.found = new GlobSync(this.path, {
      dot: true,
      ignore: this.ignore.list.concat(this.#getDiscloudIgnore()),
    }).found;
  }

  #getDiscloudIgnore(path = this.path) {
    return [...new Set(Object.values(blocked_files).flat())]
      .map(a => [a, `${a}/**`, `**/${a}`, `**/${a}/**`, `${path}/${a}`, `${path}/${a}/**`]).flat();
  }

  #normalizePath(path: string) {
    path = path.replace(/^(\.|~)$|^(\.|~)\/|^\/|\/$/g, "") || "**";
    path = statSync(path).isDirectory() ? path + "/**" : path;
    return path;
  }
}

export default GS;