import { readFileSync } from "fs";
import { JSONSchema7 } from "json-schema";
import { Draft07 } from "json-schema-library";
import { TextDocument } from "vscode";
import extension from "../extension";

export default class BaseLanguageProvider {
  declare readonly schema: JSONSchema7;
  declare readonly scopes: string[];

  constructor(path: string) {
    if (path) {
      try {
        this.schema = JSON.parse(readFileSync(extension.context.asAbsolutePath(path), "utf8"));
        this.scopes = Object.keys(this.schema.properties ?? {});
      } catch (error: any) {
        extension.logger.error(error);
        return;
      }
    } else {
      extension.logger.error("Missing options.path");
      return;
    }
  }

  transformConfigToJSON(document: TextDocument) {
    return this.#configToObj(document.getText());
  }

  validateJsonSchema(data: Record<any, any>) {
    return new Draft07(this.schema).validate(data);
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
      if (["AVATAR", "ID", "MAIN", "NAME", "TYPE", "VERSION"].includes(key)) continue;

      const value = obj[key];

      switch (key) {
        case "APT":
          obj[key] = value.split(/,\s?/g).filter(Boolean);
          continue;
      }

      if (!isNaN(Number(value))) {
        obj[key] = Number(value);
        continue;
      }

      if (["true", "false"].includes(value)) {
        // eslint-disable-next-line eqeqeq
        obj[key] = value == "true";
        continue;
      }
    }

    return obj;
  }
}
