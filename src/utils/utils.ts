import { join } from "path";
import { type TreeItem, Uri } from "vscode";
import core from "../extension";
import { RESOURCES_DIR } from "./constants";

export function getIconPath(iconName: string, iconExt = "svg"): TreeItem["iconPath"] {
  return {
    dark: Uri.file(core.context.asAbsolutePath(join(RESOURCES_DIR, "dark", `${iconName}.${iconExt}`))),
    light: Uri.file(core.context.asAbsolutePath(join(RESOURCES_DIR, "light", `${iconName}.${iconExt}`))),
  };
}

export function compareBooleans(a: boolean, b: boolean) {
  let i = 0;
  if (a) i--;
  if (b) i++;
  return i;
}

export function compareNumbers(a: number, b: number) {
  let i = 0;
  if (!isNaN(a)) i -= a;
  if (!isNaN(b)) i += b;
  return i;
}

export function getIconName(data: any) {
  if ("online" in data) {
    return data.online ? "on" :
      data.ramKilled ? "ramKilled" :
        data.exitCode === 1 ? "errorCode" :
          "off";
  }

  if ("container" in data) {
    return data.container === "Online" ? "on" :
      data.ramKilled ? "ramKilled" :
        data.exitCode === 1 ? "errorCode" :
          "off";
  }
}

type StringCamelify<S, Sep extends string> =
  S extends `${infer P1}${Sep}${infer P2}${infer P3}`
  ? `${P1}${Uppercase<P2>}${StringCamelify<P3, Sep>}`
  : S;

type Config<T, Sep extends string> =
  T extends Array<infer U>
  ? { [K in U as StringCamelify<string & K, Sep>]: K }
  : T extends ReadonlyArray<infer U>
  ? { [K in U as StringCamelify<string & K, Sep>]: K }
  : T

const defaultSeparator = "." as const;

export function makeCamelizedPair<
  T extends ReadonlyArray<string>,
  Sep extends string = typeof defaultSeparator
>(keys: T, sep: Sep = defaultSeparator as Sep): Config<T, Sep> {
  const configObj: any = {};

  if (!Array.isArray(keys)) return configObj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as string;
    configObj[key.replace(RegExp(`[${sep}](\\w)`, "g"), (_, a) => a.toUpperCase())] = key;
  }

  return configObj;
}
