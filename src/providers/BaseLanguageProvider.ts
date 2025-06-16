import { DiscloudConfigScopes } from "discloud.app";
import { readFile } from "fs/promises";
import type { JSONSchema7 } from "json-schema";
import { compileSchema, type SchemaNode } from "json-schema-library";
import { parseEnv } from "util";
import { type ExtensionContext, type TextDocument } from "vscode";

const STRING_BOOLEAN = new Set(["false", "true"]);

export default class BaseLanguageProvider {
  static readonly #schemas: Record<string, JSONSchema7> = {};
  static readonly #drafts: Record<string, SchemaNode> = {};
  declare readonly draft: SchemaNode;
  declare readonly scopes: string[];

  static async getSchemaFromPath(path: string) {
    return BaseLanguageProvider.#schemas[path] ??= JSON.parse(await readFile(path, "utf8"));
  }

  constructor(readonly context: ExtensionContext, readonly schema: JSONSchema7) {
    this.scopes = Object.keys(this.schema.properties ?? {});

    this.draft = schema.$id
      ? BaseLanguageProvider.#drafts[schema.$id] ??= compileSchema(schema)
      : compileSchema(schema);
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
    if (key in obj && STRING_BOOLEAN.has(obj[key])) obj[key] = obj[key] == "true";

    key = DiscloudConfigScopes.RAM;
    if (key in obj && !isNaN(obj[key])) obj[key] = Number(obj[key]);

    return obj;
  }
}
