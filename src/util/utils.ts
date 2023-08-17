import { join } from "node:path";
import { Uri } from "vscode";

export function bindFunctions(instance: any, bind?: any) {
  if (!instance) return;

  const propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance));

  for (const propertyName of propertyNames)
    if (typeof instance[propertyName] === "function")
      (bind ?? instance)[propertyName] = instance[propertyName].bind(bind ?? instance);
}

export function calculatePercentage(value: string | number, major: string | number) {
  return Number(value) / Number(major) * 100;
}

export function extractData(instance: any): Record<any, any> {
  if (!instance) return {};

  const propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).concat(Object.keys(instance));

  const data = <any>{};

  for (const propertyName of propertyNames)
    data[propertyName] = instance[propertyName];

  return data;
}

const resourcesDir = join(__dirname, "..", "..", "resources");

export function getIconPath(iconName: string, iconExt = "svg") {
  return {
    dark: Uri.file(join(resourcesDir, "dark", `${iconName}.${iconExt}`)),
    light: Uri.file(join(resourcesDir, "light", `${iconName}.${iconExt}`)),
  };
}

export function getIconName(data: any) {
  if ("online" in data)
    return data.online ? "on" :
      data.ramKilled ? "ramKilled" :
        data.exitCode === 1 ? "errorCode" :
          "off";

  if ("container" in data)
    return data.container === "Online" ? "on" :
      data.ramKilled ? "ramKilled" :
        data.exitCode === 1 ? "errorCode" :
          "off";
}

export function JSONparse<T extends any[] | Record<any, any>>(s: string) {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
