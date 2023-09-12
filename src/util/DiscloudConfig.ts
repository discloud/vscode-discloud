import { DiscloudConfigType } from "@discloudapp/api-types/v2";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const discloudConfigRequiredScopes = {
  bot: ["MAIN", "NAME", "TYPE", "RAM", "VERSION"],
  site: ["ID", "MAIN", "TYPE", "RAM", "VERSION"],
  common: ["MAIN", "TYPE", "RAM", "VERSION"],
};

export class DiscloudConfig {
  constructor(public path: string) {
    try {
      if (this.exists === "file") {
        if (this.path.endsWith("discloud.config")) return;

        this.path = dirname(this.path);
      }

      this.path = join(this.path, "discloud.config");
    } catch { }
  }

  get comments() {
    try {
      return readFileSync(this.path, "utf8")
        ?.split(/\r?\n/)
        .filter(a => /^\s*#/.test(a)) ?? [];
    } catch {
      return [];
    }
  }

  get data(): DiscloudConfigType {
    try {
      return this.#configToObj(readFileSync(this.path, "utf8")!);
    } catch (error) {
      return <any>{};
    }
  }

  get exists() {
    if (existsSync(this.path)) {
      const stats = statSync(this.path);

      if (stats.isFile()) return "file";

      if (stats.isDirectory()) return "dir";
    }

    return false;
  }

  get existsMain() {
    if (existsSync(this.data.MAIN)) {
      const stats = statSync(this.data.MAIN);

      if (stats.isFile()) return "file";

      if (stats.isDirectory()) return "dir";
    }

    return false;
  }

  get fileExt() {
    return this.data.MAIN?.split(".").pop();
  }

  get missingProps() {
    return this.#requiredProps
      .filter(key => !this.data[<keyof DiscloudConfigType>key]);
  }

  get #requiredProps() {
    return discloudConfigRequiredScopes[this.data.TYPE] ??
      discloudConfigRequiredScopes.common;
  }

  #objToString(obj: any): string {
    if (obj === null || obj === undefined) return "";
    if (typeof obj === "function") return this.#configToObj(obj());
    if (!obj) return `${obj}`;

    const result = [];

    if (typeof obj === "object") {
      if (Array.isArray(obj)) {
        for (const value of obj)
          result.push(this.#objToString(value));
      } else {
        const keys = Object.keys(obj);

        for (const key of keys)
          result.push(`${key}=${this.#objToString(obj[key])}`);
      }
    } else {
      result.push(obj);
    }

    return result.filter(Boolean).join("\n");
  }

  #configToObj(s: string) {
    if (typeof s !== "string") return {};

    return this.#processValues(Object.fromEntries(s
      .replace(/\s*#.*/g, "")
      .split(/[\r\n]/)
      .filter(Boolean)
      .map(line => line.split("="))));
  }

  #processValues(obj: any) {
    if (!obj) return obj;

    const keys = Object.keys(obj);

    for (const key of keys) {
      if (["APT", "AVATAR", "ID", "MAIN", "NAME", "TYPE", "VERSION"].includes(key)) continue;

      const value = obj[key];

      if (!isNaN(Number(value))) {
        obj[key] = Number(value);
        continue;
      }

      if (["true", "false"].includes(obj[key])) {
        // eslint-disable-next-line eqeqeq
        obj[key] = value == "true";
        continue;
      }
    }

    return obj;
  }

  get<K extends keyof DiscloudConfigType>(key: K): DiscloudConfigType[K] {
    return this.data[key];
  }

  set<K extends keyof DiscloudConfigType>(key: K, value: DiscloudConfigType[K]) {
    this.update({ [key]: value });
  }

  update(save: Partial<DiscloudConfigType>, comments: string[] = this.comments): Error | void {
    try {
      save = Object.assign(this.data, save);

      writeFileSync(this.path, this.#objToString(
        comments?.length ?
          [comments, save] :
          save,
      ), "utf8");
    } catch (error) {
      return error as Error;
    }
  }
}
