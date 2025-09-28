import { existsSync } from "fs";
import { type JSONSchema7, type JSONSchema7Definition, type JSONSchema7Type } from "json-schema";
import { CompletionItem, CompletionItemKind, FileType, languages, Position, Range, Uri, workspace, type CancellationToken, type CompletionContext, type ExtensionContext, type TextDocument, type TextLine } from "vscode";
import BaseLanguageProvider from "./BaseLanguageProvider";

const assignSymbol = "=";
const comment = "# https://docs.discloud.com/en/configurations/discloud.config";
const commentPattern = /\s*#.*$/;

export default class CompletionItemProvider extends BaseLanguageProvider {
  constructor(context: ExtensionContext, schema: JSONSchema7) {
    super(context, schema);


    const disposable = languages.registerCompletionItemProvider({
      language: this.schema.$id,
      pattern: `**/${this.schema.$id}`,
      scheme: "file",
    }, {
      provideCompletionItems: (document, position, token, _context) => {
        return Promise.race([
          new Promise<any>((_, reject) => token.onCancellationRequested(reject)),
          this.provideCompletionItems(document, position, token, _context),
        ]).catch(() => []);
      },
    }, "\n", assignSymbol, "/");

    this.context.subscriptions.push(disposable);
  }

  provideCompletionItems(document: TextDocument, position: Position, _token: CancellationToken, _context: CompletionContext) {
    if (!this.schema.properties) return [];

    if (!position.character) {
      return this.scopes
        .map(scope => new CompletionItem(`${scope}=`, CompletionItemKind.Value))
        .concat(new CompletionItem(comment, CompletionItemKind.Reference));
    }

    const line = document.lineAt(position);
    const text = line.text.replace(commentPattern, "");
    const [key, value] = text.substring(0, position.character).split(assignSymbol);

    if (typeof value !== "string") return [];

    const [_, fullValue] = text.split(assignSymbol);
    const startValueIndex = key.length + 1;

    const data = this.transformConfigToJSON(document);

    let schema = this.schema;

    const maybeSchema = this.draft.getNode(key, data);

    if (maybeSchema && maybeSchema.node)
      schema = maybeSchema.node.schema;

    return this.parseSchema(schema, {
      document,
      line,
      position,
      text,
      key,
      value,
      fullValue,
      startValueIndex,
    });
  }

  async parseSchema(schema: JSONSchema7, options: ParseSchemaOptions): Promise<CompletionItem[]> {
    switch (schema.type) {
      case "array":
        const items = await this.parseSchemaArray(schema, options);
        if (schema.uniqueItems) {
          return items.filter(item => !options.value.includes(item.label.toString()));
        }
        return items;
      case "boolean":
        return this.parseSchemaBoolean(schema, options, true);
      case "integer":
      case "number":
        return this.parseSchemaNumber(schema, options, true);
      case "null":
        return [];
      case "string":
        return this.parseSchemaString(schema, options, true);
      case "object":
      default:
        return this.parseSchemaObject(schema, options);
    }
  }

