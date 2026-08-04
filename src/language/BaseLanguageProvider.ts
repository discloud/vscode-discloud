import { DiscloudConfigScopes } from "@discloudapp/api-types/v2";
import { readFile } from "fs/promises";
import type { JSONSchema7 } from "json-schema";
import { compileSchema, type SchemaNode } from "json-schema-library";
import { parseEnv } from "util";
import { type ExtensionContext, Position, Range, type TextDocument } from "vscode";
import { DISCLOUD_CONFIG_SCHEMA_FILE_NAME, MAX_LANGUAGE_PROVIDER_READ_LINES } from "../utils/constants";

const _booleanAsString = new Set(["false", "true"]);
const _start = new Position(0, 0);
const _end = new Position(MAX_LANGUAGE_PROVIDER_READ_LINES, 0);
const _range = new Range(_start, _end);
const _noSchemaId: symbol = Symbol("No Schema");

export default class BaseLanguageProvider {
  static readonly #schemas: Record<string, JSONSchema7> = {};
  static readonly #drafts: Map<string | symbol, SchemaNode> = new Map();

  static async getSchemaFromPath(path: string) {
    return BaseLanguageProvider.#schemas[path] ??= JSON.parse(await readFile(path, "utf8"));
  }

  static async startProviders(context: ExtensionContext) {
    const path = context.asAbsolutePath(DISCLOUD_CONFIG_SCHEMA_FILE_NAME);

    const schema = await BaseLanguageProvider.getSchemaFromPath(path);

    const { default: CompletionItemProvider } = await import("./CompletionItemProvider");
    const { default: LanguageConfigurationProvider } = await import("./LanguageConfigurationProvider");

    new CompletionItemProvider(context, schema);
    new LanguageConfigurationProvider(context, schema);
  }

  constructor(readonly context: ExtensionContext, readonly schema: JSONSchema7) {
    this.scopes = Object.keys(this.schema.properties ?? {});

    this.draft = BaseLanguageProvider.#drafts
      .getOrInsertComputed(schema.$id ?? _noSchemaId, () => compileSchema(schema));
  }

  declare readonly draft: SchemaNode;
  declare readonly scopes: string[];

  transformConfigToJSON(document: TextDocument) {
    return this.#parseValues(parseEnv(document.getText(_range)));
  }

  validateJsonSchema(data: Record<any, any>) {
    return this.draft.validate(data);
  }

  #parseValues(obj: any) {
    if (typeof obj !== "object" || obj === null) return obj;

    for (const key in obj)
      if (!obj[key]) delete obj[key];

    let key = DiscloudConfigScopes.APT;
    if (key in obj) obj[key] = obj[key].split(/\s*,\s*/g).filter(Boolean);

    key = DiscloudConfigScopes.AUTORESTART;
    if (key in obj && _booleanAsString.has(obj[key])) obj[key] = obj[key] == "true";

    key = DiscloudConfigScopes.RAM;
    if (key in obj && obj[key]) obj[key] = Number(obj[key]);

    key = DiscloudConfigScopes.VLAN;
    if (key in obj && _booleanAsString.has(obj[key])) obj[key] = obj[key] == "true";

    return obj;
  }
}
