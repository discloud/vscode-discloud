import { existsSync, readdirSync } from "fs";
import { JSONSchema7, JSONSchema7Definition, JSONSchema7Type } from "json-schema";
import { dirname, join } from "path";
import { CompletionItem, CompletionItemKind, TextDocument, languages } from "vscode";
import { ProviderOptions } from "../@types";
import extension from "../extension";
import BaseLanguageProvider from "./BaseLanguageProvider";

export default class CompletionItemProvider extends BaseLanguageProvider {
  constructor(options: ProviderOptions) {
    super(options.path.toString());

    if (!this.schema) return;

    const disposable = languages.registerCompletionItemProvider(this.schema.$id!, {
      provideCompletionItems: (document, position, _token, _context) => {
        if (!this.schema.properties) return [];

        if (!position.character) {
          return this.scopes
            .map(scope => new CompletionItem(`${scope}=`, CompletionItemKind.Value))
            .concat(new CompletionItem("# https://docs.discloudbot.com/discloud.config", CompletionItemKind.Reference));
        }

        const line = document.lineAt(position);
        const text = line.text.substring(0, position.character);
        const [key, value] = text.split("=");

        return this.parseSchema(this.schema, {
          document,
          key,
          value,
        });

      },
    });

    extension.subscriptions.push(disposable);
  }

  parseSchema(schema: JSONSchema7, options: ParseSchemaOptions): CompletionItem[] {
    switch (schema.type) {
      case "array":
        const items = this.parseSchemaArray(schema, options);
        if (schema.uniqueItems) {
          const values = options.value.split(/\W+/);
          return items.filter(item => !values.includes(item.label.toString()));
        }
        return items;
      case "boolean":
        return [
          new CompletionItem("false", CompletionItemKind.Keyword),
          new CompletionItem("true", CompletionItemKind.Keyword),
        ];
      case "integer":
      case "number":
        return this.parseSchemaNumber(schema);
      case "null":
        return [];
      case "string":
        return this.parseSchemaString(schema, options);
      case "object":
      default:
        return this.parseSchemaObject(schema, options);
    }
  }

  parseSchemaArray(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.enum !== undefined) return this.parseSchemaEnum(schema);
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema);
    if (schema.items !== undefined) return this.parseSchemaItems(schema, options);
    return [];
  }

  parseSchemaEnum(schema: JSONSchema7) {
    if (schema.enum !== undefined)
      return schema.enum.flatMap(value => this.parseSchemaType(value));
    return [];
  }

  parseSchemaExamples(schema: JSONSchema7) {
    if (schema.examples !== undefined)
      return this.parseSchemaType(schema.examples);
    return [];
  }

  parseSchemaItems(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (Array.isArray(schema.items)) {
      return schema.items.flatMap(value => this.parseSchemaDefinition(value, options));
    } else {
      return this.parseSchemaDefinition(schema.items!, options);
    }
  }

  parseSchemaType(schema: JSONSchema7Type): CompletionItem[] {
    if (Array.isArray(schema)) {
      return schema.flatMap(value => this.parseSchemaType(value));
    }

    if (typeof schema === "string") {
      return [new CompletionItem(schema)];
    }

    if (typeof schema === "number") {
      return [new CompletionItem(`${schema}`)];
    }

    if (typeof schema === "boolean") {
      return [new CompletionItem(`${schema}`)];
    }

    return [];
  }

  parseSchemaNumber(schema: JSONSchema7) {
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema);
    return [];
  }

  parseSchemaObject(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.properties !== undefined) {
      return this.parseSchemaProperties(schema, options);
    }

    return [];
  }

  parseSchemaProperties(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.properties !== undefined) {
      if (schema.properties?.[options.key])
        return this.parseSchemaDefinition(schema.properties?.[options.key], options);

      return Object.values(schema.properties!).flatMap(property => this.parseSchemaDefinition(property, options));
    }

    return [];
  }

  parseSchemaDefinition(schema: JSONSchema7Definition, options: ParseSchemaOptions) {
    if (typeof schema === "boolean") return [];
    return this.parseSchema(schema, options);
  }

  parseSchemaString(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.enum !== undefined) return this.parseSchemaEnum(schema);
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema);

    if (typeof schema.format === "string") {
      switch (schema.format) {
        case "uri-reference":
          let targetPath = join(dirname(options.document.uri.fsPath), options.value);

          while (targetPath && !existsSync(targetPath)) {
            targetPath = dirname(targetPath);
          }
          if (!targetPath) return [];

          const files = readdirSync(targetPath, { withFileTypes: true });

          return files.map(file => {
            const item = new CompletionItem(file.name,
              file.isFile() ?
                CompletionItemKind.File :
                CompletionItemKind.Folder
            );

            item.sortText = `${file.isFile()}`;

            return item;
          });
      }
    }

    return [];
  }
}

interface ParseSchemaOptions {
  document: TextDocument,
  key: string
  value: string
  uniqueItems?: boolean
}
