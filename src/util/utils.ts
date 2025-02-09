import { join } from "path";
import { type TreeItem, Uri } from "vscode";
import extension from "../extension";
import { FILE_EXT_REGEXP } from "./regexp";

export function bindFunctions<I extends Record<any, any>, B extends I | unknown>(instance: I, bind: B): void;
export function bindFunctions<I extends Record<any, any>>(instance: I): void;
export function bindFunctions(instance: Record<any, any>, bind?: Record<any, any>) {
  if (!instance) return;

  bind ??= instance;

  for (const propertyName of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
    try {
      if (typeof instance[propertyName] === "function")
        bind[propertyName] = instance[propertyName].bind(bind);
    } catch {
      continue;
    }
  }
}

export function calculatePercentage(value: string | number, major: string | number) {
  return Number(value) / Number(major) * 100;
}

export function getIconPath(iconName: string, iconExt = "svg"): TreeItem["iconPath"] {
  return {
    dark: Uri.file(extension.context.asAbsolutePath(join("resources", "dark", `${iconName}.${iconExt}`))),
    light: Uri.file(extension.context.asAbsolutePath(join("resources", "light", `${iconName}.${iconExt}`))),
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

export function JSONparse<T extends any[] | Record<any, any>>(s: string) {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function replaceFileExtension(file: string, replacement = "") {
  return file.replace(FILE_EXT_REGEXP, replacement);
}
