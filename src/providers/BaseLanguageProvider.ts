import { t } from "@vscode/l10n";
import { readFileSync } from "fs";
import type { JSONSchema7 } from "json-schema";
import { JsonEditor } from "json-schema-library";
import { type TextDocument } from "vscode";
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
      extension.logger.error(t("missing.{input}", { input: "path" }));
      return;
    }
  }

  transformConfigToJSON(document: TextDocument) {
    return this.#configToObj(document.getText());
  }

  validateJsonSchema(data: Record<any, any>) {
    return new JsonEditor(this.schema).validate(data);
  }

  #configToObj(s: string) {
    if (typeof s !== "string") return {};

    return this.#processValues(Object.fromEntries(s
      .replace(/\s*#.*/g, "")
      .split(/[\r\n]+/)
      .filter(Boolean)
      .map(line => line.split("="))));
  }

  #processValues(obj: any) {
    if (!obj) return obj;

    for (const key in obj) {
      const value = obj[key];

      switch (key) {
        case "APT":
          obj[key] = value.split(/\s*,\s*/g).filter(Boolean);
          continue;
        case "AUTORESTART":
          if (["true", "false"].includes(value))
            obj[key] = value == "true";
          continue;
        case "RAM":
          if (!isNaN(Number(value)))
            obj[key] = Number(value);
          continue;
      }
    }

    return obj;
  }
}