  async parseSchemaArray(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.enum !== undefined) return this.parseSchemaEnum(schema, options);
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema, options);
    if (schema.items !== undefined) return this.parseSchemaItems(schema, options);
    return [];
  }

  parseSchemaBoolean(_: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    const itemFalse = new CompletionItem("false", CompletionItemKind.Keyword);
    const itemTrue = new CompletionItem("true", CompletionItemKind.Keyword);

    if (replaceValue) {
      itemFalse.range = new Range(
        new Position(options.position.line, options.startValueIndex),
        new Position(options.position.line, options.line.text.length),
      );
      itemTrue.range = new Range(
        new Position(options.position.line, options.startValueIndex),
        new Position(options.position.line, options.line.text.length),
      );
    }

    return [
      itemFalse,
      itemTrue,
    ];
  }

  parseSchemaEnum(schema: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    if (schema.enum !== undefined)
      return schema.enum.flatMap(value => this.parseSchemaType(value, options, replaceValue));
    return [];
  }

  parseSchemaExamples(schema: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    if (schema.examples !== undefined)
      return this.parseSchemaType(schema.examples, options, replaceValue);
    return [];
  }

  async parseSchemaItems(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (Array.isArray(schema.items)) {
      return Promise.all(schema.items.map(value => this.parseSchemaDefinition(value, options))).then(r => r.flat());
    } else {
      return this.parseSchemaDefinition(schema.items!, options);
    }
  }

  parseSchemaType(schema: JSONSchema7Type, options: ParseSchemaOptions, replaceValue?: boolean): CompletionItem[] {
    if (Array.isArray(schema))
      return schema.flatMap(value => this.parseSchemaType(value, options, replaceValue));

    const data = [];

    switch (typeof schema) {
      case "boolean":
      case "number":
      case "string":
        const item = new CompletionItem(`${schema}`);

        if (replaceValue) {
          item.range = new Range(
            new Position(options.position.line, options.startValueIndex),
            new Position(options.position.line, options.line.text.length),
          );
        }

        data.push(item);
        break;
    }

    return data;
  }

  parseSchemaNumber(schema: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema, options, replaceValue);
    return [];
  }

  async parseSchemaObject(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.properties !== undefined) {
      return this.parseSchemaProperties(schema, options);
    }

    return [];
  }

  async parseSchemaProperties(schema: JSONSchema7, options: ParseSchemaOptions) {
    if (schema.properties !== undefined) {
      if (schema.properties[options.key])
        return this.parseSchemaDefinition(schema.properties[options.key], options);

      return Promise.all(Object.values(schema.properties)
        .map(property => this.parseSchemaDefinition(property, options)))
        .then(r => r.flat());
    }

    return [];
  }

  async parseSchemaDefinition(schema: JSONSchema7Definition, options: ParseSchemaOptions): Promise<CompletionItem[]> {
    if (typeof schema === "boolean") return [];
    return this.parseSchema(schema, options);
  }

  async parseSchemaString(schema: JSONSchema7, options: ParseSchemaOptions, replaceValue?: boolean) {
    if (schema.enum !== undefined) return this.parseSchemaEnum(schema, options, replaceValue);
    if (schema.examples !== undefined) return this.parseSchemaExamples(schema, options, replaceValue);

    if (typeof schema.format === "string") {
      switch (schema.format) {
        case "uri-reference":
          if (typeof options.value !== "string") break;

          const startIndex = options.value.lastIndexOf("/") + 1;
          const endIndex = Math.max(options.fullValue.indexOf("/", startIndex), 0) || options.fullValue.length;
          const fullRangedIndex = options.line.text.length;
          const startPositionIndex = options.startValueIndex + startIndex;
          const endPositionIndex = options.startValueIndex + endIndex;

          const value = options.value.substring(0, startIndex);

          const rootUri = Uri.joinPath(options.document.uri, "..");
          const targetUri = Uri.joinPath(rootUri, value);

          const data: CompletionItem[] = [];

          for (const [filename, fileType] of await safeReadDirectory(targetUri)) {
            const type = fileTypeAsCompletionItemKind[fileType];

            const item = new CompletionItem(filename, type);

            const fullValueUri = Uri.joinPath(
              rootUri,
              options.fullValue.substring(0, startIndex),
              filename,
              options.fullValue.substring(endIndex),
            );

            const exists = existsSync(fullValueUri.fsPath);
            const isDirectory = fileType === FileType.Directory;

            item.sortText = `${!isDirectory}${filename}`;
            item.insertText = isDirectory ? filename + "/" : filename;
            item.range = new Range(
              new Position(options.position.line, startPositionIndex),
              new Position(options.position.line, exists ? endPositionIndex + (isDirectory ? 1 : 0) : fullRangedIndex),
            );

            data.push(item);
          }

          return data;
      }
    }

    return [];
  }
}

async function safeReadDirectory(uri: Uri) {
  try { return await workspace.fs.readDirectory(uri); }
  catch { return []; }
}

const fileTypeAsCompletionItemKind: Record<FileType, CompletionItemKind> = {
  [FileType.Unknown]: CompletionItemKind.Keyword,
  [FileType.File]: CompletionItemKind.File,
  [FileType.Directory]: CompletionItemKind.Folder,
  [FileType.SymbolicLink]: CompletionItemKind.Keyword,
};

interface ParseSchemaOptions {
  document: TextDocument
  line: TextLine
  position: Position
  text: string
  key: string
  value: string
  fullValue: string
  startValueIndex: number
}
