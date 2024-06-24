import { join } from "path";
import { Uri } from "vscode";

export function bindFunctions<I extends Record<any, any>, B extends I | unknown>(instance: I, bind: B): void;
export function bindFunctions<I extends Record<any, any>>(instance: I): void;
export function bindFunctions(instance: Record<any, any>, bind?: Record<any, any>) {
  if (!instance) return;

  for (const propertyName of Object.getOwnPropertyNames(Object.getPrototypeOf(instance)))
    if (typeof instance[propertyName] === "function")
      (bind ?? instance)[propertyName] = instance[propertyName].bind(bind ?? instance);
}

export function calculatePercentage(value: string | number, major: string | number) {
  return Number(value) / Number(major) * 100;
}

const resourcesDir = join(__dirname, "..", "..", "resources");

export function getIconPath(iconName: string, iconExt = "svg") {
  return {
    dark: Uri.file(join(resourcesDir, "dark", `${iconName}.${iconExt}`)),
    light: Uri.file(join(resourcesDir, "light", `${iconName}.${iconExt}`)),
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
