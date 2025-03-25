import { t } from "@vscode/l10n";
import { readFileSync } from "fs";
import type { JSONSchema7 } from "json-schema";
import { JsonEditor } from "json-schema-library";
import { parseEnv } from "util";
import { type ExtensionContext, type TextDocument } from "vscode";
import extension from "../extension";
import { DiscloudConfigScopes } from "discloud.app";

const STRING_BOOLEAN = new Set(["false", "true"]);

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
    return this.#parseValues(parseEnv(document.getText()));
  }

  validateJsonSchema(data: Record<any, any>) {
    return this.draft.validate(data);
  }

  #parseValues(obj: any) {
    if (typeof obj !== "object" || obj === null) return obj;

    let key = DiscloudConfigScopes.APT;
    if (key in obj) obj[key] = obj[key].split(/\s*,\s*/g).filter(Boolean);

    key = DiscloudConfigScopes.AUTORESTART;
    if (key in obj && STRING_BOOLEAN.has(obj[key])) obj[key] = obj[key] == true;

    key = DiscloudConfigScopes.RAM;
    if (key in obj && !isNaN(obj[key])) obj[key] = Number(obj[key]);

    return obj;
  }
}
