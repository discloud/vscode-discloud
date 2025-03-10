import { t } from "@vscode/l10n";
import { readFileSync } from "fs";
import type { JSONSchema7 } from "json-schema";
import { JsonEditor } from "json-schema-library";
import { parseEnv } from "util";
import { type ExtensionContext, type TextDocument } from "vscode";
import extension from "../extension";

export default class BaseLanguageProvider {
  static readonly #schemas: Record<string, JSONSchema7> = {};
  static readonly #drafts: Record<string, JsonEditor> = {};
  declare readonly draft: JsonEditor;
  declare readonly schema: JSONSchema7;
  declare readonly scopes: string[];

  constructor(readonly context: ExtensionContext, path: string) {
    if (path) {
      try {
        this.schema = BaseLanguageProvider.#schemas[path]
          ??= JSON.parse(readFileSync(context.asAbsolutePath(path), "utf8"));
        this.draft = BaseLanguageProvider.#drafts[path] ??= new JsonEditor(this.schema);
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
    return this.#processValues(parseEnv(document.getText()));
  }

  validateJsonSchema(data: Record<any, any>) {
    return this.draft.validate(data);
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
